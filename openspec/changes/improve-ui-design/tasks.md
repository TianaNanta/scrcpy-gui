## 1. Design System Foundation

- [x] 1.1 Define color tokens in `:root` (primitive colors: blue, slate, success, error, warning)
- [x] 1.2 Define semantic color tokens (surface-primary, surface-glass, surface-elevated, border-subtle, border-default, border-strong)
- [x] 1.3 Define spacing scale tokens (space-xs: 4px, space-sm: 8px, space-md: 12px, space-lg: 16px, space-xl: 24px, space-2xl: 32px)
- [x] 1.4 Define typography scale tokens (text-heading, text-subheading, text-body, text-caption)
- [x] 1.5 Define shadow scale tokens (shadow-subtle, shadow-medium, shadow-elevated, shadow-floating)
- [x] 1.6 Define border radius tokens (radius-sm: 6px, radius-md: 10px, radius-lg: 16px, radius-full: 9999px)
- [x] 1.7 Define animation duration tokens (duration-fast: 120ms, duration-normal: 200ms, duration-slow: 300ms)
- [x] 1.8 Update dark theme color tokens in `[data-theme="dark"]` selector

## 2. Glassmorphism Utilities

- [x] 2.1 Create `.glass-card` utility class with backdrop-filter and semi-transparent background
- [x] 2.2 Add -webkit-backdrop-filter prefix for Tauri compatibility
- [x] 2.3 Create fallback solid background for unsupported backdrop-filter
- [x] 2.4 Define glass effect variants for light and dark themes

## 3. Sidebar Navigation

- [x] 3.1 Add sidebar collapse state to localStorage management
- [x] 3.2 Create sidebar toggle button component with collapse/expand icons
- [x] 3.3 Implement sidebar width transition animation (250px ↔ 64px)
- [x] 3.4 Apply glass effect styling to sidebar background
- [x] 3.5 Refine sidebar tab hover states (background color with opacity, text color change)
- [x] 3.6 Refine sidebar tab active states (higher opacity, 3px right border indicator)
- [x] 3.7 Style sidebar footer status badges with success/error colors
- [x] 3.8 Hide text labels and show only icons when sidebar is collapsed

## 4. Device List UI

- [x] 4.1 Create devices header section with title, subtitle, and action buttons
- [x] 4.2 Implement filter buttons (All, USB, Wireless) with device counts
- [x] 4.3 Style active filter button with distinct styling
- [x] 4.4 Add icons to filter buttons
- [x] 4.5 Implement search input with real-time filtering (match serial and model)
- [x] 4.6 Ensure responsive grid layout with auto-fill and min 300px columns
- [x] 4.7 Create "Pair New Device" dashed-border card component

## 5. Enhanced Components

- [x] 5.1 Refactor device card layout with clear visual hierarchy (name, badge, status at top)
- [x] 5.2 Style secondary device info (model, Android version) with caption styling
- [x] 5.3 Group health badges (battery, storage) together in device card
- [x] 5.4 Style primary action button prominently at bottom of device card
- [x] 5.5 Create loading skeleton component with shimmer animation
- [x] 5.6 Implement device list loading skeleton placeholder
- [x] 5.7 Create empty state component with icon and "Pair New Device" button
- [x] 5.8 Define primary button variant (gradient background, elevated shadow, lift on hover)
- [x] 5.9 Define secondary button variant (outlined style, transparent background, border color change on hover)
- [x] 5.10 Define icon-only button variant (square, minimal padding, centered icon)
- [x] 5.11 Style status badges with pill-shaped border radius and semantic colors

## 6. Form Controls

- [x] 6.1 Refine input field focus state (border color change, 3px rgba focus ring)
- [x] 6.2 Add input field hover state (border color indicates interactivity)
- [x] 6.3 Style input validation error state (error border color, error message below)
- [x] 6.4 Hide native select appearance and add custom dropdown arrow icon
- [x] 6.5 Style select elements to match input styling (padding, border)
- [x] 6.6 Set checkbox accent-color to primary color
- [x] 6.7 Style form labels with font-weight 500, secondary text color, caption size

## 7. Modal Dialogs

- [x] 7.1 Apply glass effect styling to modal content background
- [x] 7.2 Add elevated shadow (`--shadow-floating`) to modal
- [x] 7.3 Make modal header sticky when content exceeds viewport height
- [x] 7.4 Make modal footer sticky when content exceeds viewport height
- [x] 7.5 Ensure sticky header/footer have same background as modal content
- [x] 7.6 Style modal backdrop overlay with semi-transparent dark background

## 8. Micro-interactions

- [x] 8.1 Add button hover animation (transition background and transform over 200ms, translateY -2px for primary)
- [x] 8.2 Add card hover animation (transition shadow and border-color over 200ms, translateY -2px)
- [x] 8.3 Add button press animation (scale to 0.97 over 120ms)
- [x] 8.4 Create refresh icon spin animation for loading state
- [x] 8.5 Add button loading state (spinning loader, disabled interaction)
- [x] 8.6 Create status dot pulse animation (scale 1→1.5, opacity 1→0.6, 2s iteration)
- [x] 8.7 Add focus ring animation with smooth transition using `--color-focus-ring` token
- [x] 8.8 Implement `prefers-reduced-motion` media query support (set all durations to 0ms, limit iterations to 1)

## 9. Testing and Polish

- [ ] 9.1 Test glassmorphism effects in both light and dark themes
- [ ] 9.2 Test collapsible sidebar state persistence across app restarts
- [ ] 9.3 Verify all animations respect reduced motion preferences
- [ ] 9.4 Test responsive grid layout at various window sizes
- [ ] 9.5 Verify accessibility (keyboard navigation, focus states, contrast ratios)
- [ ] 9.6 Test performance on low-end hardware (blur effects, animations)
