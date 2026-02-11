# Component Visual Contracts

**Feature**: 002-ui-refinement  
**Date**: 2026-02-11

This document defines the visual contract for each modified component — the CSS
classes, states, and behaviors that constitute the public styling API.

---

## 1. Device Card (`.device-card`)

### States

| State | CSS Class | Visual Treatment |
|-------|-----------|-----------------|
| Default | `.device-card` | `--shadow-subtle`, border `transparent` |
| Hover | `.device-card:hover` | `--shadow-medium`, `translateY(-2px)`, border `var(--primary-color)` at 20% opacity |
| Online | `.device-card.online` | Border `var(--success-color)` at 30% opacity |
| Offline | `.device-card.offline` | `opacity: 0.6`, border `var(--text-secondary)` at 20% opacity |
| Active (mirroring) | `.device-card.active` | Border `var(--primary-color)`, subtle glow |
| Focus | `.device-card:focus-visible` | `2px solid var(--color-focus-ring)`, `outline-offset: 2px` |

### Status Dot (`.status-dot`)

| State | Visual |
|-------|--------|
| `.status-dot.online` | Green, pulsing animation (`@keyframes pulse-dot`) |
| `.status-dot.offline` | Gray, static |

### Connection Badge

| Type | Icon | Badge Class |
|------|------|-------------|
| USB | `ComputerDesktopIcon` | `.connection-badge.usb` |
| Wireless | `WifiIcon` | `.connection-badge.wireless` |

### Text Truncation

- `.device-serial`: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px`
- `.device-info div`: Same truncation pattern

### Empty State

When `devices.length === 0`, display `.device-list-empty`:
- Centered layout
- Heroicon illustration (`DevicePhoneMobileIcon` at 4rem)
- Heading: "No devices connected"
- Subtext: "Connect a device via USB or pair wirelessly to get started"
- Optional CTA button: "Pair New Device"

---

## 2. Sidebar (`.sidebar`)

### Tab Indicator

| State | Visual |
|-------|--------|
| `.sidebar-tab` | `color: var(--text-secondary)` |
| `.sidebar-tab:hover` | Background `rgba(--primary-color, 0.08)`, `color: var(--primary-color)` |
| `.sidebar-tab.active` | Background `rgba(--primary-color, 0.15)`, `color: var(--primary-color)`, `border-right: 3px solid var(--primary-color)` |
| Tab switch | `transition: background var(--duration-normal) var(--ease-default), color var(--duration-fast) var(--ease-default)` |

### Dependency Badges (`.dep-badge`)

| State | Visual |
|-------|--------|
| `.dep-badge.ready` | Background: `var(--status-success-bg)`, text: `var(--status-success-text)`, icon: `CheckCircleIcon` |
| `.dep-badge.not-ready` | Background: `var(--status-error-bg)`, text: `var(--status-error-text)`, icon: `XCircleIcon` |

Badge structure: `<span class="dep-badge ready"><Icon /> ADB</span>`

### Sidebar Depth

- `box-shadow: var(--shadow-elevated)` on `.sidebar`
- `backdrop-filter: blur(8px)` for frosted effect (optional, may be removed if webview performance is poor)

---

## 3. Settings Modal (`.modal-content`)

### Layout Contract

```text
┌─────────────────────────────┐
│ .modal-header (sticky top)  │  position: sticky; top: 0; z-index: 10
│  - title + device info      │
│  - Copy Command / Launch    │
│  - Close button             │
├─────────────────────────────┤
│ .modal-body (scrollable)    │  overflow-y: auto; flex: 1
│  - settings panels          │
│  - command preview          │
├─────────────────────────────┤
│ .modal-footer (sticky btm)  │  position: sticky; bottom: 0; z-index: 10
│  - action buttons           │
└─────────────────────────────┘
```

### Modal Sizing

- `max-width: 800px`
- `max-height: 85vh`
- `display: flex; flex-direction: column`
- `.modal-body { flex: 1; overflow-y: auto }`

### No Inline Styles

All styles currently in inline `style={{...}}` objects in `DeviceSettingsModal.tsx`
will be moved to CSS classes. The modal must use `var(--surface)`, `var(--text-primary)`,
`var(--border-color)` etc. — no hardcoded hex colors.

---

## 4. Settings Panel (`.settings-panel`)

### Expand/Collapse Animation

| State | CSS |
|-------|-----|
| Collapsed | `.panel-content { max-height: 0; overflow: hidden; opacity: 0 }` |
| Expanded | `.panel-content.expanded { max-height: 1000px; opacity: 1 }` |
| Transition | `transition: max-height var(--duration-slow) var(--ease-default), opacity var(--duration-normal) var(--ease-default)` |

### Chevron Rotation

- Collapsed: `transform: rotate(0deg)`
- Expanded: `transform: rotate(180deg)`
- Transition: `transition: transform var(--duration-normal) var(--ease-default)`

### Panel Input Styling

All inputs within `.panel-content` must use:
- `background: var(--input-bg)`
- `color: var(--text-primary)`
- `border: 1px solid var(--border-color)`
- `border-radius: var(--radius-sm)`
- Theme-adaptive (no hardcoded `#1e1e2e`, `#333`, `white`)

---

## 5. Buttons (`.btn`)

### Press Feedback

```css
.btn:active:not(:disabled) {
    transform: scale(0.97);
    transition: transform var(--duration-fast) var(--ease-default);
}
```

### Loading State (`.btn.loading`)

- Content replaced with spinner (CSS-only rotating border animation)
- `pointer-events: none`
- Original text hidden, spinner centered

---

## 6. Loading States

### Device List Loading Skeleton (`.skeleton`)

When `loading === true` and `devices.length === 0`:
- Display 3 skeleton card placeholders
- Each skeleton: `background: linear-gradient(90deg, var(--surface) 25%, var(--border-color) 50%, var(--surface) 75%)`
- Animate with `@keyframes shimmer` (background-position shift)
- Same dimensions as `.device-card`

### Refresh Button Spinner

When refresh is in progress:
- `ArrowPathIcon` receives `.spin` class
- `@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`
- Duration: `1s`, timing: `linear`, iteration: `infinite`

---

## 7. Global Typography Classes

| Class | Font Size Token | Weight | Color |
|-------|-----------------|--------|-------|
| `.text-heading` | `--text-heading` | 600 | `var(--text-primary)` |
| `.text-subheading` | `--text-subheading` | 500 | `var(--text-primary)` |
| `.text-body` | `--text-body` | 400 | `var(--text-primary)` |
| `.text-caption` | `--text-caption` | 400 | `var(--text-secondary)` |

These classes are optional utilities. Components may also reference the tokens
directly in their own CSS rules.
