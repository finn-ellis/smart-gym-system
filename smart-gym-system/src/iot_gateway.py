from flask import Blueprint, request, jsonify
from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading
import numpy as np
import ctypes
import os

class IoTGateway:
    """
    Software driver for managing connections from environmental sensors and biometric wristbands.
    Uses EmotiBitLib via ctypes to interface with EmotiBit boards.
    """
    def __init__(self) -> None:
        self.connectedSensors: list[SensorId] = []
        self.connectedWristbands: list[WristbandId] = []
        
        lib_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../lib/EmotiBitLib/EmotiBitLib/bin/Release/net10.0/linux-x64/publish/EmotiBitLib.so'))
        self._emotibit_lib = None
        try:
            self._emotibit_lib = ctypes.CDLL(lib_path)
            if self._emotibit_lib:
                # Define argtypes and restypes for safety
                self._emotibit_lib.InitEmotiBit.restype = None
                self._emotibit_lib.UpdateEmotiBit.restype = None
                self._emotibit_lib.ConnectEmotiBit.argtypes = [ctypes.c_char_p]
                self._emotibit_lib.DisconnectEmotiBit.restype = None
                self._emotibit_lib.IsConnected.restype = ctypes.c_bool
                self._emotibit_lib.GetDiscoveredDevicesList.restype = ctypes.c_void_p
                self._emotibit_lib.GetBatteryLevel.restype = ctypes.c_void_p
            
                # Add GetData
                self._emotibit_lib.GetData.argtypes = [ctypes.c_int]
                self._emotibit_lib.GetData.restype = ctypes.c_double

                self._emotibit_lib.InitEmotiBit()
                print("EmotiBitLib initialized successfully.")
            else:
                print(f"Warning: EmotiBitLib.so not found at {lib_path}")
        except Exception as e:
            print(f"Failed to load EmotiBitLib: {e}")

    def discover_available_boards(self) -> list[dict]:
        """
        Polls the EmotiBit network update to discover boards.
        """
        available = []
        if self._emotibit_lib:
            self._emotibit_lib.UpdateEmotiBit()
            ptr = self._emotibit_lib.GetDiscoveredDevicesList()
            if ptr:
                devices_str = ctypes.cast(ptr, ctypes.c_char_p).value.decode('utf-8')
                if devices_str:
                    for idx, dev_id in enumerate(devices_str.split(',')):
                        if dev_id:
                            print(f"[Discovery] Found EmotiBit: {dev_id}")
                            available.append({
                                "board_id": idx,
                                "name": dev_id,
                                "description": f"Autodiscovered EmotiBit Device {dev_id}"
                            })

        # Keep a stub device for fallback/UI display if no real ones found during testing
        if not available:
            print("[Discovery] No EmotiBit devices found.")
            # available.append({
            #     "board_id": 1, 
            #     "name": "EmotiBit HW Stub", 
            #     "description": "Fallback Device (Real EmotiBit not found)"
            # })
        
        return available

    def register_wristband(self, wristband_id: WristbandId, ip_address: str = "", serial_number: str = "") -> None:
        if wristband_id not in self.connectedWristbands:
            self.connectedWristbands.append(wristband_id)
            print(f"[Registration] Registering wristband: {wristband_id} (IP: {ip_address}, SN: {serial_number})")
            
        if self._emotibit_lib:
            try:
                device_id_bytes = wristband_id.encode('utf-8')
                print(f"[Connection] Attempting to connect to EmotiBit board: {wristband_id}")
                self._emotibit_lib.ConnectEmotiBit(device_id_bytes)
            except Exception as e:
                print(f"[Error] Failed to initialize EmotiBit board {wristband_id}: {e}")

    def unregister_wristband(self, wristband_id: WristbandId) -> None:
        if wristband_id in self.connectedWristbands:
            self.connectedWristbands.remove(wristband_id)
            print(f"[Registration] Unregistering wristband: {wristband_id}")
            
        if self._emotibit_lib:
            try:
                print(f"[Connection] Disconnecting EmotiBit board: {wristband_id}")
                self._emotibit_lib.DisconnectEmotiBit()
            except Exception as e:
                print(f"[Error] Failed to disconnect EmotiBit board {wristband_id}: {e}")

    def pollSensor(self, sensor_id: SensorId) -> EnvironmentalReading:
        pass

    def pollWristband(self, wristband_id: WristbandId) -> BiometricReading:
        if not self._emotibit_lib:
            return BiometricReading(wristband_id, 0.0, [], 0.0, 0.0)

        try:
            self._emotibit_lib.UpdateEmotiBit()
            is_connected = self._emotibit_lib.IsConnected()
            
            if not is_connected:
                print(f"[Polling] Wristband {wristband_id} not connected.")
                return BiometricReading(wristband_id, 0.0, [], 0.0, 0.0)
            
            # Read real data via ctypes (0 = EDA, 8 = TEMPERATURE_1, 11 = HEART_RATE)
            res_eda = self._emotibit_lib.GetData(0)
            res_temp = self._emotibit_lib.GetData(8)
            res_hr = self._emotibit_lib.GetData(11)
            
            print(f"[Polling] Wristband {wristband_id} data - HR: {res_hr}, EDA: {res_eda}, Temp: {res_temp}")
            return BiometricReading(
                wristband_id=wristband_id,
                heart_rate=res_hr,
                ppg=[0.0],
                eda=res_eda,
                temperature=res_temp
            )
        except Exception as e:
            print(f"Error polling wristband {wristband_id}: {e}")
            return BiometricReading(wristband_id, 0.0, [], 0.0, 0.0)

def create_iot_blueprint(iot_gateway: IoTGateway) -> Blueprint:
    iot_bp = Blueprint('iot', __name__)

    @iot_bp.route('/register', methods=['POST'])
    def register_device():
        """
        Endpoint for IoT devices to register themselves with the gateway.
        """
        return jsonify({"status": "success", "message": "Device registered"})

    @iot_bp.route('/telemetry', methods=['POST'])
    def receive_telemetry():
        """
        Endpoint for IoT devices to push sensor readings.
        """
        data = request.json
        return jsonify({"status": "received", "data": data})

    return iot_bp
