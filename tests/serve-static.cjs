const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const prefix = '/vajra-cutter-sutra/';
function createServer() {
  return http.createServer((req,res) => {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) {res.writeHead(404).end();return;}
    let file = path.resolve(root,pathname.slice(prefix.length) || 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
    res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'text/javascript',
      '.webmanifest':'application/manifest+json','.png':'image/png'}[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
}
module.exports = {createServer,prefix};
