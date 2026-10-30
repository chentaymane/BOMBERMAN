// Serve the frontend and the local mini-framework on the same origin.
const fs = require('fs')
const path = require('path')

const FRONTEND = path.resolve(__dirname, '../../../frontend')
const FRAMEWORK = path.resolve(__dirname, '../../../../packages/mini-fw')
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
}

function serveFile(req, res) {
  let url
  try {
    url = decodeURIComponent(req.url.split('?')[0])
    if (url.includes('\0')) throw new Error('Invalid path')
  } catch {
    res.writeHead(400)
    return res.end('Invalid URL')
  }
  const framework = url.startsWith('/mini-fw/')
  const root = framework ? FRAMEWORK : FRONTEND
  const relative = framework ? url.slice('/mini-fw/'.length) : url.slice(1)
  const file = path.resolve(root, url === '/' ? 'index.html' : relative)
  const type = CONTENT_TYPES[path.extname(file)]
  if (!type || !file.startsWith(root + path.sep) || (framework && path.extname(file) !== '.js')) {
    res.writeHead(404)
    return res.end('Not found')
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end('Not found')
    }
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
}

module.exports = { serveFile }
