from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import asyncio
import uvicorn
from .serial_manager import SerialManager

@asynccontextmanager
async def lifespan(app: FastAPI):
    serial_mgr = SerialManager()
    app.state.serial_mgr = serial_mgr
    serial_task = asyncio.create_task(serial_mgr.read_serial())
    yield
    serial_task.cancel()
    try:
        await serial_task
    except asyncio.CancelledError:
        pass
    if serial_mgr.ser and serial_mgr.ser.is_open:
        serial_mgr.ser.close()

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def get_frontend(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data_store = app.state.serial_mgr.data_store
            data = {
                "times": data_store.temp_time,
                "temps": data_store.temp_values,
                "pressures": data_store.press_values,
                "battery": 85,  # Default values since your Arduino isn't sending these
                "cpu": 23,
                "memory": 47,
                "pressure_times": data_store.press_time  # Added pressure times
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)