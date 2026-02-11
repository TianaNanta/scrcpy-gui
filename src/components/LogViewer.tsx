import { Bars3Icon } from "@heroicons/react/24/outline";
import type { LogEntry } from "../types/settings";

interface LogViewerProps {
  logs: LogEntry[];
}

export default function LogViewer({ logs }: LogViewerProps) {
  return (
    <div className="tab-content">
      <header className="header">
        <Bars3Icon className="header-icon" />
        <h1>Logs</h1>
      </header>
      <section className="section">
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className={`log-entry log-${log.level.toLowerCase()}`}>
              <span className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-level">{log.level}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
