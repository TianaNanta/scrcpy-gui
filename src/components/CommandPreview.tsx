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
    <div className="command-preview">
      <div className="command-preview-header">
        <strong>Generated Command:</strong>
        <button
          onClick={copyToClipboard}
          aria-label="Copy command"
          className="btn btn-secondary btn-sm"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <code className="command-preview-code">{command}</code>
      <span aria-live="polite" className="sr-only">
        {copied ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );
}
