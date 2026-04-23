/**
 * app.js — Orquestrador principal da aplicação
 * - Múltiplos serviços por agendamento
 * - Horários clicáveis com filtro manhã/tarde
 * - Cards de estatísticas do barbeiro
 * - Aba "Concluídos" separada
 * - Resumo financeiro apenas de pendentes
 *
 * CORREÇÕES v2.2:
 *  - Bug 2/3/6: Listeners de submit acumulavam em logins consecutivos (causa
 *               raiz de todos os disparos duplos). Resolvido com cloneNode
 *               nos forms antes de adicionar listener, garantindo exatamente
 *               um handler por sessão.
 *  - Bug 4:     "Meus Agendamentos" filtrado pelo ID da sessão (não pelo nome
 *               digitado pelo cliente) e exibe data, hora e serviço.
 *  - Bug 5:     Logout reseta calendário (Calendario.resetar()), filtros de
 *               período (volta para "Todos") e horários renderizados.
 */

(function () {
  "use strict";

  // ── Usuários fixos ───────────────────────────────────────────────
  var USUARIOS = [
    { usuario: "cliente",  senha: "cliente123",  papel: "cliente",  nome: "Cliente Demo" },
    { usuario: "barbeiro", senha: "barbeiro123", papel: "barbeiro", nome: "João Barbeiro" }
  ];

  // ── Estado ───────────────────────────────────────────────────────
  var sessaoAtual = null;

  // ── Inicialização ────────────────────────────────────────────────

  function init() {
    Storage.seedServicos();
    inicializarLogin();

    var sessaoSalva = Storage.getSessao();
    if (sessaoSalva) {
      sessaoAtual = sessaoSalva;
      abrirApp();
    }
  }

  // ── Login ────────────────────────────────────────────────────────

  function inicializarLogin() {
    var formLogin = document.getElementById("form-login");
    if (!formLogin) return;

    // cloneNode garante um único listener mesmo se init() for chamado mais de uma vez
    var novoForm = formLogin.cloneNode(true);
    formLogin.parentNode.replaceChild(novoForm, formLogin);
    novoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      tentarLogin();
    });
  }

  function tentarLogin() {
    var usuario = document.getElementById("login-usuario").value.trim();
    var senha   = document.getElementById("login-senha").value;

    UI.erroNoCampo("login-usuario", "");
    UI.erroNoCampo("login-senha", "");
    var erroGeral = document.getElementById("login-erro");
    if (erroGeral) erroGeral.hidden = true;

    var resultado = Validacao.validarLogin(usuario, senha);
    if (!resultado.valido) {
      Object.keys(resultado.erros).forEach(function (campo) {
        UI.erroNoCampo(campo, resultado.erros[campo]);
      });
      return;
    }

    var encontrado = null;
    for (var i = 0; i < USUARIOS.length; i++) {
      if (USUARIOS[i].usuario === usuario && USUARIOS[i].senha === senha) {
        encontrado = USUARIOS[i];
        break;
      }
    }

    if (!encontrado) {
      if (erroGeral) {
        erroGeral.textContent = "Usuário ou senha incorretos.";
        erroGeral.hidden = false;
      }
      return;
    }

    sessaoAtual = {
      usuario: encontrado.usuario,
      papel:   encontrado.papel,
      nome:    encontrado.nome
    };
    Storage.salvarSessao(sessaoAtual);
    abrirApp();
  }

  // ── Abrir aplicação ──────────────────────────────────────────────

  function abrirApp() {
    var infoUsuario = document.getElementById("info-usuario");
    if (infoUsuario) {
      var papelLabel = sessaoAtual.papel === "barbeiro" ? "Barbeiro" : "Cliente";
      infoUsuario.textContent = papelLabel + ": " + sessaoAtual.nome;
    }

    UI.mostrarPainel(sessaoAtual.papel);

    if (sessaoAtual.papel === "cliente") {
      inicializarCliente();
    } else {
      inicializarBarbeiro();
    }

    inicializarGlobais();
  }

  // ── Eventos Globais ──────────────────────────────────────────────

  function inicializarGlobais() {
    var btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      var novoBtn = btnLogout.cloneNode(true);
      btnLogout.parentNode.replaceChild(novoBtn, btnLogout);
      novoBtn.addEventListener("click", fazerLogout);
    }

    var linkPolitica   = document.getElementById("link-politica");
    var btnFecharModal = document.getElementById("btn-fechar-modal");
    var modalOverlay   = document.getElementById("modal-politica");

    if (linkPolitica) {
      var novoLink = linkPolitica.cloneNode(true);
      linkPolitica.parentNode.replaceChild(novoLink, linkPolitica);
      novoLink.addEventListener("click", function (e) {
        e.preventDefault();
        UI.abrirModal("modal-politica");
      });
    }
    if (btnFecharModal) {
      var novoBtnFM = btnFecharModal.cloneNode(true);
      btnFecharModal.parentNode.replaceChild(novoBtnFM, btnFecharModal);
      novoBtnFM.addEventListener("click", function () {
        UI.fecharModal("modal-politica");
      });
    }
    if (modalOverlay) {
      modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay) UI.fecharModal("modal-politica");
      });
    }
  }

  // ── Logout ───────────────────────────────────────────────────────

  function fazerLogout() {
    Storage.removerSessao();
    sessaoAtual = null;

    // ── Reset do painel cliente ──────────────────────────────────

    // 1. Calendário: volta para mês atual, sem dia selecionado
    if (typeof Calendario !== "undefined" && Calendario.resetar) {
      Calendario.resetar();
    }

    // 2. Campo data selecionada
    var inputData = document.getElementById("ag-data");
    if (inputData) {
      inputData.value = "";
      inputData.classList.remove("invalido");
    }

    // 3. Filtro de horários: volta para "Todos"
    var filtrosBtns = document.querySelectorAll(".filtro-periodo");
    filtrosBtns.forEach(function (b) {
      b.classList.remove("ativo");
      if (b.getAttribute("data-periodo") === "todos") b.classList.add("ativo");
    });

    // 4. Horários: limpa grade e torna todos visíveis, sem seleção
    var gradeHorarios = document.getElementById("grade-horarios");
    if (gradeHorarios) {
      gradeHorarios.querySelectorAll(".horario-btn").forEach(function (b) {
        b.classList.remove("selecionado");
        b.removeAttribute("hidden");
      });
    }

    // 5. Formulário de agendamento
    var formAg = document.getElementById("form-agendamento");
    if (formAg) {
      formAg.reset();
      UI.limparErros(formAg);
      ["erro-ag-servico", "erro-ag-hora", "erro-ag-data"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = "";
      });
    }

    // 6. Seleção visual de serviços
    document.querySelectorAll(".servico-card.selecionado").forEach(function (c) {
      c.classList.remove("selecionado");
      c.setAttribute("aria-checked", "false");
    });

    // 7. Hidden input de hora
    var inputHora = document.getElementById("ag-hora");
    if (inputHora) inputHora.value = "";

    // 8. Total de serviços
    var totalEl = document.getElementById("total-servicos");
    if (totalEl) totalEl.hidden = true;

    // ── Reset do painel barbeiro ─────────────────────────────────

    var formSv = document.getElementById("form-servico");
    if (formSv) {
      formSv.reset();
      UI.limparErros(formSv);
      ["sv-nome", "sv-preco", "sv-duracao"].forEach(function (id) {
        var el = document.getElementById("erro-" + id);
        if (el) el.textContent = "";
        var campo = document.getElementById(id);
        if (campo) campo.classList.remove("invalido");
      });
    }

    // ── Reset do formulário de login ─────────────────────────────

    var formLogin = document.getElementById("form-login");
    if (formLogin) {
      formLogin.reset();
      UI.limparErros(formLogin);
    }
    var erroGeral = document.getElementById("login-erro");
    if (erroGeral) erroGeral.hidden = true;

    UI.mostrarLogin();
    UI.toast("Você saiu da conta.", "info");
  }

  // ── Painel Cliente ───────────────────────────────────────────────

  function inicializarCliente() {
    Calendario.inicializar();
    UI.renderServicosCliente();
    UI.renderHorarios(null);
    UI.inicializarFiltrosPeriodo();
    renderMeusAg();

    // cloneNode no form elimina qualquer listener de sessão anterior,
    // garantindo que submeterAgendamento() seja chamado exatamente uma vez.
    var formAg = document.getElementById("form-agendamento");
    if (!formAg) return;
    var novoFormAg = formAg.cloneNode(true);
    formAg.parentNode.replaceChild(novoFormAg, formAg);

    // Reatribui referências de elementos filhos que precisam de eventos
    UI.renderServicosCliente();   // reconstrói cards na nova cópia do form
    UI.renderHorarios(null);      // reconstrói botões de horário
    UI.inicializarFiltrosPeriodo();

    novoFormAg.addEventListener("submit", function (e) {
      e.preventDefault();
      submeterAgendamento();
    });
  }

  // ── Submissão de Agendamento ─────────────────────────────────────

  function submeterAgendamento() {
    var formAg = document.getElementById("form-agendamento");

    // Limpa TODOS os erros antes de validar
    UI.limparErros(formAg);
    ["erro-ag-servico", "erro-ag-hora", "erro-ag-data"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    ["ag-nome", "ag-whatsapp", "ag-data"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("invalido");
    });

    if (Storage.getServicos().length === 0) {
      UI.toast("Nenhum serviço disponível. Aguarde o barbeiro cadastrar.", "erro");
      return;
    }

    var servicosSelecionados = UI.getServicosSelecionados();

    var dados = {
      nome:        document.getElementById("ag-nome").value,
      whatsapp:    document.getElementById("ag-whatsapp").value,
      servicosIds: servicosSelecionados.map(function (s) { return s.id; }),
      data:        document.getElementById("ag-data").value,
      hora:        document.getElementById("ag-hora").value
    };

    var resultado = Validacao.validarAgendamento(dados);

    if (!resultado.valido) {
      Object.keys(resultado.erros).forEach(function (campo) {
        var elErro = document.getElementById("erro-" + campo);
        if (elErro) {
          elErro.textContent = resultado.erros[campo];
        } else {
          UI.erroNoCampo(campo, resultado.erros[campo]);
        }
        var elCampo = document.getElementById(campo);
        if (elCampo && elCampo.tagName === "INPUT") {
          elCampo.classList.add("invalido");
        }
      });
      // Um único toast de erro
      UI.toast("Corrija os erros no formulário.", "erro");
      return;
    }

    // ── Dados válidos: salva o agendamento ───────────────────────

    var nomeServico  = servicosSelecionados.map(function (s) { return s.nome; }).join(", ");
    var precoServico = servicosSelecionados.reduce(function (acc, s) {
      return acc + (parseFloat(s.preco) || 0);
    }, 0);

    var novoAg = {
      id:           UI.uid(),
      usuarioId:    sessaoAtual ? sessaoAtual.usuario : "",   // Bug 4: chave de filtro
      nomeCliente:  dados.nome.trim(),
      whatsapp:     Validacao.apenasDigitos(dados.whatsapp),
      dataHora:     Validacao.combinarDataHora(dados.data, dados.hora),
      idServico:    dados.servicosIds.join(","),
      nomeServico:  nomeServico,
      precoServico: precoServico,
      profissional: "João Barbeiro",
      concluido:    false
    };

    var lista = Storage.getAgendamentos();
    lista.push(novoAg);
    Storage.salvarAgendamentos(lista);

    // Reset do formulário após salvar
    formAg.reset();
    document.querySelectorAll(".servico-card.selecionado").forEach(function (c) {
      c.classList.remove("selecionado");
      c.setAttribute("aria-checked", "false");
    });
    document.querySelectorAll(".horario-btn.selecionado").forEach(function (b) {
      b.classList.remove("selecionado");
    });
    var inputHora = document.getElementById("ag-hora");
    if (inputHora) inputHora.value = "";
    var totalEl = document.getElementById("total-servicos");
    if (totalEl) totalEl.hidden = true;

    Calendario.atualizar();
    renderMeusAg();

    // Somente o toast de sucesso
    UI.toast("Agendamento confirmado com sucesso!", "sucesso", 4000);
  }

  // ── Meus Agendamentos ────────────────────────────────────────────

  function renderMeusAg() {
    // Bug 4: filtra pelo usuarioId da sessão (confiável) e não pelo nome digitado
    var usuarioId = sessaoAtual ? sessaoAtual.usuario : "";
    UI.renderMeusAgendamentos(usuarioId, function (id) {
      cancelarAgendamentoCliente(id);
    });
  }

  function cancelarAgendamentoCliente(id) {
    var lista = Storage.getAgendamentos().filter(function (a) { return a.id !== id; });
    Storage.salvarAgendamentos(lista);
    Calendario.atualizar();
    renderMeusAg();
    UI.toast("Agendamento cancelado.", "cancelamento");
  }

  // ── Painel Barbeiro ──────────────────────────────────────────────

  function inicializarBarbeiro() {
    UI.atualizarStats();
    renderAgBarbeiro();
    renderConcluidos();
    inicializarFormServico();
    inicializarFiltros();
    inicializarAbas();
    UI.renderServicosAdmin(excluirServico);
  }

  function irParaAba(nomeAba) {
    document.querySelectorAll(".aba-btn").forEach(function (b) {
      b.classList.remove("ativa");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".aba-conteudo").forEach(function (c) {
      c.classList.remove("ativa");
    });
    var btnAlvo      = document.querySelector('.aba-btn[data-aba="' + nomeAba + '"]');
    var conteudoAlvo = document.getElementById("aba-" + nomeAba);
    if (btnAlvo)      { btnAlvo.classList.add("ativa");      btnAlvo.setAttribute("aria-selected", "true"); }
    if (conteudoAlvo) conteudoAlvo.classList.add("ativa");
  }

  function inicializarAbas() {
    document.querySelectorAll(".aba-btn").forEach(function (btn) {
      var novoBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(novoBtn, btn);
      novoBtn.addEventListener("click", function () {
        irParaAba(novoBtn.getAttribute("data-aba"));
      });
    });
  }

  function inicializarFormServico() {
    var form = document.getElementById("form-servico");
    if (!form) return;

    // cloneNode garante um único listener por sessão (Bug 6)
    var novoForm = form.cloneNode(true);
    form.parentNode.replaceChild(novoForm, form);

    novoForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Limpa erros antes de validar
      ["sv-nome", "sv-preco", "sv-duracao"].forEach(function (id) {
        var elErro = document.getElementById("erro-" + id);
        if (elErro) elErro.textContent = "";
        var campo = document.getElementById(id);
        if (campo) campo.classList.remove("invalido");
      });

      var dados = {
        nome:    document.getElementById("sv-nome").value,
        preco:   document.getElementById("sv-preco").value,
        duracao: document.getElementById("sv-duracao").value
      };

      var resultado = Validacao.validarServico(dados);
      if (!resultado.valido) {
        Object.keys(resultado.erros).forEach(function (campo) {
          var elErro = document.getElementById("erro-" + campo);
          if (elErro) elErro.textContent = resultado.erros[campo];
          var elCampo = document.getElementById(campo);
          if (elCampo) elCampo.classList.add("invalido");
        });
        return;  // Para aqui — não executa o bloco de sucesso
      }

      // ── Dados válidos: salva o serviço ───────────────────────
      var lista = Storage.getServicos();
      lista.push({
        id:      UI.uid(),
        nome:    dados.nome.trim(),
        preco:   parseFloat(dados.preco),
        duracao: parseInt(dados.duracao, 10)
      });
      Storage.salvarServicos(lista);

      novoForm.reset();
      // Garante que campos não ficam marcados após reset
      ["sv-nome", "sv-preco", "sv-duracao"].forEach(function (id) {
        var campo = document.getElementById(id);
        if (campo) campo.classList.remove("invalido");
      });

      UI.renderServicosAdmin(excluirServico);
      UI.atualizarStats();
      UI.toast("Serviço cadastrado!", "sucesso");
    });
  }

  function excluirServico(id) {
    var lista = Storage.getServicos().filter(function (s) { return s.id !== id; });
    Storage.salvarServicos(lista);
    UI.renderServicosAdmin(excluirServico);
    UI.atualizarStats();
    UI.toast("Serviço removido.", "cancelamento");
  }

  function renderAgBarbeiro() {
    var filtroData = document.getElementById("filtro-data");
    var dataFiltro = filtroData ? filtroData.value : null;

    UI.renderAgendamentos(
      function (id) {
        var lista = Storage.getAgendamentos().filter(function (a) { return a.id !== id; });
        Storage.salvarAgendamentos(lista);
        renderAgBarbeiro();
        renderConcluidos();
        UI.atualizarStats();
        UI.toast("Agendamento cancelado.", "cancelamento");
      },
      function (id) {
        var lista = Storage.getAgendamentos().map(function (a) {
          if (a.id === id) return Object.assign({}, a, { concluido: true });
          return a;
        });
        Storage.salvarAgendamentos(lista);
        renderAgBarbeiro();
        renderConcluidos();
        UI.atualizarStats();
        UI.toast("Agendamento concluído!", "sucesso");
      },
      dataFiltro || null
    );
  }

  function renderConcluidos() {
    UI.renderAgendamentosConcluidos(function (id) {
      var lista = Storage.getAgendamentos().filter(function (a) { return a.id !== id; });
      Storage.salvarAgendamentos(lista);
      renderConcluidos();
      UI.atualizarStats();
      UI.toast("Registro excluído.", "cancelamento");
    });
  }

  function inicializarFiltros() {
    var filtroData = document.getElementById("filtro-data");
    var btnLimpar  = document.getElementById("btn-limpar-filtro");

    if (filtroData) {
      var novoFiltro = filtroData.cloneNode(true);
      filtroData.parentNode.replaceChild(novoFiltro, filtroData);
      novoFiltro.addEventListener("change", renderAgBarbeiro);
    }
    if (btnLimpar) {
      var novoBtnL = btnLimpar.cloneNode(true);
      btnLimpar.parentNode.replaceChild(novoBtnL, btnLimpar);
      novoBtnL.addEventListener("click", function () {
        var fd = document.getElementById("filtro-data");
        if (fd) fd.value = "";
        renderAgBarbeiro();
      });
    }
  }

  // ── Iniciar ──────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();