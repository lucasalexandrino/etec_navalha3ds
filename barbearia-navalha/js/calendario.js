/**
 * calendario.js — Módulo do Calendário
 * Ao selecionar uma data, atualiza o campo e re-renderiza horários.
 *
 * CORREÇÕES v2.2:
 *  - Exposta função resetar() para que o logout possa devolver o calendário
 *    ao estado inicial (mês atual, sem data selecionada).
 *  - Botões de navegação usam cloneNode para evitar acúmulo de listeners
 *    em logins consecutivos.
 */

var Calendario = (function () {
  "use strict";

  var mesAtual        = new Date().getMonth();
  var anoAtual        = new Date().getFullYear();
  var dataSelecionada = null; // "YYYY-MM-DD"

  function getDatasComEvento() {
    var agendamentos = Storage.getAgendamentos();
    var datas = {};
    agendamentos.forEach(function (a) {
      if (a.dataHora) {
        datas[a.dataHora.slice(0, 10)] = true;
      }
    });
    return datas;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function render() {
    var grade  = document.getElementById("cal-grade");
    var titulo = document.getElementById("cal-titulo-mes");
    if (!grade || !titulo) return;

    grade.innerHTML = "";

    var hoje    = new Date();
    var hojeStr = hoje.getFullYear() + "-" + pad(hoje.getMonth() + 1) + "-" + pad(hoje.getDate());

    var primeiro  = new Date(anoAtual, mesAtual, 1);
    var ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
    var diaInicio = primeiro.getDay();

    titulo.textContent = primeiro.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    var datasComEvento = getDatasComEvento();

    for (var i = 0; i < diaInicio; i++) {
      var vazio = document.createElement("div");
      vazio.setAttribute("aria-hidden", "true");
      grade.appendChild(vazio);
    }

    for (var d = 1; d <= ultimoDia; d++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = d;
      btn.className = "cal-dia";

      var dataStr = anoAtual + "-" + pad(mesAtual + 1) + "-" + pad(d);
      btn.setAttribute("data-data", dataStr);
      btn.setAttribute("aria-label", d + " de " +
        primeiro.toLocaleDateString("pt-BR", { month: "long" }) + " de " + anoAtual);

      if (dataStr === hojeStr) btn.classList.add("hoje");

      if (dataStr === dataSelecionada) {
        btn.classList.add("selecionado");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }

      if (datasComEvento[dataStr]) {
        btn.classList.add("tem-evento");
        btn.setAttribute("aria-label",
          btn.getAttribute("aria-label") + " (tem agendamento)");
      }

      btn.addEventListener("click", function (e) {
        var data = e.currentTarget.getAttribute("data-data");
        dataSelecionada = data;

        var inputData = document.getElementById("ag-data");
        if (inputData) {
          inputData.value = data;
          inputData.dispatchEvent(new Event("change"));
        }

        grade.querySelectorAll(".cal-dia.selecionado").forEach(function (el) {
          el.classList.remove("selecionado");
          el.setAttribute("aria-pressed", "false");
        });
        e.currentTarget.classList.add("selecionado");
        e.currentTarget.setAttribute("aria-pressed", "true");

        if (typeof UI !== "undefined" && UI.renderHorarios) {
          UI.renderHorarios(data);
        }

        var erroData = document.getElementById("erro-ag-data");
        if (erroData) erroData.textContent = "";
        if (inputData) inputData.classList.remove("invalido");
      });

      grade.appendChild(btn);
    }
  }

  function proximoMes() {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    render();
  }

  function mesAnterior() {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    render();
  }

  function atualizar() {
    render();
    if (typeof UI !== "undefined" && UI.renderHorarios) {
      UI.renderHorarios(dataSelecionada);
    }
  }

  /**
   * Reseta o calendário para o mês/ano atual sem data selecionada.
   * Chamado pelo logout para garantir estado limpo no próximo login.
   */
  function resetar() {
    mesAtual        = new Date().getMonth();
    anoAtual        = new Date().getFullYear();
    dataSelecionada = null;
    render();
  }

  function inicializar() {
    var btnAnt  = document.getElementById("cal-mes-ant");
    var btnProx = document.getElementById("cal-prox-mes");

    // cloneNode remove listeners de logins anteriores
    if (btnAnt) {
      var novoBtnAnt = btnAnt.cloneNode(true);
      btnAnt.parentNode.replaceChild(novoBtnAnt, btnAnt);
      novoBtnAnt.addEventListener("click", mesAnterior);
    }
    if (btnProx) {
      var novoBtnProx = btnProx.cloneNode(true);
      btnProx.parentNode.replaceChild(novoBtnProx, btnProx);
      novoBtnProx.addEventListener("click", proximoMes);
    }

    render();
  }

  return {
    inicializar: inicializar,
    atualizar:   atualizar,
    resetar:     resetar
  };
})();
