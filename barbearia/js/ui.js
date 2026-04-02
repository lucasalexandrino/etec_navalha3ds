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

  var formularioAgendamento = document.getElementById("formularioAgendamento");
  var campoNomeCliente = document.getElementById("campoNomeCliente");
  var campoWhatsapp = document.getElementById("campoWhatsapp");
  var campoData = document.getElementById("campoData");
  var campoHora = document.getElementById("campoHora");
  var corpoTabelaAgendamentos = document.getElementById("corpoTabelaAgendamentos");

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
      btnExcluir.setAttribute("data-id", s.id);
      btnExcluir.addEventListener("click", function () {
        var id = btnExcluir.getAttribute("data-id");
        S.remover(id);
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
  }

  function renderizarTabelaAgendamentos() {
    var agendamentosOrdenados = A.ordenarPorDataHora(A.listar());
    corpoTabelaAgendamentos.innerHTML = "";
    agendamentosOrdenados.forEach(function (ag) {
      var linha = document.createElement("tr");
      linha.innerHTML =
        "<td>" +
        A.formatarDataHoraBr(ag.dataHora) +
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
    return btn;
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
      if (ehHoje) btn.classList.add("dia-calendario-hoje");
      if (temEvento) btn.classList.add("dia-calendario-com-evento");
      btn.addEventListener("click", function () {
        var mm = String(mes + 1).padStart(2, "0");
        var dd = String(numero).padStart(2, "0");
        campoData.value = ano + "-" + mm + "-" + dd;
      });
    }
    return btn;
  }

  function renderizarCalendario() {
    var hoje = new Date();
    var primeiro = new Date(anoCalendario, mesCalendario, 1);
    var ultimoDia = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
    var inicioSemana = primeiro.getDay();
    tituloMesCalendario.textContent = primeiro.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
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

  function configurarTrocaPerfil() {
    botoesPerfil.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var perfil = btn.getAttribute("data-perfil");
        botoesPerfil.forEach(function (b) {
          var ativo = b === btn;
          b.classList.toggle("aba-perfil-ativa", ativo);
          b.setAttribute("aria-selected", ativo ? "true" : "false");
        });
        var ehCliente = perfil === "cliente";
        painelCliente.classList.toggle("painel-ativo", ehCliente);
        painelCliente.hidden = !ehCliente;
        painelBarbeiro.classList.toggle("painel-ativo", !ehCliente);
        painelBarbeiro.hidden = ehCliente;
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

  function configurarFormularioAgendamento() {
    formularioAgendamento.addEventListener("submit", function (e) {
      e.preventDefault();
      var idServico = selectServico.value;
      var servico = S.obterPorId(idServico);
      A.adicionar({
        nomeCliente: campoNomeCliente.value,
        whatsapp: campoWhatsapp.value,
        dataHora: A.dataHoraLocalParaIso(campoData.value, campoHora.value),
        idServico: idServico,
        nomeServico: servico ? servico.nome : "",
      });
      campoNomeCliente.value = "";
      campoWhatsapp.value = "";
      renderizarCalendario();
      renderizarTabelaAgendamentos();
    });
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
