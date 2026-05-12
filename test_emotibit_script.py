import time
import sys
import os

# Add smart-gym-system/src to path so we can import modules correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'smart-gym-system')))

from src.iot_gateway import IoTGateway

def test_emotibit():
    print("--- Testing EmotiBit Connectivity ---")
    
    # Initialize the gateway
    gateway = IoTGateway()
    
    # 1. Discovery phase
    print("\n1. Starting discovery... waiting for devices to be found.")
    found_devices = []
    
    # Poll a few times since UDP broadcast responses might take a couple of seconds
    for _ in range(5):
        devices = gateway.discover_available_boards()
        # Filter out the stub if we want to check for real ones, but our modified logic above might already have uncommented the stub
        found_devices = [d for d in devices if d['name'] != 'EmotiBit HW Stub']
        if found_devices:
            break
        time.sleep(1)
        
    if not found_devices:
        print("Failed to discover any real EmotiBit devices. Aborting test.")
        return
        
    target_device = found_devices[0]['name']
    print(f"Successfully discovered target: {target_device}")
    
    # 2. Connection phase
    print(f"\n2. Connecting to {target_device}...")
    gateway.register_wristband(target_device)
    
    # Wait for connection to establish and data to stream
    print("Waiting for connection to establish...")
    is_connected = False
    
    for i in range(15): # wait up to 15 seconds
        time.sleep(1)
        reading = gateway.pollWristband(target_device)
        
        # Check if we got something other than the default disconnected object
        if gateway._emotibit_lib.IsConnected():
            print(f"Connection established successfully! Got polling data.")
            is_connected = True
            
            # Read a few more times to see data change
            for _ in range(3):
                time.sleep(1)
                gateway.pollWristband(target_device)
                
            break
            
        print(f"Waiting... ({i+1}/15)")
        
    if not is_connected:
        print("Failed to establish connection within timeout.")
        
    # 3. Disconnection phase
    print(f"\n3. Disconnecting from {target_device}...")
    gateway.unregister_wristband(target_device)
    time.sleep(1)
    
    # Final poll to ensure disconnected
    reading = gateway.pollWristband(target_device)
    if not gateway._emotibit_lib.IsConnected():
        print("Successfully disconnected.")
    else:
        print("Still showing as connected after unregister!")
        
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    test_emotibit()