var express = require("express");
var app = express();

// Setup nconf
var nconf = require("nconf");
nconf.argv().env().file({file: 'mailer_conf.json'});

// SMTP Server
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var transporter = nodemailer.createTransport(smtpTransport({
  host: nconf.get("host"),
  port: 25,
  authMethod: "plain"
}));

var PORT = process.env.PORT || 3000;
var PID = process.pid;

app.get("/send", function (req, res) {
  var mailOptions = {
    from: nconf.get("from"),
    to: nconf.get("to"),
    subject: "hello world!",
    text: "Authenticated with OAuth2"
  };

  transporter.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.log(error);
      res.end("error");
    } else {
      console.log("Message sent: " + response.message);
      res.end("sent");
    }
  });
});

app.listen(PORT, function() {
  console.log("pid: " + PID + ", listening on *:" + PORT + "\n");
});