import { createServer } from 'node:http';
import { readFile } from 'node:fs';
import { join, extname } from 'node:path';
import { App } from 'uWebSockets.js';

const server = createServer((req, res) => {
  let filePath = join('frontend', req.url === '/' ? 'index.html' : req.url);
  const ext = extname(filePath);

  const contentType = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript'
  }[ext] || 'text/plain';

  readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found\n');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// start a uWebSocket server on port 3001 that broadcasts on the 'test1channel' channel
const uws = new App().ws('/*', {
  message: (ws, message) => {
    App().publish('test1channel', message);
  }
}).listen(3001, (token) => {
  if (token) {
    console.log('Listening on 3001');
  }
})