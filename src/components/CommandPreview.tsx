import { useState } from "react";

interface CommandPreviewProps {
  command: string;
}

export default function CommandPreview({ command }: CommandPreviewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="generated-command"
      style={{
        marginTop: "2rem",
        padding: "1rem",
        backgroundColor: "#1e1e2e",
        borderRadius: "4px",
        fontFamily: "monospace",
        color: "white",
        fontSize: "0.9rem",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <strong>Generated Command:</strong>
        <button
          onClick={copyToClipboard}
          aria-label="Copy command"
          style={{
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #555",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <code style={{ wordBreak: "break-all" }}>{command}</code>
      <span aria-live="polite" className="sr-only">
        {copied ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}
