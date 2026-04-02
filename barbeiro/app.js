(function () {
  "use strict";

  var na = window.NavalhaArmazenamento;
  if (!na) return;

  var usuario = na.getSessaoValidaBarbeiro();
  if (!usuario) {
    window.location.replace("../deslogado/index.html");
    return;
  }

  document.getElementById("usuario-resumo").textContent = usuario.email;

  document.getElementById("btn-logout").addEventListener("click", function () {
    na.limparSessao();
    window.location.href = "../deslogado/index.html";
  });

  var formServico = document.getElementById("form-servico");
  var svNome = document.getElementById("sv-nome");
  var listaServicos = document.getElementById("lista-servicos");
  var tbodyAg = document.getElementById("tbody-agendamentos");

  function escapeHtml(t) {
    if (!t) return "";
    var div = document.createElement("div");
    div.textContent = t;
    return div.innerHTML;
  }

  function renderListaServicos() {
    var servicos = na.getServicos();
    listaServicos.innerHTML = "";
    servicos.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s.name;
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn-icone";
      del.textContent = "Excluir";
      del.setAttribute("data-id", s.id);
      del.addEventListener("click", function () {
        var id = del.getAttribute("data-id");
        var rest = na.getServicos().filter(function (x) {
          return x.id !== id;
        });
        na.save(na.KEY_SERVICOS, rest);
        renderListaServicos();
      });
      li.appendChild(del);
      listaServicos.appendChild(li);
    });
  }

  formServico.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = svNome.value;
    var servicos = na.getServicos();
    servicos.push({ id: na.uid(), name: nome });
    na.save(na.KEY_SERVICOS, servicos);
    svNome.value = "";
    renderListaServicos();
  });

  function renderTabelaAgendamentos() {
    var ags = na.getAgendamentos().slice().sort(function (a, b) {
      var ta = new Date(a.datetime).getTime();
      var tb = new Date(b.datetime).getTime();
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    });
    tbodyAg.innerHTML = "";
    ags.forEach(function (a) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        na.formatarDataHoraBr(a.datetime) +
        "</td><td>" +
        escapeHtml(a.clientName) +
        "</td><td>" +
        escapeHtml(a.whatsapp) +
        "</td><td>" +
        escapeHtml(a.serviceName) +
        "</td><td></td>";
      var tdBtn = tr.lastElementChild;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-icone";
      rm.textContent = "Cancelar";
      rm.addEventListener("click", function () {
        var rest = na.getAgendamentos().filter(function (x) {
          return x.id !== a.id;
        });
        na.save(na.KEY_AG, rest);
        renderTabelaAgendamentos();
      });
      tdBtn.appendChild(rm);
      tbodyAg.appendChild(tr);
    });
  }

  renderListaServicos();
  renderTabelaAgendamentos();
})();
