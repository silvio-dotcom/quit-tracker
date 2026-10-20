#!/usr/bin/env node
/** Serves a directory with GitHub Pages–like Cache-Control on static assets. */
import http from 'http';
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';
const port = Number(process.argv[3] || 8765);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  let fp = path.join(root, decodeURIComponent(url.pathname));
  if (fp.endsWith('/')) fp += 'index.html';
  if (!fp.startsWith(path.resolve(root))) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(fp);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'max-age=600');
    res.end(data);
  });
});

server.listen(port, () => console.log(`Serving ${path.resolve(root)} on :${port}`));
