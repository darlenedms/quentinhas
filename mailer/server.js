var ultimoCardapio = {};
var emailDasPessoasQuePediram = {};

/*------------------------------------------*/

var MailParser = require("mailparser").MailParser,
    mailparser = new MailParser();
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

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

app.post("/enviar-email", function(req, res) {
    var mailText = [];

    mailText.push(req.body.tamanho);
    mailText.push(req.body.dados);
    mailText.push(req.body.opcao);

    console.log(req.body.tamanho);

    var mailOptions = {
        from: nconf.get("from"),
        to: nconf.get("to"),
        subject: "hello world!",
        text: mailText.join('\n')
    };

    transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
            res.end("error");
        } else {
            var hoje = new Date().toJSON().slice(0,10);
            emailDasPessoasQuePediram[hoje] = emailDasPessoasQuePediram[hoje] || [];
            emailDasPessoasQuePediram[hoje].push(req.body.email);
            res.end("sent");
        }
    });
});

app.get("/ultimo-cardapio.js", function(req, res) {
  res.end('callback(' + JSON.stringify(ultimoCardapio) + ');');
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
            imap.search(['UNSEEN', ['FROM', 'miscelaniadowntown@gmail.com'],
                ['SINCE', MONTHNAMES[d.getMonth] + d.getDate() + ', ' + d.getFullYear()]
            ], function(err, results) {
                if (err) throw err;

                var f = imap.fetch(results, {
                    bodies: ''
                });

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
                                ultimoCardapio = parser(buffer.text);
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


/*------------------------------------------*/

REGEX_TAMANHO = /\d*ml/g;
REGEX_PRECO = /R\$\d*,\d*/g;

var parserTamanhos = function(linhas) {
    var saida = {};

    linhas.forEach(function(linha) {
        var matchTamanho = linha.match(REGEX_TAMANHO);
        var matchPreco = linha.match(REGEX_PRECO);

        if (matchTamanho) {
            saida[matchTamanho] = matchPreco[0];
        }
    });

    return saida;
};


var parserGrupos = function(linhas) {
    var fimDoParser = false;
    var nomeDoGrupo;
    var saida = {};

    linhas.forEach(function(linha) {
        if (fimDoParser) {
            return;
        }

        linha = linha.trim();
        if (!linha) {
            return;
        }
        if (linha.indexOf('(') == -1 && linha.indexOf(')') > 0) {
            return;
        }
        if (linha.indexOf('Salada (') != -1) {
            return;
        }
        if (linha.indexOf('TELEFONE') != -1) {
            fimDoParser = true;
            return;
        }

        if (linha.indexOf('GRUPO') != -1) {
            nomeDoGrupo = linha;
            return;
        }

        if (nomeDoGrupo) {

            saida[nomeDoGrupo] = saida[nomeDoGrupo] || [];
            saida[nomeDoGrupo].push(linha);
        }
    });

    saida['GRUPO Salada'] = ["Alface", "Tomate", "Pepino", "Cenoura ralada", "Beterraba ralada", "Cebola em rodelas"];

    return saida;
};



var parser = function(texto) {

    var linhas = texto.split('\n');

    return {
        'tamanhos': parserTamanhos(linhas),
        'grupos': parserGrupos(linhas),
    }
};


/*------------------------------------------*/


var xmpp = require('simple-xmpp');

xmpp.on('online', function(data) {
    console.log('Connected with JID: ' + data.jid.user);
    console.log('Yes, I\'m connected!');
});

xmpp.on('chat', function(from, message) {
    xmpp.send(from, 'echo: ' + message);
});

xmpp.on('error', function(err) {
    console.error(err);
});

xmpp.on('subscribe', function(from) {
    xmpp.acceptSubscription(from);
});

xmpp.connect({
        jid                 : 'quentinhasaas@gmail.com',
        password            : 'quentinhas123',
        host                : 'talk.google.com',
        port                : 5222
});

// check for incoming subscription requests
xmpp.getRoster();

app.get("/notificar-galera", function(req, res) {
    var hoje = new Date().toJSON().slice(0,10);
    
    emailDasPessoasQuePediram[hoje].forEach(function(email){
        xmpp.subscribe(email);
        xmpp.send(email, 'Sua quentinha chegou! ' + hoje);
    });
    
    res.end('ok')
});

