(function () {
  "use strict";

  var S = window.Servicos;
  var A = window.Agendamentos;

  var botoesPerfil = document.querySelectorAll(".aba-perfil");
  var painelCliente = document.getElementById("painelCliente");
  var painelBarbeiro = document.getElementById("painelBarbeiro");
  var formularioServico = document.getElementById("formularioServico");
  var campoNomeServico = document.getElementById("campoNomeServico");
  var listaServicos = document.getElementById("listaServicos");
  var selectServico = document.getElementById("selectServico");
  var textoAjudaServico = document.getElementById("textoAjudaServico");

  var formularioAgendamento = document.getElementById("formularioAgendamento");
  var campoNomeCliente = document.getElementById("campoNomeCliente");
  var campoWhatsapp = document.getElementById("campoWhatsapp");
  var campoData = document.getElementById("campoData");
  var campoHora = document.getElementById("campoHora");
  var corpoTabelaAgendamentos = document.getElementById("corpoTabelaAgendamentos");
  var mensagemErroAgendamento = document.getElementById("mensagemErroAgendamento");
  var mensagemSucessoAgendamento = document.getElementById("mensagemSucessoAgendamento");
  var botaoConfirmarAgendamento = document.getElementById("botaoConfirmarAgendamento");

  var tituloMesCalendario = document.getElementById("tituloMesCalendario");
  var gradeCalendario = document.getElementById("gradeCalendario");
  var btnMesAnterior = document.getElementById("btnMesAnterior");
  var btnProximoMes = document.getElementById("btnProximoMes");

  var mesCalendario = new Date().getMonth();
  var anoCalendario = new Date().getFullYear();

  function escaparHtml(texto) {
    if (!texto) return "";
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function atualizarTabIndices(abaAtiva) {
    botoesPerfil.forEach(function (b) {
      var ativo = b === abaAtiva;
      b.setAttribute("tabindex", ativo ? "0" : "-1");
    });
  }

  function atualizarAjudaServicoEBotao() {
    var servicos = S.listar();
    if (servicos.length === 0) {
      textoAjudaServico.textContent =
        "Ainda não há serviços. Quem gere a agenda precisa abrir a aba Barbeiro e cadastrar pelo menos um serviço antes de marcar horários aqui.";
      botaoConfirmarAgendamento.disabled = true;
      botaoConfirmarAgendamento.setAttribute("aria-describedby", "textoAjudaServico");
    } else {
      textoAjudaServico.textContent = "Escolha o tipo de serviço que deseja.";
      botaoConfirmarAgendamento.disabled = false;
      botaoConfirmarAgendamento.removeAttribute("aria-describedby");
    }
  }

  function renderizarListaServicos() {
    var servicos = S.listar();
    listaServicos.innerHTML = "";
    servicos.forEach(function (s) {
      var item = document.createElement("li");
      item.textContent = s.nome;
      var btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "botao-icone";
      btnExcluir.textContent = "Excluir";
      btnExcluir.setAttribute("aria-label", "Excluir o serviço " + s.nome);
      btnExcluir.addEventListener("click", function () {
        S.remover(s.id);
        renderizarListaServicos();
        popularSelectServicos();
      });
      item.appendChild(btnExcluir);
      listaServicos.appendChild(item);
    });
  }

  function popularSelectServicos() {
    var servicos = S.listar();
    var valorAnterior = selectServico.value;
    selectServico.innerHTML = "";
    servicos.forEach(function (s) {
      var opcao = document.createElement("option");
      opcao.value = s.id;
      opcao.textContent = s.nome;
      selectServico.appendChild(opcao);
    });
    if (
      valorAnterior &&
      servicos.some(function (s) {
        return s.id === valorAnterior;
      })
    ) {
      selectServico.value = valorAnterior;
    }
    atualizarAjudaServicoEBotao();
  }

  function renderizarTabelaAgendamentos() {
    var agendamentosOrdenados = A.ordenarPorDataHora(A.listar());
    corpoTabelaAgendamentos.innerHTML = "";
    agendamentosOrdenados.forEach(function (ag) {
      var linha = document.createElement("tr");
      var textoData = A.formatarDataHoraBr(ag.dataHora);
      linha.innerHTML =
        "<td>" +
        escaparHtml(textoData) +
        "</td><td>" +
        escaparHtml(ag.nomeCliente) +
        "</td><td>" +
        escaparHtml(ag.whatsapp) +
        "</td><td>" +
        escaparHtml(ag.nomeServico) +
        "</td><td></td>";
      var celulaAcoes = linha.lastElementChild;
      var btnCancelar = document.createElement("button");
      btnCancelar.type = "button";
      btnCancelar.className = "botao-icone";
      btnCancelar.textContent = "Cancelar";
      btnCancelar.setAttribute(
        "aria-label",
        "Cancelar agendamento de " + (ag.nomeCliente || "cliente") + " em " + textoData
      );
      btnCancelar.addEventListener("click", function () {
        A.remover(ag.id);
        renderizarPainelBarbeiro();
        renderizarCalendario();
      });
      celulaAcoes.appendChild(btnCancelar);
      corpoTabelaAgendamentos.appendChild(linha);
    });
  }

  function renderizarPainelBarbeiro() {
    renderizarListaServicos();
    renderizarTabelaAgendamentos();
  }

  function criarCelulaVaziaCalendario() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dia-calendario dia-calendario-fora";
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
    btn.tabIndex = -1;
    return btn;
  }

  function rotuloDiaCalendario(ano, mes, dia) {
    var d = new Date(ano, mes, dia);
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function criarCelulaDia(numero, fora, ehHoje, temEvento, ano, mes) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dia-calendario";
    btn.textContent = String(numero);
    if (fora) {
      btn.classList.add("dia-calendario-fora");
      btn.disabled = true;
    } else {
      btn.setAttribute(
        "aria-label",
        "Usar " + rotuloDiaCalendario(ano, mes, numero) + " no formulário de agendamento"
      );
      if (ehHoje) btn.classList.add("dia-calendario-hoje");
      if (temEvento) btn.classList.add("dia-calendario-com-evento");
      btn.addEventListener("click", function () {
        var mm = String(mes + 1).padStart(2, "0");
        var dd = String(numero).padStart(2, "0");
        campoData.value = ano + "-" + mm + "-" + dd;
        campoData.focus();
      });
    }
    return btn;
  }

  function renderizarCalendario() {
    var hoje = new Date();
    var primeiro = new Date(anoCalendario, mesCalendario, 1);
    var ultimoDia = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
    var inicioSemana = primeiro.getDay();
    var tituloMes = primeiro.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    tituloMesCalendario.textContent = tituloMes;
    gradeCalendario.setAttribute(
      "aria-label",
      "Dias de " + tituloMes + ". Toque num dia para copiar a data para o formulário."
    );
    gradeCalendario.innerHTML = "";
    var marcacoes = A.obterDiasComAgendamentoNoMes(
      anoCalendario,
      mesCalendario,
      A.listar()
    );

    for (var i = 0; i < inicioSemana; i++) {
      gradeCalendario.appendChild(criarCelulaVaziaCalendario());
    }

    for (var dia = 1; dia <= ultimoDia; dia++) {
      var ehHoje =
        dia === hoje.getDate() &&
        mesCalendario === hoje.getMonth() &&
        anoCalendario === hoje.getFullYear();
      var tem = !!marcacoes[dia];
      gradeCalendario.appendChild(
        criarCelulaDia(dia, false, ehHoje, tem, anoCalendario, mesCalendario)
      );
    }
  }

  function configurarTecladoAbas() {
    var tablist = document.querySelector(".abas-perfil");
    if (!tablist) return;
    tablist.addEventListener("keydown", function (e) {
      var tabs = Array.prototype.slice.call(botoesPerfil);
      var atual = tabs.indexOf(document.activeElement);
      if (atual < 0) return;
      var proximo = atual;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        proximo = (atual + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        proximo = (atual - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        proximo = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        proximo = tabs.length - 1;
      } else {
        return;
      }
      tabs[proximo].focus();
      tabs[proximo].click();
    });
  }

  function configurarTrocaPerfil() {
    atualizarTabIndices(document.getElementById("tabCliente"));
    configurarTecladoAbas();
    botoesPerfil.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var perfil = btn.getAttribute("data-perfil");
        botoesPerfil.forEach(function (b) {
          var ativo = b === btn;
          b.classList.toggle("aba-perfil-ativa", ativo);
          b.setAttribute("aria-selected", ativo ? "true" : "false");
        });
        atualizarTabIndices(btn);
        var ehCliente = perfil === "cliente";
        painelCliente.classList.toggle("painel-ativo", ehCliente);
        painelCliente.hidden = !ehCliente;
        painelCliente.setAttribute("aria-hidden", ehCliente ? "false" : "true");
        painelBarbeiro.classList.toggle("painel-ativo", !ehCliente);
        painelBarbeiro.hidden = ehCliente;
        painelBarbeiro.setAttribute("aria-hidden", ehCliente ? "true" : "false");
        if (!ehCliente) renderizarPainelBarbeiro();
      });
    });
  }

  function configurarFormularioServico() {
    formularioServico.addEventListener("submit", function (e) {
      e.preventDefault();
      S.adicionar(campoNomeServico.value);
      campoNomeServico.value = "";
      renderizarListaServicos();
      popularSelectServicos();
    });
  }

  function limparErroAgendamento() {
    mensagemErroAgendamento.textContent = "";
    mensagemErroAgendamento.hidden = true;
  }

  function limparSucessoAgendamento() {
    mensagemSucessoAgendamento.textContent = "";
    mensagemSucessoAgendamento.hidden = true;
  }

  function limparMensagensAgendamento() {
    limparErroAgendamento();
    limparSucessoAgendamento();
  }

  function mostrarErroAgendamento(texto) {
    limparSucessoAgendamento();
    mensagemErroAgendamento.textContent = texto;
    mensagemErroAgendamento.hidden = false;
  }

  function mostrarSucessoAgendamento() {
    limparErroAgendamento();
    mensagemSucessoAgendamento.textContent =
      "Tudo certo! O seu horário foi registado. Os dados ficam guardados neste navegador — pode fechar e voltar depois, desde que não limpe o histórico do site.";
    mensagemSucessoAgendamento.hidden = false;
    var reduzirMovimento =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mensagemSucessoAgendamento.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "nearest",
    });
  }

  function configurarFormularioAgendamento() {
    formularioAgendamento.addEventListener("submit", function (e) {
      e.preventDefault();
      limparMensagensAgendamento();
      var servicos = S.listar();
      if (servicos.length === 0) {
        mostrarErroAgendamento(
          "Para marcar um horário, é preciso existir pelo menos um serviço. Peça a quem gere a agenda para abrir a aba Barbeiro e cadastrar serviços."
        );
        return;
      }
      var idServico = selectServico.value;
      if (!idServico) {
        mostrarErroAgendamento("Escolha um serviço na lista antes de confirmar.");
        return;
      }
      var dataHoraIso = A.dataHoraLocalParaIso(campoData.value, campoHora.value);
      if (!dataHoraIso) {
        mostrarErroAgendamento("Indique uma data e um horário válidos.");
        return;
      }
      var servico = S.obterPorId(idServico);
      A.adicionar({
        nomeCliente: campoNomeCliente.value,
        whatsapp: campoWhatsapp.value,
        dataHora: dataHoraIso,
        idServico: idServico,
        nomeServico: servico ? servico.nome : "",
      });
      campoNomeCliente.value = "";
      campoWhatsapp.value = "";
      renderizarCalendario();
      renderizarTabelaAgendamentos();
      mostrarSucessoAgendamento();
    });

    formularioAgendamento.addEventListener("input", limparMensagensAgendamento);
    formularioAgendamento.addEventListener("change", limparMensagensAgendamento);
  }

  function configurarNavegacaoCalendario() {
    btnMesAnterior.addEventListener("click", function () {
      mesCalendario--;
      if (mesCalendario < 0) {
        mesCalendario = 11;
        anoCalendario--;
      }
      renderizarCalendario();
    });
    btnProximoMes.addEventListener("click", function () {
      mesCalendario++;
      if (mesCalendario > 11) {
        mesCalendario = 0;
        anoCalendario++;
      }
      renderizarCalendario();
    });
  }

  function definirDataHoraPadraoFormulario() {
    var agora = new Date();
    campoData.value =
      agora.getFullYear() +
      "-" +
      String(agora.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(agora.getDate()).padStart(2, "0");
    campoHora.value = "09:00";
  }

  function iniciar() {
    painelCliente.setAttribute("aria-hidden", "false");
    painelBarbeiro.setAttribute("aria-hidden", "true");
    configurarTrocaPerfil();
    configurarFormularioServico();
    configurarFormularioAgendamento();
    configurarNavegacaoCalendario();
    definirDataHoraPadraoFormulario();
    renderizarListaServicos();
    popularSelectServicos();
    renderizarCalendario();
  }

  iniciar();
})();
