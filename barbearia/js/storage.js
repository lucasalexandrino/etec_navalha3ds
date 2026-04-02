(function () {
  "use strict";

  var CHAVES = {
    SERVICOS: "barbearia_servicos",
    AGENDAMENTOS: "barbearia_agendamentos",
  };

  function carregar(chave, padrao) {
    try {
      var bruto = localStorage.getItem(chave);
      if (!bruto) return padrao;
      return JSON.parse(bruto);
    } catch (e) {
      return padrao;
    }
  }

  function salvar(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  function gerarId() {
    return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 9);
  }

  window.Armazenamento = {
    CHAVES: CHAVES,
    carregar: carregar,
    salvar: salvar,
    gerarId: gerarId,
  };
})();
