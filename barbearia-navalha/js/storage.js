/**
 * storage.js — Módulo de persistência de dados
 * Responsável por ler e gravar dados no localStorage / sessionStorage.
 *
 * DECISÃO TÉCNICA:
 *  - Serviços e agendamentos → localStorage  (persistem após fechar o navegador)
 *  - Sessão                  → sessionStorage (encerra ao fechar a aba/navegador,
 *                                              forçando novo login a cada abertura)
 */

var Storage = (function () {
  "use strict";

  var CHAVES = {
    SERVICOS:     "navalha_servicos",
    AGENDAMENTOS: "navalha_agendamentos",
    SESSAO:       "navalha_sessao"
  };

  // ── localStorage ────────────────────────────────────────────────

  function carregar(chave, padrao) {
    try {
      var raw = localStorage.getItem(chave);
      if (!raw) return padrao;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[Storage] Erro ao carregar chave '" + chave + "':", e);
      return padrao;
    }
  }

  function gravar(chave, dados) {
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch (e) {
      console.error("[Storage] Erro ao gravar chave '" + chave + "':", e);
    }
  }

  // ── sessionStorage (apenas para sessão de login) ─────────────────

  function carregarSessao() {
    try {
      var raw = sessionStorage.getItem(CHAVES.SESSAO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[Storage] Erro ao carregar sessão:", e);
      return null;
    }
  }

  function gravarSessao(dados) {
    try {
      sessionStorage.setItem(CHAVES.SESSAO, JSON.stringify(dados));
    } catch (e) {
      console.error("[Storage] Erro ao gravar sessão:", e);
    }
  }

  function removerSessaoStorage() {
    sessionStorage.removeItem(CHAVES.SESSAO);
  }

  // ── API pública ──────────────────────────────────────────────────

  function getServicos()          { return carregar(CHAVES.SERVICOS, []); }
  function salvarServicos(lista)  { gravar(CHAVES.SERVICOS, lista); }

  function getAgendamentos()         { return carregar(CHAVES.AGENDAMENTOS, []); }
  function salvarAgendamentos(lista) { gravar(CHAVES.AGENDAMENTOS, lista); }

  function getSessao()        { return carregarSessao(); }
  function salvarSessao(d)    { gravarSessao(d); }
  function removerSessao()    { removerSessaoStorage(); }

  function seedServicos() {
    var existentes = getServicos();
    if (existentes.length > 0) return;

    var iniciais = [
      { id: "seed-1", nome: "Corte de Cabelo",         preco: 35,  duracao: 30 },
      { id: "seed-2", nome: "Barba",                   preco: 25,  duracao: 20 },
      { id: "seed-3", nome: "Corte + Barba",           preco: 55,  duracao: 45 },
      { id: "seed-4", nome: "Sobrancelha",             preco: 15,  duracao: 15 },
      { id: "seed-5", nome: "Hidratação Capilar",      preco: 40,  duracao: 40 }
    ];

    salvarServicos(iniciais);
  }

  function exportarTudo() {
    return {
      servicos:     getServicos(),
      agendamentos: getAgendamentos(),
      exportadoEm:  new Date().toISOString()
    };
  }

  function importarTudo(dados) {
    if (Array.isArray(dados.servicos))     salvarServicos(dados.servicos);
    if (Array.isArray(dados.agendamentos)) salvarAgendamentos(dados.agendamentos);
  }

  return {
    getServicos:        getServicos,
    salvarServicos:     salvarServicos,
    getAgendamentos:    getAgendamentos,
    salvarAgendamentos: salvarAgendamentos,
    getSessao:          getSessao,
    salvarSessao:       salvarSessao,
    removerSessao:      removerSessao,
    seedServicos:       seedServicos,
    exportarTudo:       exportarTudo,
    importarTudo:       importarTudo
  };
})();