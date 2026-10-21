// HTTP part of the server: sends the frontend files (the page, its scripts,
// styles and images) to the browser. Only files inside the frontend folder,
// and only these types, are sent. Anything else gets a 404.
const fs = require('fs')
const path = require('path')

const FRONTEND = path.join(__dirname, '..', 'frontend')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp' }

function serveFile(req, res) {
  const url = req.url.split('?')[0]
  const file = path.join(FRONTEND, url === '/' ? 'index.html' : url)
  const type = TYPES[path.extname(file)]
  if (!type || !file.startsWith(FRONTEND + path.sep)) {
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
