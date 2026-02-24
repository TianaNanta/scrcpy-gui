## Context

The scrcpy-gui application is a Tauri-based desktop app for managing Android device mirroring. Built with React and TypeScript, it uses CSS custom properties (CSS variables) for theming with light/dark mode support. The current design is functional but lacks visual refinement.

**Current State:**

- CSS variables defined in `App.css` for colors, spacing, shadows, and typography
- Components use Heroicons for icons
- Theme system supports light/dark modes with multiple color schemes
- Sidebar navigation with fixed 250px width
- Device cards in a responsive grid layout

**Constraints:**

- Must maintain backward compatibility with existing class names
- No new npm dependencies
- Must support both light and dark themes
- Performance-critical (Tauri desktop app, not web)

## Goals / Non-Goals

**Goals:**

- Implement a cohesive design system using enhanced CSS custom properties
- Add glassmorphism effects to cards, modals, and sidebar
- Create smooth micro-interactions with CSS transitions/animations
- Improve visual hierarchy across all components
- Enhance accessibility with better contrast and focus states
- Add collapsible sidebar functionality

**Non-Goals:**

- No component library migration (keeping custom components)
- No redesign of application structure or navigation flow
- No new features beyond visual/design improvements
- No mobile-responsive redesign (desktop-first Tauri app)

## Decisions

### 1. CSS Custom Properties for Design Tokens

**Decision:** Extend existing CSS variables in `:root` rather than using CSS-in-JS or a design system library.

**Rationale:**

- Already in use; minimal migration effort
- Native browser support with excellent performance
- Works seamlessly with Tauri's webview
- Easy theme switching via JavaScript property updates

**Alternatives Considered:**

- Tailwind CSS: Would require significant refactor, adds bundle size
- styled-components: Adds runtime overhead, unnecessary for this scope
- CSS Modules: Already using standard CSS, no need for scoping

### 2. Glassmorphism Implementation

**Decision:** Use CSS `backdrop-filter: blur()` with semi-transparent backgrounds.

**Implementation:**

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

**Rationale:**

- Native CSS support, no JavaScript required
- Webkit prefix ensures Tauri compatibility (uses WebView)
- Subtle effect enhances depth without being distracting

### 3. Animation Strategy

**Decision:** CSS-only animations with `prefers-reduced-motion` support.

**Implementation:**

- Transition durations: 120ms (fast), 200ms (normal), 300ms (slow)
- Cubic-bezier easing for natural feel
- Respect `prefers-reduced-motion` media query

**Rationale:**

- CSS animations are more performant than JS-based
- GPU-accelerated transforms (scale, opacity, transform)
- Accessibility-first approach

### 4. Collapsible Sidebar

**Decision:** Add toggle button to collapse sidebar to icon-only mode (64px width).

**State Management:**

- Store collapse state in `localStorage` for persistence
- Smooth width transition on toggle
- Icons remain visible when collapsed

**Rationale:**

- Gives users more screen space for device management
- Common desktop app pattern
- Low complexity addition

### 5. Color System Enhancement

**Decision:** Define semantic color tokens in addition to primitive colors.

**Token Structure:**

```css
/* Primitive colors */
--color-blue-500: #3b82f6;

/* Semantic tokens */
--surface-primary: var(--color-blue-500);
--surface-glass: rgba(255, 255, 255, 0.7);
--border-subtle: rgba(0, 0, 0, 0.1);
```

**Rationale:**

- Easier theme maintenance
- Clear intent in usage
- Single source of truth for colors

## Risks / Trade-offs

**Risk: Backdrop-filter browser support** → Mitigation: Include `-webkit-` prefix and graceful fallback (solid background) for unsupported environments

**Risk: Performance impact of blur effects** → Mitigation: Limit blur to 12px max, use on limited surfaces only, test on low-end hardware

**Risk: Design consistency across components** → Mitigation: Create reusable CSS utility classes for glass effects, shadows, and transitions

**Trade-off: File size increase** → Acceptable: CSS additions will be minimal (~2KB gzipped), no runtime cost

**Trade-off: Learning curve for glassmorphism** → Minimal: Well-documented CSS technique, straightforward implementation
