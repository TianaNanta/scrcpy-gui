# React Component & Hook Contracts

**Feature**: Device Health Indicators & Status Polling  
**Date**: 2026-02-13

---

## Hook: `useDeviceHealth(deviceId: string)`

**Purpose**: Subscribe to real-time health updates for a single device.

### Signature

```typescript
import type { DeviceHealth } from '@/types/health';

function useDeviceHealth(deviceId: string): {
  health: DeviceHealth | null;
  isPolling: boolean;
  error?: string;
  refresh: () => Promise<void>;
}
```

### Implementation Notes

- Sets up listener on `device-health-update` event with deviceId filter
- Returns `null` if device not yet loaded
- `refresh()` triggers immediate ADB query (manual refresh)
- Unsubscribes on unmount

### Example Usage

```typescript
function DeviceCard({ deviceId }: Props) {
  const { health, isPolling, error, refresh } = useDeviceHealth(deviceId);

  if (!health) return <Skeleton />;
  
  return (
    <Card>
      <StatusIndicator state={health.state} />
      {health.battery && <BatteryBadge percentage={health.battery.percentage} />}
      <button onClick={refresh}>Refresh</button>
    </Card>
  );
}
```

### Hook Internal State

```typescript
const [health, setHealth] = useState<DeviceHealth | null>(null);
const [isPolling, setIsPolling] = useState(false);
const [error, setError] = useState<string | undefined>();

useEffect(() => {
  // Listen for health-update events
  const unsubscribe = listen<DeviceHealthUpdateEvent>(
    'device-health-update',
    (event) => {
      if (event.payload.deviceId === deviceId) {
        setHealth(event.payload.health);
        setIsPolling(false);
      }
    }
  );

  return unsubscribe;
}, [deviceId]);
```

---

## Hook: `useHealthPolling(enabled: boolean, config?: HealthPollingConfig)`

**Purpose**: Manage the lifecycle of the polling service (start/stop/reconfigure).

### Signature

```typescript
function useHealthPolling(
  enabled: boolean,
  config?: HealthPollingConfig
): {
  isActive: boolean;
  error?: string;
  updateConfig: (newConfig: HealthPollingConfig) => Promise<void>;
}
```

### Implementation Notes

- Called at app root or in hook-like component
- Watches `enabled` flag; starts/stops polling accordingly
- Must be called only once (prevent multiple polling instances)
- Returns config update function for runtime adjustments

### Example Usage

```typescript
function App() {
  const [showDevices, setShowDevices] = useState(false);
  
  const { isActive, updateConfig } = useHealthPolling(
    showDevices,  // Start polling only when Devices tab open
    {
      pollingIntervalUsb: 1000,
      pollingIntervalWireless: 3000,
      // ... other config
    }
  );

  return (
    <>
      <Sidebar onTabChange={(tab) => setShowDevices(tab === 'devices')} />
      {showDevices && <DeviceList pollingActive={isActive} />}
    </>
  );
}
```

### Hook Implementation Pattern

```typescript
useEffect(() => {
  if (enabled) {
    invoke('start_health_polling', { config, device_ids: [...] })
      .then(() => setIsActive(true))
      .catch(err => setError(err.message));
  } else if (isActive) {
    invoke('stop_health_polling')
      .then(() => setIsActive(false));
  }

  return () => {
    // Don't auto-stop on unmount; let parent control lifecycle
  };
}, [enabled, config]);
```

---

## Component: `DeviceStatusIndicator`

**Purpose**: Display visual indicator of device status (online/offline/connecting).

### Props

```typescript
interface DeviceStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error';
  isConnecting?: boolean;           // Show spinner overlay
  animate?: boolean;                // Animate pulsing for online state (default: true)
  className?: string;               // Optional CSS class override
}
```

### Behavior

- **online**: Green pulsing dot (if animate=true) or solid dot
- **offline**: Red/gray dot, slightly faded
- **connecting**: Loading spinner (blue), 16ms animation
- **error**: Red dot with warning icon

### Styling

Uses existing theme colors from CSS custom properties:
- `var(--color-success)` for online (green)
- `var(--color-error)` for offline/error (red)
- `var(--color-warning)` for connecting (yellow/blue)

### Example Usage

```tsx
import { DeviceStatusIndicator } from '@/components/DeviceStatusIndicator';

<DeviceStatusIndicator 
  status={health.state} 
  animate={health.state === 'online'}
/>
```

