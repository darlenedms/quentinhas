$('#cadastro').submit(function(e, data) {
    e.preventDefault();

    // if (!valid) {
    //     alert("Todos os campos marcados com asterisco são obrigatórios.");
    //     return;
    // }

    var i,
    qtdInputs,
    inputs = $('input[type="text"]');

    qtdInputs = inputs.length;

    for (i = 0; i < qtdInputs; i++) {
        localforage.setItem($(inputs[i]).attr("name"),
                            $(inputs[i]).val(), callBack);
    }
    localforage.setItem("empresa", $('#empresa').val());
});
var callBack = function(err, value) {
    if (err) {
        console.log(err);
    } else {
        location.href = "/";
        console.log(value);
    }
};