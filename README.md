# Quentinhas as a Service
Facilitar o pedido/entrega da vossa quentinha de cada dia...

# Mailer

Versão do Node e npm:

→ node -v
v0.12.0

→ npm -v
2.5.1

## Instalando dependências

No ubuntu: sudo apt-get install libexpat1 libexpat1-dev libicu-dev


```sh
cd mailer
npm install
```


## Configuração

Crie um arquivo mailer_conf.json em /mailer com as configurações de seu servidor smtp.

Exemplo:
{
  "host": "smtp.google.com",
  "from": "mailer_from@gmail.com",
  "to": "mailer_to@gmail.com"
}

## Start

```sh
node server.js
```
