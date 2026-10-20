// One WebSocket to the backend (all messages are explained in backend/API.md)
const SERVER = 'ws://' + (location.hostname || 'localhost') + ':8080'
let socket = null

export function connect(onMessage, onOpen, onClose) {
  socket = new WebSocket(SERVER)
  socket.onopen = onOpen
  socket.onclose = onClose
  socket.onmessage = (e) => onMessage(JSON.parse(e.data))
}

export function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data))
}
