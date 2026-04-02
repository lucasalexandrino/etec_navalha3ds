/**
 * Camada compartilhada: chaves do localStorage/sessionStorage e funções de dados.
 * As páginas em deslogado/, cliente/ e barbeiro/ usam este arquivo para manter o mesmo banco local.
 */
(function (w) {
  "use strict";

  var KEY_SERVICOS = "barbearia_servicos";
  var KEY_AG = "barbearia_agendamentos";
  var KEY_SESSAO = "barbearia_sessao";
  var KEY_USUARIOS = "barbearia_usuarios";

  /** Contas mock para desenvolvimento (senha curta; não usar em produção). */
  var USUARIOS_MOCK = [
    { email: "cliente@email", senha: "1234", papel: "cliente" },
    { email: "barbeiro@email", senha: "1234", papel: "barbeiro" },
  ];

  var USUARIOS_DEMO = [
    { email: "cliente@navalha.local", senha: "Senha1234", papel: "cliente" },
    { email: "barbeiro@navalha.local", senha: "Senha5678", papel: "barbeiro" },
  ].concat(USUARIOS_MOCK);

  function load(key, padrao) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return padrao;
      return JSON.parse(raw);
    } catch (e) {
      return padrao;
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function uid() {
    return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function garantirUsuariosIniciais() {
    var u = load(KEY_USUARIOS, null);
    if (!Array.isArray(u) || u.length === 0) {
      save(KEY_USUARIOS, USUARIOS_DEMO.slice());
    }
  }

  function getUsuarios() {
    garantirUsuariosIniciais();
    var u = load(KEY_USUARIOS, []);
    if (!Array.isArray(u)) u = [];
    var alterou = false;
    USUARIOS_MOCK.forEach(function (m) {
      var norm = m.email.toLowerCase();
      var existe = false;
      for (var i = 0; i < u.length; i++) {
        if (u[i].email && u[i].email.toLowerCase() === norm) {
          existe = true;
          break;
        }
      }
      if (!existe) {
        u.push({ email: norm, senha: m.senha, papel: m.papel });
        alterou = true;
      }
    });
    if (alterou) save(KEY_USUARIOS, u);
    return u;
  }

  function encontrarUsuarioPorEmail(emailNorm) {
    var list = getUsuarios();
    for (var i = 0; i < list.length; i++) {
      if (list[i].email && list[i].email.toLowerCase() === emailNorm) {
        return list[i];
      }
    }
    return null;
  }

  function salvarNovoUsuario(usuario) {
    var list = getUsuarios();
    list.push(usuario);
    save(KEY_USUARIOS, list);
  }

  function getServicos() {
    var s = load(KEY_SERVICOS, []);
    return Array.isArray(s) ? s : [];
  }

  function getAgendamentos() {
    var a = load(KEY_AG, []);
    return Array.isArray(a) ? a : [];
  }

  function formatarDataHoraBr(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isoLocal(dataStr, horaStr) {
    if (!dataStr || !horaStr) return "";
    var d = new Date(dataStr + "T" + horaStr + ":00");
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  }

  function setSessao(papel, email) {
    sessionStorage.setItem(
      KEY_SESSAO,
      JSON.stringify({ papel: papel, email: email })
    );
  }

  function limparSessao() {
    sessionStorage.removeItem(KEY_SESSAO);
  }

  function getSessaoBruta() {
    var raw = sessionStorage.getItem(KEY_SESSAO);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /** Usuário sincronizado com cadastro, ou null. */
  function getUsuarioDaSessao() {
    var s = getSessaoBruta();
    if (!s || !s.email) return null;
    var emailNorm = String(s.email).toLowerCase().trim();
    var u = encontrarUsuarioPorEmail(emailNorm);
    if (!u || u.senha === undefined) return null;
    if (u.papel !== "cliente" && u.papel !== "barbeiro") return null;
    return u;
  }

  function getSessaoValidaCliente() {
    var u = getUsuarioDaSessao();
    return u && u.papel === "cliente" ? u : null;
  }

  function getSessaoValidaBarbeiro() {
    var u = getUsuarioDaSessao();
    return u && u.papel === "barbeiro" ? u : null;
  }

  w.NavalhaArmazenamento = {
    KEY_SERVICOS: KEY_SERVICOS,
    KEY_AG: KEY_AG,
    KEY_SESSAO: KEY_SESSAO,
    KEY_USUARIOS: KEY_USUARIOS,
    load: load,
    save: save,
    uid: uid,
    garantirUsuariosIniciais: garantirUsuariosIniciais,
    getUsuarios: getUsuarios,
    encontrarUsuarioPorEmail: encontrarUsuarioPorEmail,
    salvarNovoUsuario: salvarNovoUsuario,
    getServicos: getServicos,
    getAgendamentos: getAgendamentos,
    formatarDataHoraBr: formatarDataHoraBr,
    isoLocal: isoLocal,
    setSessao: setSessao,
    limparSessao: limparSessao,
    getSessaoBruta: getSessaoBruta,
    getUsuarioDaSessao: getUsuarioDaSessao,
    getSessaoValidaCliente: getSessaoValidaCliente,
    getSessaoValidaBarbeiro: getSessaoValidaBarbeiro,
  };
})(window);
