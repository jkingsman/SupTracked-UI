var express = require('express');
var serveStatic = require('serve-static');
var compression = require('compression');
var https = require('https');
var fs = require('fs');

var app = express();

app.use(compression());
app.use(serveStatic(__dirname + '/dist'));


https.createServer({
  key: fs.readFileSync('ssl/key.key'),
  cert: fs.readFileSync('ssl/cert.crt'),
  ca: fs.readFileSync('ssl/bundle.ca-bundle')
}, app).listen(8080);

console.log('Listening on :8080');
