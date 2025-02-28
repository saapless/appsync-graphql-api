export function getWSClient() {
  if (typeof window !== "undefined") {
    // @ts-expect-error: Browser support
    return window.WebSocket || window.MozWebSocket;
  }

  if (typeof global !== "undefined") {
    // @ts-expect-error: Browser support
    return global.WebSocket || global.MozWebSocket;
  }

  throw new Error("Missing WebSocket implementation");
}
