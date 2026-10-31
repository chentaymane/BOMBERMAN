// One JSON WebSocket to the server that served the page.
// handlers: { onOpen, onClose, onMessage(message) }. Call connect() again to reconnect.
export function createSocket(handlers) {
  let ws = null;

  function connect() {
    if (ws && ws.readyState !== WebSocket.CLOSED) return;
    ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
    ws.onopen = () => handlers.onOpen?.();
    ws.onclose = () => handlers.onClose?.();
    ws.onmessage = e => {
      let message;
      try { message = JSON.parse(e.data); } catch { return; }
      handlers.onMessage?.(message);
    };
  }

  function send(message) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }

  return { connect, send };
}
