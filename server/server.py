import asyncio
import websockets
import settings
import os
from typing import Tuple, List, Any


# TODO: use wss instead of ws


def do_transform(transform: str, image: Any) -> Tuple[Any, bool]:
    return "image was transformed", True


async def receive_image_transform_request(websocket: websockets.WebSocketCommonProtocol, path):
    image_transform_data = await websocket.recv()
    print(
        f"Received request for image transform: {image_transform_data.transform}")

    # Do transform
    transformed, ok = do_transform(
        image_transform_data.transform, image_transform_data.image)

    await websocket.send({'transformed': transformed, 'ok': ok})

    print("Completed image transformation and sent to client")

start_server = websockets.serve(
    receive_image_transform_request,
    'localhost',
    os.getenv("WEBSOCKET_PORT")
)


asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
