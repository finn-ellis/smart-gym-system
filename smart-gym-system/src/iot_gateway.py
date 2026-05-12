from flask import Blueprint, request, jsonify
from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading
import numpy as np
import ctypes
import os
import threading

LIB_PATH = "/home/fellis/Code/SmartGymSystem/lib/EmotiBitLib/EmotiBitLib/bin/Release/net10.0/linux-x64/publish/EmotiBitLib.so"

class EmotiBitLib:
    _lib = None
    _lock = threading.Lock()
    
    @classmethod
    def get_lib(cls):
        with cls._lock:
            if cls._lib is None:
                if not os.path.exists(LIB_PATH):
                    print(f"Warning: EmotiBitLib.so not found at {LIB_PATH}")
                    cls._lib = None
                    return None
                    
                cls._lib = ctypes.CDLL(LIB_PATH)
                cls._lib.InitEmotiBit.restype = None
                cls._lib.UpdateEmotiBit.restype = None
                cls._lib.ConnectEmotiBit.argtypes = [ctypes.c_char_p]
                cls._lib.ConnectEmotiBit.restype = None
                cls._lib.DisconnectEmotiBit.restype = None
                cls._lib.IsConnected.restype = ctypes.c_bool
                cls._lib.GetDiscoveredDevices.restype = ctypes.c_void_p
                cls._lib.GetBatteryLevel.restype = ctypes.c_void_p
                cls._lib.GetScalarData.argtypes = [ctypes.c_int]
                cls._lib.GetScalarData.restype = ctypes.c_double
                cls._lib.FreeString.argtypes = [ctypes.c_void_p]
                cls._lib.FreeString.restype = None
                
                cls._lib.InitEmotiBit()
            return cls._lib


class IoTGateway:
    """
    Software driver for managing connections from environmental sensors and biometric wristbands.
    Uses BrainFlow to interface with EmotiBit boards.
    """
    def __init__(self) -> None:
        self.connectedSensors: list[SensorId] = []
        self.connectedWristbands: list[WristbandId] = []

    def discover_available_boards(self) -> list[dict]:
        """
        Uses EmotiBitLib NativeAOT to autodiscover EmotiBit boards on the network.
        Returns a list of board info dictionaries.
        """
        lib = EmotiBitLib.get_lib()
        if not lib:
            return []
            
        lib.UpdateEmotiBit()
        ptr = lib.GetDiscoveredDevices()
        available = []
        
        if ptr:
            devices_str = ctypes.string_at(ptr).decode('utf-8')
            lib.FreeString(ptr)
            if devices_str:
                for device_id in devices_str.split(','):
                    if device_id:
                        available.append({
                            "board_id": device_id, 
                            "name": "EmotiBit HW", 
                            "description": "Autodiscovered EmotiBit Device"
                        })
        return available

    def register_wristband(self, wristband_id: WristbandId, ip_address: str = "", serial_number: str = "") -> None:
        if wristband_id not in self.connectedWristbands:
            self.connectedWristbands.append(wristband_id)
            
        lib = EmotiBitLib.get_lib()
        if lib:
            b_device_id = wristband_id.encode('utf-8')
            lib.ConnectEmotiBit(b_device_id)

    def unregister_wristband(self, wristband_id: WristbandId) -> None:
        if wristband_id in self.connectedWristbands:
            self.connectedWristbands.remove(wristband_id)
        
        lib = EmotiBitLib.get_lib()
        if lib:
            lib.DisconnectEmotiBit()

    def pollSensor(self, sensor_id: SensorId) -> EnvironmentalReading:
        pass

    def pollWristband(self, wristband_id: WristbandId) -> BiometricReading:
        lib = EmotiBitLib.get_lib()
        if not lib or not lib.IsConnected():
            return BiometricReading(wristband_id, 0.0, [], 0.0, 0.0)

        try:
            lib.UpdateEmotiBit()
            
            # DataType enums in C# mapping (approximate based on EmotiBit documentation)
            # EDA: 0, EDL: 1, EDR: 2, PPG_INFRARED: 3, PPG_RED: 4, PPG_GREEN: 5,
            # TEMPERATURE_0: 7, HEART_RATE: 38 (HR) etc... 
            # These index values depend on how Enum.GetNames(typeof(DataTypes)) parses it.
            # In standard EmotiBit Unity, typical indexes might be different. 
            # Assuming HEART_RATE is at 38, PPG_INFRARED at 3, EDA at 0, TEMPERATURE_0 at 7
            res_hr = float(lib.GetScalarData(38))
            res_ppg = float(lib.GetScalarData(3))
            res_eda = float(lib.GetScalarData(0))
            res_temp = float(lib.GetScalarData(7))
            
            return BiometricReading(
                wristband_id=wristband_id,
                heart_rate=res_hr if res_hr > 0 else 70.0,
                ppg=[res_ppg],
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
