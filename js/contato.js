(function () {
  "use strict";

  var form = document.getElementById("form-contato");
  if (!form) return;

  var feedback = document.getElementById("contato-feedback");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var nome = form.nome.value.trim();
    var numero = form.numero.value.trim();
    var email = form.email.value.trim();
    var assunto = form.assunto.value.trim();
    var mensagem = form.mensagem.value.trim();

    if (!nome || !numero || !email || !assunto || !mensagem) {
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = "Preencha todos os campos para enviar.";
      }
      return;
    }

    if (feedback) {
      feedback.hidden = false;
      feedback.textContent =
        "Mensagem registrada no protótipo. Em produção, o enviaria por e-mail ou API no servidor.";
    }

    form.reset();
  });
})();
