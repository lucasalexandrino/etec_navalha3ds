/**
 * validacao.js — Módulo de Validação de Formulários
 * Atualizado: múltiplos serviços, preço e duração obrigatórios.
 */

var Validacao = (function () {
  "use strict";

  function apenasDigitos(str) {
    return String(str).replace(/\D/g, "");
  }

  function hojeStr() {
    var d = new Date();
    var ano  = d.getFullYear();
    var mes  = String(d.getMonth() + 1).padStart(2, "0");
    var dia  = String(d.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
  }

  function combinarDataHora(data, hora) {
    if (!data || !hora) return "";
    return data + "T" + hora;
  }

  // ── Validação de Login ───────────────────────────────────────────

  function validarLogin(usuario, senha) {
    var erros = {};
    if (!usuario || !usuario.trim()) erros["login-usuario"] = "Informe seu usuário.";
    if (!senha || !senha.trim())     erros["login-senha"] = "Informe sua senha.";
    return { valido: Object.keys(erros).length === 0, erros: erros };
  }

  // ── Validação de Agendamento ─────────────────────────────────────

  /**
   * @param {Object} dados - { nome, whatsapp, servicosIds (array), data, hora }
   */
  function validarAgendamento(dados) {
    var erros = {};

    // Nome
    var nome = (dados.nome || "").trim();
    if (!nome) {
      erros["ag-nome"] = "Informe seu nome.";
    } else if (nome.length < 3) {
      erros["ag-nome"] = "Nome muito curto (mínimo 3 caracteres).";
    } else if (nome.length > 80) {
      erros["ag-nome"] = "Nome muito longo (máximo 80 caracteres).";
    }

    // WhatsApp
    var wpp = apenasDigitos(dados.whatsapp || "");
    if (!wpp) {
      erros["ag-whatsapp"] = "Informe o WhatsApp.";
    } else if (wpp.length < 10) {
      erros["ag-whatsapp"] = "WhatsApp inválido (mínimo 10 dígitos com DDD).";
    } else if (wpp.length > 15) {
      erros["ag-whatsapp"] = "WhatsApp inválido (número muito longo).";
    }

    // Serviços (array)
    var ids = dados.servicosIds || [];
    if (!ids.length) {
      erros["ag-servico"] = "Selecione ao menos um serviço.";
    }

    // Data
    if (!dados.data) {
      erros["ag-data"] = "Selecione uma data.";
    } else if (dados.data < hojeStr()) {
      erros["ag-data"] = "Não é possível agendar em datas passadas.";
    }

    // Hora
    if (!dados.hora) {
      erros["ag-hora"] = "Selecione um horário.";
    } else {
      var horaNum = parseInt(dados.hora.replace(":", ""), 10);
      if (horaNum < 800 || horaNum > 1900) {
        erros["ag-hora"] = "Horário fora do expediente (08:00 às 19:00).";
      }
    }

    // Conflito de horário
    if (!erros["ag-data"] && !erros["ag-hora"] && dados.data && dados.hora) {
      var dataHoraStr  = combinarDataHora(dados.data, dados.hora);
      var agendamentos = Storage.getAgendamentos();
      var duplicado    = agendamentos.some(function (a) { return a.dataHora === dataHoraStr; });
      if (duplicado) erros["ag-hora"] = "Este horário já está ocupado. Escolha outro.";
    }

    return { valido: Object.keys(erros).length === 0, erros: erros };
  }

  // ── Validação de Serviço ─────────────────────────────────────────

  /**
   * Preço e duração agora são obrigatórios.
   */
  function validarServico(dados) {
    var erros = {};

    var nome = (dados.nome || "").trim();
    if (!nome) {
      erros["sv-nome"] = "Informe o nome do serviço.";
    } else if (nome.length < 2) {
      erros["sv-nome"] = "Nome muito curto (mínimo 2 caracteres).";
    } else if (nome.length > 60) {
      erros["sv-nome"] = "Nome muito longo (máximo 60 caracteres).";
    }

    // Verifica duplicata
    var servicos  = Storage.getServicos();
    var nomeLower = nome.toLowerCase();
    var duplicado = servicos.some(function (s) { return s.nome.toLowerCase() === nomeLower; });
    if (!erros["sv-nome"] && duplicado) {
      erros["sv-nome"] = "Já existe um serviço com este nome.";
    }

    // Preço — obrigatório
    if (dados.preco === undefined || dados.preco === null || dados.preco === "") {
      erros["sv-preco"] = "Informe o preço do serviço.";
    } else {
      var preco = parseFloat(dados.preco);
      if (isNaN(preco) || preco < 0) {
        erros["sv-preco"] = "Preço inválido.";
      }
    }

    // Duração — obrigatória
    if (dados.duracao === undefined || dados.duracao === null || dados.duracao === "") {
      erros["sv-duracao"] = "Informe a duração em minutos.";
    } else {
      var dur = parseInt(dados.duracao, 10);
      if (isNaN(dur) || dur < 5 || dur > 480) {
        erros["sv-duracao"] = "Duração deve ser entre 5 e 480 minutos.";
      }
    }

    return { valido: Object.keys(erros).length === 0, erros: erros };
  }

  return {
    combinarDataHora:   combinarDataHora,
    apenasDigitos:      apenasDigitos,
    validarLogin:       validarLogin,
    validarAgendamento: validarAgendamento,
    validarServico:     validarServico
  };
})();
