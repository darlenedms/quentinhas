var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
var express = require("express");
var app = express();

// Setup nconf
var nconf = require("nconf");
nconf.argv().env().file({
    file: 'mailer_conf.json'
});

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
var MONTHNAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

app.get("/send", function(req, res) {
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

app.get("/ler-email", function(req, res) {
  var Imap = require('imap'),
      inspect = require('util').inspect;

  var imap = new Imap({
    user: 'quentinhasaas@gmail.com',
    password: 'quentinhas123',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.on('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;

      var d = new Date();
      imap.search([ 'UNSEEN', ['FROM', 'lucas.santos@corp.globo.com'], ['SINCE', MONTHNAMES[d.getMonth] + d.getDate() + ', ' + d.getFullYear()] ], function(err, results) {
        if (err) throw err;

        var f = imap.fetch(results, { bodies: '' });

        console.log(results);

        f.on('message', function(msg, seqno) {
          console.log(msg);
          msg.on('body', function(stream, info) {
            var buffer = '';
            stream.on('data', function(chunk) {
              buffer += chunk.toString('utf8');
            });

            stream.on('end', function() {
              mailparser.on("end", function(buffer) {
                res.end(buffer.text);
              });

              mailparser.write(buffer);
              mailparser.end();
            });
          });
        });

        f.on('error', function(err) {
          console.log('Fetch error: ' + err);
        });

        f.on('end', function() {
          console.log('Done fetching all messages!');
          imap.end();
        });
      });
    });
  });

  imap.on('error', function(err) {
    console.log(err);
  });

  imap.on('end', function() {
    res.end("ok");
  });

  imap.connect();
});

app.listen(PORT, function() {
    console.log("pid: " + PID + ", listening on *:" + PORT + "\n");
});