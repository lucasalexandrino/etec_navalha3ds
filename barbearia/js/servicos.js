(function () {
  "use strict";

  var A = window.Armazenamento;

  function normalizarServico(item) {
    if (!item || typeof item !== "object") return null;
    if (item.nome !== undefined) {
      return { id: String(item.id), nome: String(item.nome) };
    }
    return { id: String(item.id), nome: String(item.name || "") };
  }

  function listar() {
    var lista = A.carregar(A.CHAVES.SERVICOS, []);
    if (!Array.isArray(lista)) return [];
    return lista.map(normalizarServico).filter(Boolean);
  }

  function persistir(lista) {
    A.salvar(A.CHAVES.SERVICOS, lista);
  }

  function adicionar(nome) {
    var texto = (nome || "").trim();
    if (!texto) return;
    var lista = listar();
    lista.push({ id: A.gerarId(), nome: texto });
    persistir(lista);
  }

  function remover(id) {
    var lista = listar().filter(function (s) {
      return s.id !== id;
    });
    persistir(lista);
  }

  function obterPorId(id) {
    return listar().find(function (s) {
      return s.id === id;
    });
  }

  window.Servicos = {
    listar: listar,
    adicionar: adicionar,
    remover: remover,
    obterPorId: obterPorId,
  };
})();
