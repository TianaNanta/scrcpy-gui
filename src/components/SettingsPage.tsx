import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import type { ColorScheme, Theme } from "../types/settings";

const colorSchemes: ColorScheme[] = [
  { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" },
  { name: "Green", primary: "#10b981", primaryHover: "#059669" },
  { name: "Purple", primary: "#8b5cf6", primaryHover: "#7c3aed" },
  { name: "Red", primary: "#ef4444", primaryHover: "#dc2626" },
  { name: "Orange", primary: "#f97316", primaryHover: "#ea580c" },
];

interface SettingsPageProps {
  theme: Theme;
  colorScheme: ColorScheme;
  fontSize: number;
  onThemeChange: (theme: Theme) => void;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  onFontSizeChange: (size: number) => void;
}

export default function SettingsPage({
  theme,
  colorScheme,
  fontSize,
  onThemeChange,
  onColorSchemeChange,
  onFontSizeChange,
}: SettingsPageProps) {
  return (
    <div className="tab-content">
      <header className="header">
        <AdjustmentsHorizontalIcon className="header-icon" />
        <h1>Settings</h1>
      </header>

      <section className="section">
        <h2>Theme</h2>
        <div className="row">
          <div className="select-wrapper">
            <select
              key={`theme-select-${theme}`}
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as Theme)}
              className="select"
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Color Scheme</h2>
        <div className="row">
          <div className="select-wrapper">
            <select
              key={`color-select-${theme}`}
              value={colorScheme.name}
              onChange={(e) => {
                const scheme = colorSchemes.find((s) => s.name === e.target.value);
                if (scheme) onColorSchemeChange(scheme);
              }}
              className="select"
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              {colorSchemes.map((scheme) => (
                <option key={scheme.name} value={scheme.name}>
                  {scheme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Font Size</h2>
        <div className="row">
          <label className="input-label">
            Font Size (px):
            <input
              type="number"
              min="8"
              max="24"
              step="1"
              value={fontSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10);
                if (!isNaN(newSize) && newSize >= 8 && newSize <= 24) {
                  onFontSizeChange(newSize);
                }
              }}
              className="input"
              style={{ width: "120px" }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

export { colorSchemes };
