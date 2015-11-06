var express = require('express');
var serveStatic = require('serve-static');

var app = express();

app.use(serveStatic(__dirname + '/dist'));
app.listen(8080);

console.log('Listening on :8080');
