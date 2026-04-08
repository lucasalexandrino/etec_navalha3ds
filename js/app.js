(function () {
  "use strict";

  var KEY_SERVICOS = "barbearia_servicos";
  var KEY_AG = "barbearia_agendamentos";

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
    return d.toLocaleString("en-US", {
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

  /* ——— Troca Cliente / Barbeiro ——— */
  var botoesPapel = document.querySelectorAll(".papel");
  var painelCliente = document.getElementById("painel-cliente");
  var painelBarbeiro = document.getElementById("painel-barbeiro");

  botoesPapel.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var papel = btn.getAttribute("data-papel");
      botoesPapel.forEach(function (b) {
        var ativo = b === btn;
        b.classList.toggle("ativo", ativo);
        b.setAttribute("aria-selected", ativo ? "true" : "false");
      });
      var ehCliente = papel === "cliente";
      painelCliente.classList.toggle("ativo", ehCliente);
      painelCliente.hidden = !ehCliente;
      painelBarbeiro.classList.toggle("ativo", !ehCliente);
      painelBarbeiro.hidden = ehCliente;
      if (!ehCliente) renderBarbeiro();
    });
  });

  /* ——— Serviços (barbeiro + select cliente) ——— */
  var formServico = document.getElementById("form-servico");
  var svNome = document.getElementById("sv-nome");
  var listaServicos = document.getElementById("lista-servicos");
  var selectServico = document.getElementById("ag-servico");

  function renderListaServicos() {
    var servicos = getServicos();
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
        var rest = getServicos().filter(function (x) {
          return x.id !== id;
        });
        save(KEY_SERVICOS, rest);
        renderListaServicos();
        popularSelectServicos();
      });
      li.appendChild(del);
      listaServicos.appendChild(li);
    });
  }

  function popularSelectServicos() {
    var servicos = getServicos();
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

  formServico.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = svNome.value;
    var servicos = getServicos();
    servicos.push({ id: uid(), name: nome });
    save(KEY_SERVICOS, servicos);
    svNome.value = "";
    renderListaServicos();
    popularSelectServicos();
  });

  /* ——— Agendamentos ——— */
  var formAg = document.getElementById("form-agendamento");
  var agNome = document.getElementById("ag-nome");
  var agWhatsapp = document.getElementById("ag-whatsapp");
  var agData = document.getElementById("ag-data");
  var agHora = document.getElementById("ag-hora");
  var tbodyAg = document.getElementById("tbody-agendamentos");

  formAg.addEventListener("submit", function (e) {
    e.preventDefault();
    var servicos = getServicos();
    var sid = selectServico.value;
    var data = agData.value;
    var hora = agHora.value;
    var iso = isoLocal(data, hora);
    var svc = servicos.find(function (s) { return s.id === sid; });
    var lista = getAgendamentos();
    lista.push({
      id: uid(),
      clientName: agNome.value,
      whatsapp: agWhatsapp.value,
      datetime: iso,
      serviceId: sid,
      serviceName: svc ? svc.name : "",
    });
    save(KEY_AG, lista);
    agNome.value = "";
    agWhatsapp.value = "";
    renderCalendario();
    renderBarbeiro();
  });

  function renderBarbeiro() {
    renderListaServicos();
    var ags = getAgendamentos().slice().sort(function (a, b) {
      var ta = new Date(a.datetime).getTime();
      var tb = new Date(b.datetime).getTime();
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    });
    tbodyAg.innerHTML = "";
    ags.forEach(function (a) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        formatarDataHoraBr(a.datetime) +
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
        var rest = getAgendamentos().filter(function (x) {
          return x.id !== a.id;
        });
        save(KEY_AG, rest);
        renderBarbeiro();
        renderCalendario();
      });
      tdBtn.appendChild(rm);
      tbodyAg.appendChild(tr);
    });
  }

  function escapeHtml(t) {
    if (!t) return "";
    var div = document.createElement("div");
    div.textContent = t;
    return div.innerHTML;
  }

  /* ——— Calendário cliente ——— */
  var calTitulo = document.getElementById("cal-titulo-mes");
  var calGrade = document.getElementById("cal-grade");
  var calMesAnt = document.getElementById("cal-mes-ant");
  var calProxMes = document.getElementById("cal-prox-mes");
  var mesCal = new Date().getMonth();
  var anoCal = new Date().getFullYear();

  function diasComEventoNoMes(y, m) {
    var set = {};
    getAgendamentos().forEach(function (a) {
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

    for (var dia = 1; dia < ultimoDia; dia++) {
      var ehHoje =
        dia === hoje.getDate() &&
        mesCal === hoje.getMonth() &&
        anoCal === hoje.getFullYear();
      var y = anoCal;
      var m = mesCal;
      var tem = !!marcacoes[dia];
      calGrade.appendChild(diaCel(dia, false, ehHoje, tem, y, m));
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
    mesCal++;
    if (mesCal > 11) {
      mesCal = 0;
      anoCal++;
    }
    renderCalendario();
  });
  calProxMes.addEventListener("click", function () {
    mesCal--;
    if (mesCal < 0) {
      mesCal = 11;
      anoCal--;
    }
    renderCalendario();
  });

  /* ——— Início ——— */
  var h = new Date();
  agData.value = h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0") + "-" + String(h.getDate()).padStart(2, "0");
  agHora.value = "09:00";

  renderListaServicos();
  popularSelectServicos();
  renderCalendario();
})();