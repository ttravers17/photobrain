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
import logging
logger = logging.getLogger('websockets')
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())


def transform_router(transform: str, image: any, **kwargs) -> Tuple[any, bool]:
    def do_rotate(image, **kwargs):
        return image.rotate(45)

    def do_nothing(image, **kwargs):
        return image

    routes = {
        'NOTHING': do_nothing,
        'ROTATE45': do_rotate
    }

    transform_fn = routes.get(transform)
    if not transform_fn:
        print("This transform function doesn't exist")
        return None, False

    transform = transform_fn(image, **kwargs)

    return transform, True


def create_PIL_image_from_buffer(image_buffer):
    image = Image.open(io.BytesIO(image_buffer))
    converted_image = image.convert('RGB')
    return converted_image


def create_buffer_from_PIL_image(transformed_image):
    buffer = io.BytesIO()
    transformed_image.save(buffer, format='JPEG', subsampling=0, quality=100)
    return buffer


async def receive_image_transform_request(websocket: websockets.WebSocketCommonProtocol, path):
    while True:
        # Wait to receive input from socket
        image_buffer = await websocket.recv()
        print("Received image buffer")

        # grab first 60 ints from buffer for transform
        transform_bytes = image_buffer[:60]
        transform = ''.join(chr(b) for b in transform_bytes if b != 0)
        print("transform:", transform)
        image_buffer = image_buffer[60:]

        image_matrix = create_PIL_image_from_buffer(image_buffer)
        print("Array made from buffer")

        # Do transform
        transformed, ok = transform_router(transform, image_matrix)

        if not ok:
            print("An error occured")
        else:
            buffer = create_buffer_from_PIL_image(transformed)
            await websocket.send(buffer.getvalue())
            print("Completed image transformation and sent to client")


if __name__ == '__main__':
    start_server = websockets.serve(
        receive_image_transform_request,
        os.getenv("HOST"),
        os.getenv("WEBSOCKET_PORT")
    )

    print(
        f"Starting up python socket server on port :{os.getenv('WEBSOCKET_PORT')}")
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
