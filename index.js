var express = require('express');
var serveStatic = require('serve-static');
var compression = require('compression');

var app = express();

app.use(compression());
app.use(serveStatic(__dirname + '/dist'));
app.listen(8080);

console.log('Listening on :8080');
