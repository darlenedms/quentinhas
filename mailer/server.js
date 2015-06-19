
var ultimoCardapio = {};

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

app.get("/ultimo-cardapio", function(req, res) {
  res.end(JSON.stringify(ultimoCardapio));
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

REGEX_TAMANHO = /\d*ml/g;
REGEX_PRECO = /R\$\d*,\d*/g;

var parserTamanhos = function(linhas) {
    var saida = {};

    linhas.forEach(function(linha){
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

    linhas.forEach(function(linha){
        if (fimDoParser) { return; }

        linha = linha.trim();
        if (!linha) { return; }
        if (linha.indexOf('Salada (') != -1) { return; }
        if (linha.indexOf('TELEFONE') != -1) { fimDoParser = true; return; }

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