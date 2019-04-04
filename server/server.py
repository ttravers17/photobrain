import asyncio
import websockets
import settings
import os
from typing import Tuple, List, Any
from base64 import decodestring, b64encode
import numpy as np
from PIL import Image
import io


# TODO: use wss instead of ws


# Convert Image to Base64
def im_2_b64(image):
    buff = io.BytesIO()
    image.convert('RGB')
    image.save(buff, format="JPEG")
    img_str = b64encode(buff.getvalue())
    return img_str


def do_transform(transform: str, image) -> Tuple[Any, bool]:
    return image.rotate(45), True


async def receive_image_transform_request(websocket: websockets.WebSocketCommonProtocol, path):
    image_buffer = await websocket.recv()
    print(f"Received image buffer")

    image_matrix = Image.open(io.BytesIO(image_buffer))
    print("Array made from buffer")

    # Do transform
    transformed, ok = do_transform('rotate90', image_matrix)
    encoded = im_2_b64(transformed)

    return_buffer = io.BytesIO()
    transformed.save(return_buffer, 'JPEG')

    if ok:
        await websocket.send(encoded)

    print("Completed image transformation and sent to client")

start_server = websockets.serve(
    receive_image_transform_request,
    'localhost',
    os.getenv("WEBSOCKET_PORT")
)


asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
