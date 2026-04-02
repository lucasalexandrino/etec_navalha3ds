(function () {
  "use strict";

  var A = window.Armazenamento;

  /* Serviços padrão inseridos na primeira execução */
  var SERVICOS_PADRAO = [
    { nome: "Corte simples",          preco: 35 },
    { nome: "Corte + barba",          preco: 55 },
    { nome: "Barba completa",         preco: 30 },
    { nome: "Degradê / Fade",         preco: 45 },
    { nome: "Sobrancelha",            preco: 15 },
    { nome: "Pigmentação",            preco: 80 },
    { nome: "Relaxamento capilar",    preco: 70 },
    { nome: "Hidratação",             preco: 60 },
    { nome: "Pézinho (acabamento)",   preco: 20 },
    { nome: "Pacote completo",        preco: 100 },
  ];

  function normalizarServico(item) {
    if (!item || typeof item !== "object") return null;
    return {
      id:    String(item.id),
      nome:  String(item.nome || item.name || ""),
      preco: typeof item.preco === "number" ? item.preco : (parseFloat(item.preco) || 0),
    };
  }

  function listar() {
    var lista = A.carregar(A.CHAVES.SERVICOS, null);
    /* primeira vez: grava os serviços padrão */
    if (!Array.isArray(lista)) {
      lista = SERVICOS_PADRAO.map(function (s) {
        return { id: A.gerarId(), nome: s.nome, preco: s.preco };
      });
      A.salvar(A.CHAVES.SERVICOS, lista);
    }
    return lista.map(normalizarServico).filter(Boolean);
  }

  function persistir(lista) {
    A.salvar(A.CHAVES.SERVICOS, lista);
  }

  function adicionar(nome, preco) {
    var texto = (nome || "").trim();
    if (!texto) return;
    var valor = parseFloat(preco) || 0;
    var lista = listar();
    lista.push({ id: A.gerarId(), nome: texto, preco: valor });
    persistir(lista);
  }

  function remover(id) {
    persistir(listar().filter(function (s) { return s.id !== id; }));
  }

  function obterPorId(id) {
    return listar().find(function (s) { return s.id === id; });
  }

  window.Servicos = {
    listar: listar,
    adicionar: adicionar,
    remover: remover,
    obterPorId: obterPorId,
  };
})();