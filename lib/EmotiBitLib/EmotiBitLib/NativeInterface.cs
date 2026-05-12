using System;
using System.Runtime.InteropServices;
using EmotiBit;

namespace EmotiBitLib
{
    public static class NativeInterface
    {
        private static EmotiBitManager? _manager;

        [UnmanagedCallersOnly(EntryPoint = "InitEmotiBit")]
        public static void InitEmotiBit()
        {
            if (_manager == null)
            {
                _manager = new EmotiBitManager();
            }
        }

        [UnmanagedCallersOnly(EntryPoint = "UpdateEmotiBit")]
        public static void UpdateEmotiBit()
        {
            _manager?.Update();
        }

        [UnmanagedCallersOnly(EntryPoint = "ConnectEmotiBit")]
        public static void ConnectEmotiBit(IntPtr deviceIdPtr)
        {
            string? deviceId = Marshal.PtrToStringAnsi(deviceIdPtr);
            if (deviceId != null)
            {
                _manager?.Connect(deviceId);
            }
        }

        [UnmanagedCallersOnly(EntryPoint = "IsConnected")]
        public static bool IsConnected()
        {
            return _manager?.IsConnected() ?? false;
        }

        [UnmanagedCallersOnly(EntryPoint = "DisconnectEmotiBit")]
        public static void DisconnectEmotiBit()
        {
            _manager?.Disconnect();
        }

        [UnmanagedCallersOnly(EntryPoint = "GetDiscoveredDevices")]
        public static IntPtr GetDiscoveredDevices()
        {
            if (_manager == null) return Marshal.StringToCoTaskMemAnsi("");
            var devices = string.Join(",", _manager.DiscoveredDevices.Keys);
            return Marshal.StringToCoTaskMemAnsi(devices);
        }

        [UnmanagedCallersOnly(EntryPoint = "GetScalarData")]
        public static double GetScalarData(int dataTypeIndex)
        {
            return _manager?.GetScalarData((DataTypes)dataTypeIndex) ?? 0.0;
        }

        [UnmanagedCallersOnly(EntryPoint = "FreeString")]
        public static void FreeString(IntPtr ptr)
        {
            Marshal.FreeCoTaskMem(ptr);
        }

        [UnmanagedCallersOnly(EntryPoint = "GetBatteryLevel")]

        public static IntPtr GetBatteryLevel()
        {
            string level = _manager?.BatteryLevel ?? "?";
            return Marshal.StringToCoTaskMemAnsi(level);
        }
    }
}
