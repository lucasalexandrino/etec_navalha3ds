(function () {
  "use strict";

  var S = window.Servicos;
  var A = window.Agendamentos;

  /* ══════════════════════════════════════
     REFERÊNCIAS AO DOM
  ══════════════════════════════════════ */
  var botoesPerfil            = document.querySelectorAll(".aba-perfil");
  var painelCliente           = document.getElementById("painelCliente");
  var painelBarbeiro          = document.getElementById("painelBarbeiro");

  var campoNomeCliente        = document.getElementById("campoNomeCliente");
  var campoWhatsapp           = document.getElementById("campoWhatsapp");

  var mesTitulo               = document.getElementById("mesTitulo");
  var diasSemanaContainer     = document.getElementById("diasSemana");
  var btnSemanaAnterior       = document.getElementById("btnSemanaAnterior");
  var btnProximaSemana        = document.getElementById("btnProximaSemana");

  var servicosChips           = document.getElementById("servicosChips");
  var ajudaServico            = document.getElementById("ajudaServico");
  var precoDestaque           = document.getElementById("precoDestaque");
  var precoNomeServico        = document.getElementById("precoNomeServico");
  var precoValorEl            = document.getElementById("precoValor");

  var profissionaisLista      = document.getElementById("profissionaisLista");

  var horariosManha           = document.getElementById("horariosManha");
  var horariosTarde           = document.getElementById("horariosTarde");
  var blocoManha              = document.getElementById("blocoManha");
  var blocoTarde              = document.getElementById("blocoTarde");
  var countManha              = document.getElementById("countManha");
  var countTarde              = document.getElementById("countTarde");

  var mensagemErro            = document.getElementById("mensagemErroAgendamento");
  var mensagemSucesso         = document.getElementById("mensagemSucessoAgendamento");
  var botaoConfirmar          = document.getElementById("botaoConfirmarAgendamento");

  var campoNomeServico        = document.getElementById("campoNomeServico");
  var campoPrecoServico       = document.getElementById("campoPrecoServico");
  var botaoAdicionarServico   = document.getElementById("botaoAdicionarServico");
  var listaServicosEl         = document.getElementById("listaServicos");
  var corpoTabela             = document.getElementById("corpoTabelaAgendamentos");

  var telaLogin               = document.getElementById("telaLogin");
  var formLogin               = document.getElementById("formLogin");
  var campoUsuario            = document.getElementById("campoUsuario");
  var campoSenha              = document.getElementById("campoSenha");
  var mensagemErroLogin       = document.getElementById("mensagemErroLogin");
  var cabecalho               = document.querySelector(".cabecalho");
  var logoutContainer         = document.querySelector(".cabecalho-logout");

  var erroNome                  = document.getElementById("erroNome");
  var erroWhatsapp              = document.getElementById("erroWhatsapp");
  var erroServico               = document.getElementById("erroServico");
  var erroData                  = document.getElementById("erroData");
  var erroHorario               = document.getElementById("erroHorario");
  var erroNomeServico           = document.getElementById("erroNomeServico");
  var erroPrecoServico          = document.getElementById("erroPrecoServico");

  /* ══════════════════════════════════════
     CONSTANTES
  ══════════════════════════════════════ */
  var DIAS_ABREV  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  var MESES_NOME  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  var PROFISSIONAIS = [
    { id: "prof-1", nome: "Digão",  nota: "4.9", emoji: "💈" },
    { id: "prof-2", nome: "Marcos", nota: "4.7", emoji: "✂️" },
    { id: "prof-3", nome: "Leo",    nota: "4.8", emoji: "🪒" },
  ];

  /* Horários disponíveis por turno */
  var HORARIOS_MANHA = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"];
  var HORARIOS_TARDE = ["12:00","13:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

  /* ══════════════════════════════════════
     ESTADO
  ══════════════════════════════════════ */
  var estado = {
    /* Offset em dias a partir de hoje para o primeiro dia exibido na faixa.
       Sempre exibimos 7 dias a partir desse ponto. */
    offsetDias: 0,
    diaSelecionado: null,   /* "YYYY-MM-DD" */
    idServico: null,
    idProfissional: PROFISSIONAIS[0].id,
    horario: null,
  };

  /* ══════════════════════════════════════
     UTILITÁRIOS
  ══════════════════════════════════════ */
  function escaparHtml(t) {
    if (!t) return "";
    var d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }

  function formatarPreco(v) {
    return "R$\u00a0" + Number(v).toFixed(2).replace(".", ",");
  }

  /* Retorna "YYYY-MM-DD" de um objeto Date, sem depender de timezone */
  function dataParaIso(d) {
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mm + "-" + dd;
  }

  /* Retorna um novo Date representando hoje às 00:00:00 local */
  function hoje() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* Dado o offsetDias atual, retorna o Date do primeiro dia da janela */
  function primeiroDiaJanela() {
    var d = hoje();
    d.setDate(d.getDate() + estado.offsetDias);
    return d;
  }

  /* ══════════════════════════════════════
     VALIDAÇÃO DE FORMULÁRIOS
  ══════════════════════════════════════ */
  function mostrarErroCampo(elementoErro, mensagem) {
    elementoErro.textContent = mensagem;
    elementoErro.hidden = false;
  }

  function esconderErroCampo(elementoErro) {
    elementoErro.hidden = true;
  }

  function setCampoInvalido(campo, invalido) {
    if (invalido) {
      campo.classList.add("campo-invalido");
      campo.setAttribute("aria-invalid", "true");
    } else {
      campo.classList.remove("campo-invalido");
      campo.removeAttribute("aria-invalid");
    }
  }

  function validarNome() {
    var valor = campoNomeCliente.value.trim();
    var invalido = !valor || valor.length < 2 || valor.length > 60 || !/^[a-zA-ZÀ-ÿÇç\s]+$/.test(valor);
    setCampoInvalido(campoNomeCliente, invalido);
    if (invalido) {
      mostrarErroCampo(erroNome, "Nome obrigatório, 2-60 caracteres, apenas letras e espaços.");
    } else {
      esconderErroCampo(erroNome);
    }
    return !invalido;
  }

  function validarWhatsapp() {
    var valor = campoWhatsapp.value.replace(/\D/g, "");
    var invalido = !valor || valor.length < 10 || valor.length > 11;
    setCampoInvalido(campoWhatsapp, invalido);
    if (invalido) {
      mostrarErroCampo(erroWhatsapp, "WhatsApp obrigatório, 10-11 dígitos.");
    } else {
      esconderErroCampo(erroWhatsapp);
    }
    return !invalido;
  }

  function aplicarMascaraWhatsapp() {
    var valor = campoWhatsapp.value.replace(/\D/g, "");
    if (valor.length <= 11) {
      if (valor.length <= 2) {
        campoWhatsapp.value = valor;
      } else if (valor.length <= 6) {
        campoWhatsapp.value = "(" + valor.slice(0, 2) + ") " + valor.slice(2);
      } else if (valor.length <= 10) {
        campoWhatsapp.value = "(" + valor.slice(0, 2) + ") " + valor.slice(2, 6) + "-" + valor.slice(6);
      } else {
        campoWhatsapp.value = "(" + valor.slice(0, 2) + ") " + valor.slice(2, 7) + "-" + valor.slice(7, 11);
      }
    }
  }

  function validarServico() {
    var servicos = S.listar();
    var invalido = servicos.length > 0 && !estado.idServico;
    if (invalido) {
      mostrarErroCampo(erroServico, "Selecione um serviço.");
    } else {
      esconderErroCampo(erroServico);
    }
    return !invalido;
  }

  function validarData() {
    var invalido = !estado.diaSelecionado || new Date(estado.diaSelecionado) < hoje();
    if (invalido) {
      mostrarErroCampo(erroData, "Selecione uma data futura.");
    } else {
      esconderErroCampo(erroData);
    }
    return !invalido;
  }

  function validarHorario() {
    var invalido = !estado.horario;
    if (invalido) {
      mostrarErroCampo(erroHorario, "Selecione um horário.");
    } else {
      esconderErroCampo(erroHorario);
    }
    return !invalido;
  }

  function validarConflito() {
    if (!estado.diaSelecionado || !estado.horario) return true;
    var dataHoraIso = A.dataHoraLocalParaIso(estado.diaSelecionado, estado.horario);
    var conflito = A.listar().some(function (ag) {
      return ag.dataHora === dataHoraIso && ag.profissional === estado.idProfissional;
    });
    if (conflito) {
      mostrarErroCampo(erroHorario, "Este horário já está reservado. Escolha outro.");
      return false;
    } else {
      esconderErroCampo(erroHorario);
      return true;
    }
  }

  function validarNomeServico() {
    var valor = campoNomeServico.value.trim();
    var servicos = S.listar();
    var duplicado = servicos.some(function (s) {
      return s.nome.toLowerCase() === valor.toLowerCase();
    });
    var invalido = !valor || valor.length < 2 || valor.length > 50 || duplicado;
    setCampoInvalido(campoNomeServico, invalido);
    if (invalido) {
      var msg = "Nome obrigatório, 2-50 caracteres";
      if (duplicado) msg += ", nome já existe.";
      mostrarErroCampo(erroNomeServico, msg);
    } else {
      esconderErroCampo(erroNomeServico);
    }
    return !invalido;
  }

  function validarPrecoServico() {
    var valor = parseFloat(campoPrecoServico.value);
    var invalido = isNaN(valor) || valor <= 0 || valor > 9999.99;
    setCampoInvalido(campoPrecoServico, invalido);
    if (invalido) {
      mostrarErroCampo(erroPrecoServico, "Preço obrigatório, maior que zero, máximo R$ 9.999,99.");
    } else {
      esconderErroCampo(erroPrecoServico);
    }
    return !invalido;
  }

  /* ══════════════════════════════════════
     SELETOR DE SEMANA
  ══════════════════════════════════════ */
  function renderizarSemana() {
    var hojeDate = hoje();
    var hojeIso  = dataParaIso(hojeDate);
    var inicio   = primeiroDiaJanela();

    /* Título do mês: usa o mês do 4º dia da janela (centro) */
    var centro = new Date(inicio);
    centro.setDate(inicio.getDate() + 3);
    mesTitulo.textContent = MESES_NOME[centro.getMonth()] + " " + centro.getFullYear();

    /* Desabilita "semana anterior" se a janela já começa em hoje ou antes */
    btnSemanaAnterior.disabled = estado.offsetDias <= 0;

    diasSemanaContainer.innerHTML = "";

    for (var i = 0; i < 7; i++) {
      var d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      var iso     = dataParaIso(d);
      var ehHoje  = iso === hojeIso;
      var ehAtivo = iso === estado.diaSelecionado;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dia-btn" +
        (ehHoje  ? " dia-btn-hoje"  : "") +
        (ehAtivo ? " dia-btn-ativo" : "");
      btn.setAttribute("aria-pressed", ehAtivo ? "true" : "false");
      btn.setAttribute("aria-label",
        d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
      );

      btn.innerHTML =
        '<span class="dia-semana-abrev">' + DIAS_ABREV[d.getDay()] + '</span>' +
        '<span class="dia-num">'          + String(d.getDate()).padStart(2, "0") + '</span>';

      /* captura correta de iso por closure */
      (function (isoCapturado) {
        btn.addEventListener("click", function () {
          estado.diaSelecionado = isoCapturado;
          estado.horario = null;          /* reseta horário ao trocar de dia */
          renderizarSemana();
          renderizarHorarios();
          atualizarBotaoConfirmar();
        });
      }(iso));

      diasSemanaContainer.appendChild(btn);
    }
  }

  function configurarNavegacaoSemana() {
    btnSemanaAnterior.addEventListener("click", function () {
      /* recua 7 dias, mas nunca antes de hoje */
      estado.offsetDias = Math.max(0, estado.offsetDias - 7);
      renderizarSemana();
    });

    btnProximaSemana.addEventListener("click", function () {
      estado.offsetDias += 7;
      renderizarSemana();
    });
  }

  /* ══════════════════════════════════════
     SERVIÇOS (chips)
  ══════════════════════════════════════ */
  function renderizarServicosChips() {
    var servicos = S.listar();
    servicosChips.innerHTML = "";

    if (servicos.length === 0) {
      ajudaServico.textContent =
        "Nenhum serviço disponível ainda. Abra a aba Barbeiro e cadastre serviços.";
      botaoConfirmar.disabled = true;
      precoDestaque.hidden = true;
      return;
    }
    ajudaServico.textContent = "";

    /* limpa seleção se serviço foi excluído */
    if (estado.idServico && !servicos.find(function (s) { return s.id === estado.idServico; })) {
      estado.idServico = null;
      precoDestaque.hidden = true;
    }

    servicos.forEach(function (s) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "servico-chip" + (estado.idServico === s.id ? " servico-chip-ativo" : "");
      btn.setAttribute("aria-pressed", estado.idServico === s.id ? "true" : "false");
      btn.setAttribute("aria-label", s.nome + " — " + formatarPreco(s.preco));
      btn.innerHTML =
        escaparHtml(s.nome) +
        '<span class="servico-chip-preco">' + formatarPreco(s.preco) + '</span>';

      btn.addEventListener("click", function () {
        estado.idServico = s.id;
        precoNomeServico.textContent = s.nome;
        precoValorEl.textContent     = formatarPreco(s.preco);
        precoDestaque.hidden         = false;
        renderizarServicosChips();
        atualizarBotaoConfirmar();
      });

      servicosChips.appendChild(btn);
    });

    atualizarBotaoConfirmar();
  }

  /* ══════════════════════════════════════
     PROFISSIONAIS
  ══════════════════════════════════════ */
  function renderizarProfissionais() {
    profissionaisLista.innerHTML = "";

    PROFISSIONAIS.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "prof-btn" + (estado.idProfissional === p.id ? " prof-btn-ativo" : "");
      btn.setAttribute("aria-pressed", estado.idProfissional === p.id ? "true" : "false");
      btn.setAttribute("aria-label", p.nome + " — nota " + p.nota);
      btn.innerHTML =
        '<div class="prof-avatar-wrap">' +
          '<div class="prof-avatar" aria-hidden="true">' + p.emoji + '</div>' +
          '<div class="prof-nota"   aria-hidden="true">' + p.nota  + '</div>' +
        '</div>' +
        '<span class="prof-nome">' + escaparHtml(p.nome) + '</span>';

      btn.addEventListener("click", function () {
        estado.idProfissional = p.id;
        renderizarProfissionais();
        atualizarBotaoConfirmar();
      });

      profissionaisLista.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════
     HORÁRIOS
  ══════════════════════════════════════ */
  function horarioOcupado(h) {
    if (!estado.diaSelecionado) return false;
    return A.listar().some(function (ag) {
      var d   = new Date(ag.dataHora);
      var iso = dataParaIso(d);
      var hAg = String(d.getHours()).padStart(2, "0") + ":" +
                String(d.getMinutes()).padStart(2, "0");
      return iso === estado.diaSelecionado && hAg === h;
    });
  }

  function criarBotaoHorario(h) {
    var ocupado  = horarioOcupado(h);
    var ehAtivo  = estado.horario === h;
    var btn      = document.createElement("button");
    btn.type     = "button";
    btn.className = "horario-btn" + (ehAtivo ? " horario-btn-ativo" : "");
    btn.textContent = h;
    btn.disabled    = ocupado;
    btn.setAttribute("aria-pressed", ehAtivo ? "true" : "false");
    if (ocupado) btn.setAttribute("aria-label", h + " — ocupado");

    btn.addEventListener("click", function () {
      estado.horario = h;
      renderizarHorarios();
      atualizarBotaoConfirmar();
    });
    return btn;
  }

  function renderizarHorarios() {
    horariosManha.innerHTML = "";
    horariosTarde.innerHTML = "";

    var livreManha = 0;
    var livreTarde = 0;

    HORARIOS_MANHA.forEach(function (h) {
      if (!horarioOcupado(h)) livreManha++;
      horariosManha.appendChild(criarBotaoHorario(h));
    });
    HORARIOS_TARDE.forEach(function (h) {
      if (!horarioOcupado(h)) livreTarde++;
      horariosTarde.appendChild(criarBotaoHorario(h));
    });

    countManha.textContent = livreManha + " livre" + (livreManha !== 1 ? "s" : "");
    countTarde.textContent = livreTarde + " livre" + (livreTarde !== 1 ? "s" : "");
  }

  function configurarFiltrosTurno() {
    document.querySelectorAll(".filtro-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filtro-btn").forEach(function (b) {
          b.classList.remove("filtro-btn-ativo");
        });
        btn.classList.add("filtro-btn-ativo");
        var turno = btn.getAttribute("data-turno");
        blocoManha.style.display = turno === "tarde"  ? "none" : "";
        blocoTarde.style.display = turno === "manha" ? "none" : "";
      });
    });
  }

  /* ══════════════════════════════════════
     BOTÃO CONFIRMAR
  ══════════════════════════════════════ */
  function atualizarBotaoConfirmar() {
    var ok = estado.diaSelecionado &&
             estado.idServico &&
             estado.idProfissional &&
             estado.horario &&
             S.listar().length > 0;
    botaoConfirmar.disabled = !ok;
  }

  function configurarBotaoConfirmar() {
    /* máscara aplicada ao digitar — validação só ocorre ao tentar confirmar */
    campoWhatsapp.addEventListener("input", aplicarMascaraWhatsapp);

    botaoConfirmar.addEventListener("click", function () {
      limparMensagens();

      /* Roda todas as validações SEM curto-circuito para mostrar todos os erros de uma vez */
      var r1 = validarNome();
      var r2 = validarWhatsapp();
      var r3 = validarServico();
      var r4 = validarData();
      var r5 = validarHorario();
      var r6 = validarConflito();
      var valido = r1 && r2 && r3 && r4 && r5 && r6;
      if (!valido) return;

      var nome     = campoNomeCliente.value.trim();
      var whatsapp = campoWhatsapp.value.replace(/\D/g, "");
      var servico  = S.obterPorId(estado.idServico);
      var dataHoraIso = A.dataHoraLocalParaIso(estado.diaSelecionado, estado.horario);

      A.adicionar({
        nomeCliente:  nome,
        whatsapp:     whatsapp,
        dataHora:     dataHoraIso,
        idServico:    estado.idServico,
        nomeServico:  servico.nome,
        precoServico: servico.preco,
        profissional: estado.idProfissional,
      });

      mostrarSucesso();

      // Resetar estado
      campoNomeCliente.value = "";
      campoWhatsapp.value = "";
      estado.diaSelecionado = null;
      estado.idServico = null;
      estado.horario = null;
      renderizarSemana();
      renderizarServicosChips();
      renderizarHorarios();
      atualizarBotaoConfirmar();
    });
  }

  /* ══════════════════════════════════════
     MENSAGENS
  ══════════════════════════════════════ */
  function limparMensagens() {
    mensagemErro.textContent    = ""; mensagemErro.hidden    = true;
    mensagemSucesso.textContent = ""; mensagemSucesso.hidden = true;
  }

  function mostrarErro(texto) {
    mensagemSucesso.hidden      = true;
    mensagemErro.textContent    = texto;
    mensagemErro.hidden         = false;
  }

  function mostrarSucesso() {
    mensagemErro.hidden         = true;
    mensagemSucesso.textContent =
      "Tudo certo! Seu horário foi registrado. Os dados ficam guardados neste navegador.";
    mensagemSucesso.hidden      = false;
    var reducao = typeof window.matchMedia === "function" &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mensagemSucesso.scrollIntoView({ behavior: reducao ? "auto" : "smooth", block: "nearest" });
  }

  /* ══════════════════════════════════════
     BARBEIRO — serviços
  ══════════════════════════════════════ */
  function configurarFormularioServico() {
    campoNomeServico.addEventListener("blur", validarNomeServico);
    campoPrecoServico.addEventListener("blur", validarPrecoServico);

    botaoAdicionarServico.addEventListener("click", function () {
      var valido = validarNomeServico() && validarPrecoServico();
      if (!valido) return;

      var nome  = campoNomeServico.value.trim();
      var preco = parseFloat(campoPrecoServico.value);
      S.adicionar(nome, preco);
      campoNomeServico.value  = "";
      campoPrecoServico.value = "";
      renderizarListaServicos();
      renderizarServicosChips();
    });
  }

  function renderizarListaServicos() {
    var servicos = S.listar();
    listaServicosEl.innerHTML = "";

    servicos.forEach(function (s) {
      var li   = document.createElement("li");
      var info = document.createElement("div");
      info.className  = "servico-info";
      info.innerHTML  =
        '<span class="servico-info-nome">'  + escaparHtml(s.nome) + '</span>' +
        '<span class="servico-info-preco">' + formatarPreco(s.preco) + '</span>';

      var btnEx = document.createElement("button");
      btnEx.type      = "button";
      btnEx.className = "botao-icone";
      btnEx.textContent = "Excluir";
      btnEx.setAttribute("aria-label", "Excluir o serviço " + s.nome);

      (function (sid) {
        btnEx.addEventListener("click", function () {
          S.remover(sid);
          if (estado.idServico === sid) {
            estado.idServico   = null;
            precoDestaque.hidden = true;
          }
          renderizarListaServicos();
          renderizarServicosChips();
        });
      }(s.id));

      li.appendChild(info);
      li.appendChild(btnEx);
      listaServicosEl.appendChild(li);
    });
  }

  /* ══════════════════════════════════════
     BARBEIRO — tabela de agendamentos
  ══════════════════════════════════════ */
  function renderizarTabelaAgendamentos() {
    var lista = A.ordenarPorDataHora(A.listar());
    corpoTabela.innerHTML = "";

    lista.forEach(function (ag) {
      var linha     = document.createElement("tr");
      var textoData = A.formatarDataHoraBr(ag.dataHora);
      var preco     = (ag.precoServico != null && ag.precoServico !== "") ?
                      formatarPreco(ag.precoServico) : "—";

      linha.innerHTML =
        "<td>" + escaparHtml(textoData)         + "</td>" +
        "<td>" + escaparHtml(ag.nomeCliente)    + "</td>" +
        "<td>" + escaparHtml(ag.whatsapp)       + "</td>" +
        "<td>" + escaparHtml(ag.nomeServico)    + "</td>" +
        '<td class="tabela-preco">' + escaparHtml(preco) + "</td>" +
        "<td></td>";

      var celAcoes  = linha.lastElementChild;
      var btnCancel = document.createElement("button");
      btnCancel.type      = "button";
      btnCancel.className = "botao-icone";
      btnCancel.textContent = "Cancelar";
      btnCancel.setAttribute("aria-label",
        "Cancelar agendamento de " + (ag.nomeCliente || "cliente") + " em " + textoData);

      (function (aid) {
        btnCancel.addEventListener("click", function () {
          A.remover(aid);
          renderizarTabelaAgendamentos();
          renderizarHorarios();
          renderizarSemana();
        });
      }(ag.id));

      celAcoes.appendChild(btnCancel);
      corpoTabela.appendChild(linha);
    });
  }

  /* ══════════════════════════════════════
     ABAS DE PERFIL
  ══════════════════════════════════════ */
  function configurarAbas() {
    /* tabindex inicial */
    botoesPerfil.forEach(function (b) {
      b.setAttribute("tabindex", b.id === "tabCliente" ? "0" : "-1");
    });

    /* navegação por teclado */
    var tablist = document.querySelector(".abas-perfil");
    if (tablist) {
      tablist.addEventListener("keydown", function (e) {
        var tabs  = Array.prototype.slice.call(botoesPerfil);
        var atual = tabs.indexOf(document.activeElement);
        if (atual < 0) return;
        var prox  = atual;
        if      (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); prox = (atual + 1) % tabs.length; }
        else if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); prox = (atual - 1 + tabs.length) % tabs.length; }
        else if (e.key === "Home")                                 { e.preventDefault(); prox = 0; }
        else if (e.key === "End")                                  { e.preventDefault(); prox = tabs.length - 1; }
        else return;
        tabs[prox].focus();
        tabs[prox].click();
      });
    }

    botoesPerfil.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var perfil    = btn.getAttribute("data-perfil");
        var ehCliente = perfil === "cliente";

        botoesPerfil.forEach(function (b) {
          var ativo = b === btn;
          b.classList.toggle("aba-perfil-ativa", ativo);
          b.setAttribute("aria-selected", ativo ? "true" : "false");
          b.setAttribute("tabindex",      ativo ? "0"    : "-1");
        });

        painelCliente.classList.toggle("painel-ativo", ehCliente);
        painelCliente.hidden = !ehCliente;
        painelCliente.setAttribute("aria-hidden", String(!ehCliente));

        painelBarbeiro.classList.toggle("painel-ativo", !ehCliente);
        painelBarbeiro.hidden = ehCliente;
        painelBarbeiro.setAttribute("aria-hidden", String(ehCliente));

        if (!ehCliente) {
          renderizarListaServicos();
          renderizarTabelaAgendamentos();
        }
      });
    });
  }

  /* ══════════════════════════════════════
     AUTENTICAÇÃO
  ══════════════════════════════════════ */
  function configurarLogin() {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      mensagemErroLogin.hidden = true;
      var usuario = campoUsuario.value.trim();
      var senha = campoSenha.value.trim();
      var papel = fazerLogin(usuario, senha);
      if (papel) {
        aplicarPapel(papel);
      } else {
        mensagemErroLogin.textContent = "Usuário ou senha incorretos.";
        mensagemErroLogin.hidden = false;
        campoUsuario.focus();
      }
    });
  }

  function aplicarPapel(papel) {
    telaLogin.style.display = "none";
    cabecalho.style.display = "flex";
    document.querySelector("main").style.display = "block";
    /* abas ficam sempre ocultas — acesso direto pelo papel */
    var navAbas = document.querySelector(".abas-perfil");
    if (navAbas) navAbas.style.display = "none";

    // Mostrar painel correspondente
    if (papel === "cliente") {
      painelCliente.classList.add("painel-ativo");
      painelBarbeiro.classList.remove("painel-ativo");
      painelCliente.removeAttribute("hidden");
      painelBarbeiro.setAttribute("hidden", "true");
      painelCliente.setAttribute("aria-hidden", "false");
      painelBarbeiro.setAttribute("aria-hidden", "true");
    } else if (papel === "barbeiro") {
      painelBarbeiro.classList.add("painel-ativo");
      painelCliente.classList.remove("painel-ativo");
      painelBarbeiro.removeAttribute("hidden");
      painelCliente.setAttribute("hidden", "true");
      painelBarbeiro.setAttribute("aria-hidden", "false");
      painelCliente.setAttribute("aria-hidden", "true");
    }

    // Adicionar botão de logout
    var btnLogout = document.createElement("button");
    btnLogout.type = "button";
    btnLogout.className = "botao-logout";
    btnLogout.innerHTML = "&#x2192; Sair&nbsp;(" + papel + ")";
    btnLogout.setAttribute("aria-label", "Fazer logout");
    btnLogout.addEventListener("click", function () {
      fazerLogout();
      location.reload();
    });
    logoutContainer.appendChild(btnLogout);

    // Renderizar conteúdo
    renderizarSemana();
    renderizarServicosChips();
    renderizarProfissionais();
    renderizarHorarios();
    renderizarListaServicos();
    renderizarTabelaAgendamentos();
  }
  function iniciar() {
    var papel = verificarSessao();
    if (papel) {
      aplicarPapel(papel);
    } else {
      telaLogin.style.display = "flex";
      cabecalho.style.display = "none";
      document.querySelector("main").style.display = "none";
      configurarLogin();
      campoUsuario.focus();
    }

    // Configurações gerais (sempre)
    configurarNavegacaoSemana();
    configurarFiltrosTurno();
    configurarFormularioServico();
    configurarBotaoConfirmar();
  }

  iniciar();
})();