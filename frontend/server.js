// Tiny static file server for the frontend: http://localhost:3000
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }

http
  .createServer((req, res) => {
    const url = req.url.split('?')[0]
    const file = path.join(__dirname, url === '/' ? 'index.html' : url)
    const type = TYPES[path.extname(file)]
    if (!type || !file.startsWith(__dirname + path.sep)) {
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
  })
  .listen(PORT, () => console.log('Frontend on http://localhost:' + PORT))
