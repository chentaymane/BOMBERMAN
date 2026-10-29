/** One explicitly managed JSON connection. No automatic reconnect or send queue. */
export function createJsonSocket(url) {
  let socket = null
  let reportError = error => console.error('WebSocket error:', error)

  function connect({
    onMessage, onOpen, onClose,
    onError = reportError,
    onInvalidMessage = error => console.warn('Ignored invalid WebSocket JSON:', error),
  } = {}) {
    if (socket && socket.readyState !== WebSocket.CLOSED) return false

    const endpoint = url
      ?? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`
    const current = new WebSocket(endpoint)
    socket = current
    reportError = onError
    current.onopen = event => {
      if (socket === current) onOpen?.(event)
    }
    current.onclose = event => {
      if (socket === current) onClose?.(event)
    }
    current.onerror = event => {
      if (socket === current) onError(event)
    }
    current.onmessage = event => {
      if (socket !== current) return
      let message
      try {
        message = JSON.parse(event.data)
      } catch (error) {
        onInvalidMessage(error)
        return
      }
      onMessage?.(message)
    }
    return true
  }

  function send(message) {
    if (socket?.readyState !== WebSocket.OPEN) return false
    try {
      socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      reportError(error)
      return false
    }
  }

  return { connect, send, close: (code, reason) => socket?.close(code, reason) }
}
