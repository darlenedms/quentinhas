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

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err;
            var f = imap.seq.fetch('1:3', {
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                struct: true
            });

            f.on('message', function(msg, seqno) {
                console.log('Message #%d', seqno);

                var prefix = '(#' + seqno + ') ';
                msg.on('body', function(stream, info) {
                    var buffer = '';
                    stream.on('data', function(chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function() {
                        console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                    });
                });
                msg.once('attributes', function(attrs) {
                    console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                });
            });
            f.once('error', function(err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function() {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
        res.end("ok");
    });

    imap.connect();
});

app.listen(PORT, function() {
    console.log("pid: " + PID + ", listening on *:" + PORT + "\n");
});