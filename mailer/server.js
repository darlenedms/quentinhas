var express = require('express');
var app = express();

var PORT = process.env.PORT || 3000;
var PID = process.pid;

app.get('/mailer', function (req, res) {
  res.send('Hello World');
});

app.listen(PORT, function() {
  console.log("pid: " + PID + ", listening on *:" + PORT + "\n");
});