(function () {
  "use strict";

  var na = window.NavalhaArmazenamento;
  if (!na) return;

  var usuario = na.getSessaoValidaCliente();
  if (!usuario) {
    window.location.replace("../deslogado/index.html");
    return;
  }

  document.getElementById("usuario-resumo").textContent = usuario.email;

  document.getElementById("btn-logout").addEventListener("click", function () {
    na.limparSessao();
    window.location.href = "../deslogado/index.html";
  });

  var selectServico = document.getElementById("ag-servico");
  var formAg = document.getElementById("form-agendamento");
  var agNome = document.getElementById("ag-nome");
  var agWhatsapp = document.getElementById("ag-whatsapp");
  var agData = document.getElementById("ag-data");
  var agHora = document.getElementById("ag-hora");

  function popularSelectServicos() {
    var servicos = na.getServicos();
    var val = selectServico.value;
    selectServico.innerHTML = "";
    servicos.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      selectServico.appendChild(o);
    });
    if (val && servicos.some(function (s) { return s.id === val; })) {
      selectServico.value = val;
    }
  }

  formAg.addEventListener("submit", function (e) {
    e.preventDefault();
    var servicos = na.getServicos();
    var sid = selectServico.value;
    var data = agData.value;
    var hora = agHora.value;
    var iso = na.isoLocal(data, hora);
    var svc = servicos.find(function (s) { return s.id === sid; });
    var lista = na.getAgendamentos();
    lista.push({
      id: na.uid(),
      clientName: agNome.value,
      whatsapp: agWhatsapp.value,
      datetime: iso,
      serviceId: sid,
      serviceName: svc ? svc.name : "",
    });
    na.save(na.KEY_AG, lista);
    agNome.value = "";
    agWhatsapp.value = "";
    renderCalendario();
  });

  var calTitulo = document.getElementById("cal-titulo-mes");
  var calGrade = document.getElementById("cal-grade");
  var calMesAnt = document.getElementById("cal-mes-ant");
  var calProxMes = document.getElementById("cal-prox-mes");
  var mesCal = new Date().getMonth();
  var anoCal = new Date().getFullYear();

  function diasComEventoNoMes(y, m) {
    var set = {};
    na.getAgendamentos().forEach(function (a) {
      var d = new Date(a.datetime);
      if (d.getFullYear() === y && d.getMonth() === m) {
        set[d.getDate()] = true;
      }
    });
    return set;
  }

  function renderCalendario() {
    var hoje = new Date();
    var primeiro = new Date(anoCal, mesCal, 1);
    var ultimoDia = new Date(anoCal, mesCal + 1, 0).getDate();
    var inicioSemana = primeiro.getDay();
    calTitulo.textContent = primeiro.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    calGrade.innerHTML = "";
    var marcacoes = diasComEventoNoMes(anoCal, mesCal);

    for (var i = 0; i < inicioSemana; i++) {
      calGrade.appendChild(celulaVaziaCal());
    }

    for (var dia = 1; dia <= ultimoDia; dia++) {
      var ehHoje =
        dia === hoje.getDate() &&
        mesCal === hoje.getMonth() &&
        anoCal === hoje.getFullYear();
      calGrade.appendChild(diaCel(dia, false, ehHoje, !!marcacoes[dia], anoCal, mesCal));
    }
  }

  function celulaVaziaCal() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-dia fora";
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
    return btn;
  }

  function diaCel(n, fora, hoje, temEvento, y, m) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-dia";
    btn.textContent = String(n);
    if (fora) {
      btn.classList.add("fora");
      btn.disabled = true;
    } else {
      if (hoje) btn.classList.add("hoje");
      if (temEvento) btn.classList.add("tem-evento");
      btn.addEventListener("click", function () {
        var mm = String(m + 1).padStart(2, "0");
        var dd = String(n).padStart(2, "0");
        agData.value = y + "-" + mm + "-" + dd;
      });
    }
    return btn;
  }

  calMesAnt.addEventListener("click", function () {
    mesCal--;
    if (mesCal < 0) {
      mesCal = 11;
      anoCal--;
    }
    renderCalendario();
  });
  calProxMes.addEventListener("click", function () {
    mesCal++;
    if (mesCal > 11) {
      mesCal = 0;
      anoCal++;
    }
    renderCalendario();
  });

  var h = new Date();
  agData.value =
    h.getFullYear() +
    "-" +
    String(h.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(h.getDate()).padStart(2, "0");
  agHora.value = "09:00";

  popularSelectServicos();
  renderCalendario();
})();
