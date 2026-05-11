from flask import Blueprint, request, jsonify
from .datatypes import SensorId, WristbandId, EnvironmentalReading, BiometricReading
import numpy as np
try:
    from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, BrainFlowPresets
except ImportError:
    # Fallback for environments without brainflow installed during dev
    BoardShim = None
    BrainFlowInputParams = None
    BoardIds = None
    BrainFlowPresets = None


class IoTGateway:
    """
    Software driver for managing connections from environmental sensors and biometric wristbands.
    Uses BrainFlow to interface with EmotiBit boards.
    """
    def __init__(self) -> None:
        self.connectedSensors: list[SensorId] = []
        self.connectedWristbands: list[WristbandId] = []
        self._boards: dict[WristbandId, BoardShim] = {}

    def register_wristband(self, wristband_id: WristbandId, ip_address: str = "", serial_number: str = "") -> None:
        if wristband_id not in self.connectedWristbands:
            self.connectedWristbands.append(wristband_id)
            
        if BoardShim and wristband_id not in self._boards:
            params = BrainFlowInputParams()
            if ip_address:
                params.ip_address = ip_address
            if serial_number:
                params.serial_number = serial_number
            
            # For testing/demo, we might use BoardIds.SYNTHETIC_BOARD if EmotiBit isn't available
            # But the requirement specifies EMOTIBIT_BOARD
            board_id = BoardIds.EMOTIBIT_BOARD
            board = BoardShim(board_id, params)
            try:
                board.prepare_session()
                board.start_stream()
                self._boards[wristband_id] = board
            except Exception as e:
                print(f"Failed to initialize BrainFlow board {wristband_id}: {e}")

    def unregister_wristband(self, wristband_id: WristbandId) -> None:
        if wristband_id in self.connectedWristbands:
            self.connectedWristbands.remove(wristband_id)
        
        board = self._boards.pop(wristband_id, None)
        if board:
            try:
                board.stop_stream()
                board.release_session()
            except Exception as e:
                print(f"Error releasing BrainFlow session for {wristband_id}: {e}")

    def pollSensor(self, sensor_id: SensorId) -> EnvironmentalReading:
        pass

    def pollWristband(self, wristband_id: WristbandId) -> BiometricReading:
        board = self._boards.get(wristband_id)
        if not board:
            # Fallback for when hardware is not connected or initialized
            return BiometricReading(wristband_id, 0.0, [], 0.0, 0.0)

        try:
            # EmotiBit data is spread across presets
            # DEFAULT: Accel, Gyro, Mag (not needed for health yet, but used for check)
            # AUXILIARY: PPG
            # ANCILLARY: EDA, Temp
            
            # Fetch data. get_board_data() removes it from buffer.
            # In a real scenario, we'd handle the different sampling rates.
            # For now, we'll get the latest available samples.
            
            # PPG (Auxiliary)
            ppg_data = board.get_board_data(preset=BrainFlowPresets.AUXILIARY_PRESET)
            ppg_channels = BoardShim.get_ppg_channels(BoardIds.EMOTIBIT_BOARD, BrainFlowPresets.AUXILIARY_PRESET)
            
            # EDA & Temp (Ancillary)
            ancillary_data = board.get_board_data(preset=BrainFlowPresets.ANCILLARY_PRESET)
            eda_channels = BoardShim.get_eda_channels(BoardIds.EMOTIBIT_BOARD, BrainFlowPresets.ANCILLARY_PRESET)
            temp_channels = BoardShim.get_temperature_channels(BoardIds.EMOTIBIT_BOARD, BrainFlowPresets.ANCILLARY_PRESET)
            
            # Hardware-specific logic to extract Heart Rate is usually done via BrainFlow's Signal Processing
            # For simplicity in this handler, we take the mean if samples exist
            
            res_ppg = []
            if ppg_data.size > 0 and ppg_channels:
                # Just take the first PPG channel for the list
                res_ppg = ppg_data[ppg_channels[0]].tolist()
            
            res_eda = 0.0
            if ancillary_data.size > 0 and eda_channels:
                res_eda = float(np.mean(ancillary_data[eda_channels[0]]))
                
            res_temp = 0.0
            if ancillary_data.size > 0 and temp_channels:
                res_temp = float(np.mean(ancillary_data[temp_channels[0]]))

            # Simplified HR calculation or dummy if PPG processing isn't here
            # In production, BrainFlow's ML model or signal processing filters would be used.
            res_hr = 70.0 # Placeholder or derived from PPG
            
            return BiometricReading(
                wristband_id=wristband_id,
                heart_rate=res_hr,
                ppg=res_ppg[-10:], # Return last 10 samples
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