### Animation Details

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-indicator {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## Component: `DeviceInfoPopover`

**Purpose**: Display detailed health metrics in a floating popover (click-to-open).

### Props

```typescript
interface DeviceInfoPopoverProps {
  deviceId: string;
  health?: DeviceHealth;            // Optional; fetched if not provided
  isOpen: boolean;
  onClose: () => void;
  anchor?: HTMLElement;             // Position relative to this element
  placement?: 'top' | 'bottom' | 'left' | 'right'; // Default: 'bottom'
}
```

### Content Layout

```
┌─ Device Info Popover ──────────┐
│ Pixel 6 (emulator-5554)        │
│ Android 14 • TP1A.220624.014   │
├────────────────────────────────┤
│ Battery: 85% (warm, charging)  │
│ Storage: 50 GB free / 100 GB   │
│ Connection: USB, 23ms latency  │
│ Quality: Excellent             │
├────────────────────────────────┤
│ [Close]                        │
└────────────────────────────────┘
```

### State Management

```typescript
const [health, setHealth] = useState<DeviceHealth | null>(null);
const [loading, setLoading] = useState(isOpen);

useEffect(() => {
  if (isOpen) {
    invoke('get_device_health', { device_id: deviceId })
      .then(response => setHealth(response.health))
      .finally(() => setLoading(false));
  }
}, [isOpen, deviceId]);
```

### Accessibility

- Popover is a `<dialog>` element (or ARIA role="dialog")
- Escape key closes it
- Focus trap while open
- Announcements for status using `aria-live="polite"`

### Example Usage

```tsx
function DeviceCard({ deviceId, health }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <Card>
      <StatusIndicator status={health.state} />
      <span>{deviceId}</span>
      <button 
        onClick={() => setIsPopoverOpen(true)}
        aria-label="View device details"
      >
        Info
      </button>
      
      <DeviceInfoPopover
        deviceId={deviceId}
        health={health}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
      />
    </Card>
  );
}
```

---

## Component: `DeviceCardWithHealth` (Modification to existing `DeviceCard`)

**Purpose**: Enhance the existing device card with health status and warning badges.

### Modified Props

```typescript
interface DeviceCardWithHealthProps {
  // Existing props
  device: Device;
  onSelect: () => void;
  onSettings: () => void;
  
  // NEW: Health data
  health?: DeviceHealth;
  showHealthWarnings?: boolean;  // Default: true
  onInfoClick?: () => void;      // Callback for info popover
}
```

### Additions to Card Layout

```
┌─ Device Card ──────────────────────┐
│ [status indicator] Pixel 6          │
│ emulator-5554             [info]    │
│                                    │
│ [USB icon] Connected               │
│ [warning badges]                   │
│ • Battery: 85% ⚠️ (if low)        │
│ • Storage: 50GB free              │
│ • Quality: Excellent              │
│                                    │
│ [Settings] [Start Scrcpy]          │
└────────────────────────────────────┘
```

### Warning Badges

```typescript
function WarningBadges({ health }: { health: DeviceHealth }) {
  const badges = [];
  
  if (health.battery?.percentage !== undefined) {
    if (health.battery.percentage <= 5) {
      badges.push(<Badge color="error">🔴 {health.battery.percentage}%</Badge>);
    } else if (health.battery.percentage <= 10) {
      badges.push(<Badge color="warning">🟠 {health.battery.percentage}%</Badge>);
    }
  }
  
  if (health.storage?.free !== undefined) {
    const freeGb = health.storage.free / 1024 / 1024 / 1024;
    if (freeGb < 0.2) {
      badges.push(<Badge color="error">💾 Low storage</Badge>);
    }
  }
  
  return badges;
}
```

### Integration with Existing Code

```typescript
// In DeviceList.tsx
function DeviceList() {
  const [deviceHealthMap, setDeviceHealthMap] = useState({});

  const { isActive } = useHealthPolling(true); // Assuming devices tab is selected

  useEffect(() => {
    const unsubscribe = listen('device-health-update', (event) => {
      setDeviceHealthMap(prev => ({
        ...prev,
        [event.payload.deviceId]: event.payload.health
      }));
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          health={deviceHealthMap[device.id]}
          showHealthWarnings={true}
          onInfoClick={() => setSelectedDeviceForInfo(device.id)}
        />
      ))}
    </div>
  );
}
```

---

## Styling Guidelines

### CSS Classes

```css
/* Status indicator */
.device-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.device-status.online {
  background-color: var(--color-success);
  animation: pulse 2s ease-in-out infinite;
}

.device-status.offline {
  background-color: var(--color-error);
  opacity: 0.6;
}

.device-status.connecting {
  background-color: var(--color-warning);
  animation: spin 1s linear infinite;
}

/* Badges */
.health-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 4px;
}

.health-badge.error { background: var(--color-error-light); color: var(--color-error); }
.health-badge.warning { background: var(--color-warning-light); color: var(--color-warning); }

/* Popover */
.device-info-popover {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  max-width: 300px;
  z-index: 1000;
}
```

---

## Testing Checklist

- [ ] `DeviceStatusIndicator` renders correct states (online/offline/connecting/error)
- [ ] `DeviceStatusIndicator` animates pulsing for online state when animate=true
- [ ] `DeviceInfoPopover` fetches and displays health data
- [ ] `DeviceInfoPopover` closes on Escape key and click outside
- [ ] `useDeviceHealth` subscribes to updates and unsubscribes on unmount
- [ ] Warning badges appear for low battery (<10%) and low storage (<200MB)
- [ ] Device card remains responsive while polling is active
- [ ] No memory leaks from event listeners (check DevTools)
