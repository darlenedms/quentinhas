
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

