import type { Device } from "../types/device";

interface PairDeviceModalProps {
  devices: Device[];
  deviceIp: string;
  devicePort: number;
  pairMode: "usb" | "wireless" | null;
  selectedUsbDevice: string;
  onClose: () => void;
  onSetPairMode: (mode: "usb" | "wireless" | null) => void;
  onSetDeviceIp: (ip: string) => void;
  onSetDevicePort: (port: number) => void;
  onSetSelectedUsbDevice: (serial: string) => void;
  onStartMirroringUsb: (serial: string) => void;
  onConnectWireless: () => void;
}

export default function PairDeviceModal({
  devices,
  deviceIp,
  devicePort,
  pairMode,
  selectedUsbDevice,
  onClose,
  onSetPairMode,
  onSetDeviceIp,
  onSetDevicePort,
  onSetSelectedUsbDevice,
  onStartMirroringUsb,
  onConnectWireless,
}: PairDeviceModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pair New Device</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!pairMode ? (
            <div className="pair-options">
              <button className="btn btn-primary" onClick={() => onSetPairMode("usb")}>
                Connect via USB
              </button>
              <button className="btn btn-primary" onClick={() => onSetPairMode("wireless")}>
                Connect via Wireless
              </button>
            </div>
          ) : pairMode === "usb" ? (
            <div className="pair-usb">
              <p>USB devices are automatically detected. Select a device to mirror:</p>
              <select
                value={selectedUsbDevice}
                onChange={(e) => onSetSelectedUsbDevice(e.target.value)}
                className="select"
              >
                <option value="">Select USB device</option>
                {devices
                  .filter((d) => d.status === "device" && !d.is_wireless)
                  .map((d) => (
                    <option key={d.serial} value={d.serial}>
                      {d.serial} {d.model ? `(${d.model})` : ""}
                    </option>
                  ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedUsbDevice) onStartMirroringUsb(selectedUsbDevice);
                  onClose();
                }}
              >
                Start Mirroring
              </button>
            </div>
          ) : (
            <div className="pair-wireless">
              <label className="input-label">
                Device IP Address:
                <input
                  type="text"
                  placeholder="192.168.1.100"
                  value={deviceIp}
                  onChange={(e) => onSetDeviceIp(e.target.value)}
                  className="input"
                />
              </label>
              <label className="input-label">
                Port:
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  value={devicePort}
                  onChange={(e) => onSetDevicePort(Number(e.target.value))}
                  className="input"
                  style={{ width: "120px" }}
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onConnectWireless();
                  onClose();
                }}
              >
                Connect
              </button>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => {
              onSetPairMode(null);
              onClose();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
