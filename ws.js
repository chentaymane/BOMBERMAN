// Tiny WebSocket server, no libraries. Only small text messages (enough for JSON).
const crypto = require('crypto')

const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const MAX_PAYLOAD = 4096 // bigger messages are refused
const MAX_BUFFERED = 1024 * 1024 // slow client that never reads -> kicked

// Build one frame: server -> client frames are never masked
function frame(payload, opcode = 1) {
  const data = Buffer.from(payload)
  let header
  if (data.length < 126) {
    header = Buffer.from([0x80 | opcode, data.length])
  } else if (data.length < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x80 | opcode
    header[1] = 126
    header.writeUInt16BE(data.length, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x80 | opcode
    header[1] = 127
    header.writeBigUInt64BE(BigInt(data.length), 2)
  }
  return Buffer.concat([header, data])
}

// Turn an HTTP "upgrade" request into a websocket client.
// Returns the client, or null if the handshake is invalid.
function accept(req, socket, head, onMessage, onClose) {
  const key = req.headers['sec-websocket-key']
  const upgrade = String(req.headers.upgrade || '').toLowerCase()
  if (req.method !== 'GET' || upgrade !== 'websocket' || !/^[A-Za-z0-9+/]{22}==$/.test(key || '')) {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
    return null
  }

  const hash = crypto.createHash('sha1').update(key + MAGIC).digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + hash + '\r\n\r\n'
  )
  socket.setNoDelay(true)
  socket.setKeepAlive(true, 30000) // drop dead connections

  let closed = false
  let buffer = Buffer.alloc(0)

  const client = {
    send(text) {
      if (closed || socket.destroyed) return
      if (socket.writableLength > MAX_BUFFERED) return socket.destroy()
      socket.write(frame(text))
    },
    close(code = 1000) {
      if (closed) return
      closed = true
      const body = Buffer.alloc(2)
      body.writeUInt16BE(code)
      socket.end(frame(body, 8))
    },
  }

  function onData(chunk) {
    if (closed) return
    buffer = Buffer.concat([buffer, chunk])

    // A chunk can hold several frames, or only part of one
    while (buffer.length >= 2 && !closed) {
      const fin = buffer[0] & 0x80
      const reserved = buffer[0] & 0x70
      const opcode = buffer[0] & 0x0f
      const masked = buffer[1] & 0x80
      let length = buffer[1] & 0x7f
      let offset = 2

      // Clients must mask, and we do not support extensions
      if (reserved || !masked) return client.close(1002)

      if (length === 126) {
        if (buffer.length < 4) return
        length = buffer.readUInt16BE(2)
        offset = 4
      } else if (length === 127) {
        if (buffer.length < 10) return
        const big = buffer.readBigUInt64BE(2)
        length = big > BigInt(MAX_PAYLOAD) ? MAX_PAYLOAD + 1 : Number(big)
        offset = 10
      }

      if (length > MAX_PAYLOAD) return client.close(1009) // too big
      if (!fin || opcode === 0) return client.close(1003) // no fragmented messages

      if (buffer.length < offset + 4 + length) return // wait for the rest
      const mask = buffer.subarray(offset, offset + 4)
      offset += 4

      const data = Buffer.from(buffer.subarray(offset, offset + length))
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4]
      buffer = buffer.subarray(offset + length)

      if (opcode === 1) onMessage(client, data.toString())
      else if (opcode === 8) client.close(1000) // client said bye
      else if (opcode === 9) socket.write(frame(data, 10)) // ping -> pong
      else if (opcode !== 10) client.close(1003) // binary or unknown
    }
  }

  socket.on('data', onData)
  socket.on('close', () => {
    closed = true
    onClose(client)
  })
  socket.on('error', () => socket.destroy())

  if (head && head.length) onData(head) // data sent together with the handshake
  return client
}

module.exports = { accept }
