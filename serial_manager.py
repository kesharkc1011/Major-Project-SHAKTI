import serial
from backend.data_store import DataStore
import asyncio

class SerialManager:
    def __init__(self):
        self.ser = None
        self.data_store = DataStore()
        self.connect()
        
    def connect(self):
        try:
            self.ser = serial.Serial('COM4', 9600, timeout=1)
            print("Connected to Arduino on COM4")
        except Exception as e:
            print(f"Connection failed: {str(e)}")
            self.ser = None

    async def read_serial(self):
        while True:
            try:
                if self.ser and self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8').strip()
                    if line and (line.startswith("TEMP") or line.startswith("PRESS")):
                        parts = line.split(",")
                        if len(parts) == 3:
                            data_type = parts[0].strip()
                            time_val = float(parts[1].strip())
                            value = float(parts[2].strip())
                            self.data_store.add_data(data_type, time_val, value)
                            print(f"{data_type}: {time_val}s, Value: {value}")
                elif not self.ser:
                    self.connect()
            except Exception as e:
                print(f"Error: {str(e)}")
                self.ser = None
            await asyncio.sleep(0.1)