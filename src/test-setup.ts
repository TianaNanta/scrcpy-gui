import "@testing-library/jest-dom";
import { randomFillSync } from "node:crypto";

// WebCrypto polyfill for jsdom (required by Tauri API mocks)
if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: (buf: Uint8Array) => randomFillSync(buf),
    },
  });
}
