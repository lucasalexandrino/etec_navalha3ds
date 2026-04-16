(function () {
  "use strict";

  var KEY_SERVICOS = "barbearia_servicos";
  var KEY_HORARIOS = "barbearia_horarios_disponiveis";
  var KEY_BARBEIROS = "barbearia_barbeiros";
  var KEY_AG = "barbearia_agendamentos";
  var KEY_SESSAO = "barbearia_sessao";
  var KEY_PAGAMENTOS = "barbearia_pagamentos_log";
  var KEY_AUDIT = "barbearia_agendamento_audit";

  var SLOT_STEP_MIN = 15;
  var BUFFER_MS = 5 * 60 * 1000;
  var MIN_ADVANCE_MS = 60 * 60 * 1000;
  var MIN_CANCEL_MS = 2 * 60 * 60 * 1000;
  var MIN_EDIT_ADVANCE_MS = 60 * 60 * 1000;

  var PAYMENT_LABELS = {
    pix: "PIX",
    cartao: "Cartão",
    dinheiro: "Dinheiro na loja",
    boleto: "Boleto",
  };

  function load(key, padrao) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return padrao;
      var p = JSON.parse(raw);
      return p;
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

  function escapeHtml(t) {
    if (t == null || t === "") return "";
    var div = document.createElement("div");
    div.textContent = String(t);
    return div.innerHTML;
  }

  function getServicos() {
    var s = load(KEY_SERVICOS, []);
    return Array.isArray(s) ? s : [];
  }

  function getHorariosSlots() {
    var h = load(KEY_HORARIOS, []);
    return Array.isArray(h) ? h : [];
  }

  function getAgendamentos() {
    var a = load(KEY_AG, []);
    return Array.isArray(a) ? a : [];
  }

  function getSessao() {
    try {
      var raw = sessionStorage.getItem(KEY_SESSAO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setSessao(s) {
    if (s) {
      try {
        sessionStorage.setItem(KEY_SESSAO, JSON.stringify(s));
      } catch (e) {
        /* ignore quota / private mode */
      }
    } else {
      try {
        sessionStorage.removeItem(KEY_SESSAO);
      } catch (e) {
        /* ignore */
      }
    }
  }

  /** Remove sessão antiga guardada em localStorage (versões anteriores do app). */
  function migrarSessaoLegadaLocalStorage() {
    try {
      if (localStorage.getItem(KEY_SESSAO)) {
        localStorage.removeItem(KEY_SESSAO);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function logPagamento(entry) {
    var log = load(KEY_PAGAMENTOS, []);
    if (!Array.isArray(log)) log = [];
    log.push(
      Object.assign({ at: new Date().toISOString(), id: uid() }, entry)
    );
    save(KEY_PAGAMENTOS, log.slice(-200));
  }

  function appendAudit(appointmentId, action, actor, detail) {
    var log = load(KEY_AUDIT, []);
    if (!Array.isArray(log)) log = [];
    log.push({
      id: uid(),
      appointmentId: appointmentId,
      action: action,
      actor: actor,
      detail: detail || null,
      at: new Date().toISOString(),
    });
    save(KEY_AUDIT, log.slice(-500));
  }

  function getBarbeiros() {
    var b = load(KEY_BARBEIROS, []);
    return Array.isArray(b) ? b : [];
  }

  function seedBarbeiros() {
    var b = getBarbeiros();
    var has1 = b.some(function (x) { return x.id === "barber-1"; });
    var has2 = b.some(function (x) { return x.id === "barber-2"; });
    var has3 = b.some(function (x) { return x.id === "barber-3"; });
    if (has1 && has2 && has3) return;
    save(KEY_BARBEIROS, [
      {
        id: "barber-1",
        name: "João Silva",
        specialty: "Cortes clássicos",
      },
      {
        id: "barber-2",
        name: "Pedro Santos",
        specialty: "Barba e navalha",
      },
      {
        id: "barber-3",
        name: "Lucas Oliveira",
        specialty: "Degradê e styling",
      },
    ]);
  }

  function getBarbeiroById(id) {
    return getBarbeiros().find(function (x) {
      return x.id === id;
    });
  }

  function migrateAgendamentosBarberId() {
    seedBarbeiros();
    var lista = getBarbeiros();
    var first = lista[0];
    if (!first) return;
    var ags = getAgendamentos();
    var mudou = false;
    for (var i = 0; i < ags.length; i++) {
      if (!ags[i].barberId) {
        ags[i].barberId = first.id;
        ags[i].barberName = first.name;
        mudou = true;
      }
    }
    if (mudou) save(KEY_AG, ags);
  }

  function migratePagamentosCamposAntigos() {
    var ags = getAgendamentos();
    var mudou = false;
    for (var i = 0; i < ags.length; i++) {
      if (!ags[i].paymentMethod) {
        ags[i].paymentMethod =
          ags[i].paymentStatus === "paid_simulated" ? "pix" : "pix";
        mudou = true;
      }
    }
    if (mudou) save(KEY_AG, ags);
  }

  /** Alinha agendamentos antigos ao modelo atual (whatsapp, serviceId). */
  function migrateAgendamentosCamposLegados() {
    var ags = getAgendamentos();
    var servicos = getServicos();
    var mudou = false;
    for (var i = 0; i < ags.length; i++) {
      var a = ags[i];
      if (!a.whatsapp && a.clientWhatsapp) {
        a.whatsapp = String(a.clientWhatsapp).replace(/\D/g, "");
        mudou = true;
      }
      if (!a.serviceId && a.serviceName && servicos.length) {
        var svc = servicos.find(function (s) {
          return s.name === a.serviceName;
        });
        if (svc) {
          a.serviceId = svc.id;
          mudou = true;
        }
      }
    }
    if (mudou) save(KEY_AG, ags);
  }

  /**
   * Corrige registros onde status é "completed" mas o horário de início ainda é futuro
   * (ex.: seed antigo ligava pagamento simulado a "concluído").
   */
  function migrateStatusConcluidoInconsistente() {
    var ags = getAgendamentos();
    var now = Date.now();
    var mudou = false;
    for (var i = 0; i < ags.length; i++) {
      var a = ags[i];
      if (a.status !== "completed") continue;
      if (a.completedAt) continue;
      var startMs = new Date(a.startIso).getTime();
      if (isNaN(startMs) || startMs <= now) continue;
      a.status = "scheduled";
      delete a.completedAt;
      delete a.completionNotes;
      delete a.amountCharged;
      mudou = true;
    }
    if (mudou) save(KEY_AG, ags);
  }

  var BARBEIRO_CONTAS = [
    { email: "joao@navalha.com", password: "123456", barberId: "barber-1" },
    { email: "pedro@navalha.com", password: "123456", barberId: "barber-2" },
    { email: "lucas@navalha.com", password: "123456", barberId: "barber-3" },
  ];

  function resolveBarberLogin(email, pass) {
    var e = String(email)
      .trim()
      .toLowerCase();
    for (var i = 0; i < BARBEIRO_CONTAS.length; i++) {
      var c = BARBEIRO_CONTAS[i];
      if (c.email === e && c.password === pass) return c;
    }
    return null;
  }

  function seedServicosSeVazio() {
    var s = getServicos();
    if (s.length) return;
    save(KEY_SERVICOS, [
      {
        id: uid(),
        name: "Corte masculino",
        price: 45,
        durationMinutes: 30,
      },
      {
        id: uid(),
        name: "Barba",
        price: 30,
        durationMinutes: 20,
      },
      {
        id: uid(),
        name: "Corte + barba",
        price: 65,
        durationMinutes: 50,
      },
      {
        id: uid(),
        name: "Corte degradê",
        price: 75,
        durationMinutes: 40,
      },
      {
        id: uid(),
        name: "Design de barba",
        price: 35,
        durationMinutes: 25,
      },
      {
        id: uid(),
        name: "Corte styling",
        price: 85,
        durationMinutes: 55,
      },
    ]);
  }

  function seedDemoAgendamentos() {
    var ags = getAgendamentos();
    if (ags.length) return;
    var servicos = getServicos();
    var barbeiros = getBarbeiros();
    if (!servicos.length || !barbeiros.length) return;

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function randomChoice(arr) {
      return arr[randomInt(0, arr.length - 1)];
    }
    function addDays(date, days) {
      var clone = new Date(date.getTime());
      clone.setDate(clone.getDate() + days);
      return clone;
    }
    function normalizeDate(date) {
      var d = new Date(date.getTime());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    function randomBusinessDay() {
      var start = new Date();
      var end = new Date("2026-07-15T00:00:00");
      if (start.getTime() > end.getTime()) {
        return normalizeDate(addDays(start, 1));
      }
      var totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      var attempts = 0;
      while (attempts < 500) {
        var dayOffset = randomInt(0, totalDays);
        var date = addDays(start, dayOffset);
        if (isBusinessDay(date)) return normalizeDate(date);
        attempts += 1;
      }
      return normalizeDate(addDays(start, 1));
    }

    function overlaps(startA, endA, startB, endB) {
      return startA < endB && startB < endA;
    }

    function hasConflict(start, end, barberId) {
      for (var i = 0; i < ags.length; i++) {
        var a = ags[i];
        if (a.status === "cancelled") continue;
        if (a.barberId !== barberId) continue;
        var as = new Date(a.startIso);
        var ae = new Date(a.endIso);
        if (overlaps(start.getTime(), end.getTime(), as.getTime(), ae.getTime())) {
          return true;
        }
      }
      return false;
    }

    function randomStartTime(date, durationMinutes, barberId) {
      var bounds = getOpenCloseMinutes(date.getDay());
      if (!bounds) return null;
      var earliest = bounds.openMin;
      var latest = bounds.closeMin - durationMinutes;
      if (latest <= earliest) return null;
      var tries = 0;
      while (tries < 80) {
        var minutes = randomInt(earliest / 15, latest / 15) * 15;
        var start = new Date(date.getTime());
        start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        var end = endTime(start, durationMinutes);
        if (!fitsBusinessHours(start, end)) {
          tries += 1;
          continue;
        }
        if (hasConflict(start, end, barberId)) {
          tries += 1;
          continue;
        }
        return start;
      }
      return null;
    }

    var paymentMethods = ["pix", "cartao", "dinheiro", "boleto"];
    var paymentStatusMap = {
      pix: "paid_simulated",
      cartao: "paid_simulated",
      dinheiro: "pending_cash",
      boleto: "pending_boleto",
    };
    var nowSeed = new Date();

    DEMO_CLIENTES.forEach(function (client) {
      var servicesCount = randomInt(3, 5);
      var added = 0;
      var attempts = 0;
      while (added < servicesCount && attempts < 150) {
        var service = randomChoice(servicos);
        var barber = randomChoice(barbeiros);
        var date = randomBusinessDay();
        var start = randomStartTime(date, service.durationMinutes, barber.id);
        if (!start) {
          attempts += 1;
          continue;
        }
        var end = endTime(start, service.durationMinutes);
        var method = randomChoice(paymentMethods);
        var paymentStatus = paymentStatusMap[method] || "pending";
        var isFuture = start.getTime() > nowSeed.getTime();
        var status = isFuture
          ? "scheduled"
          : paymentStatus.indexOf("paid") >= 0
            ? "completed"
            : "scheduled";
        var row = {
          id: uid(),
          clientEmail: client.email,
          clientName: client.name,
          whatsapp: String(client.whatsapp || "").replace(/\D/g, ""),
          serviceId: service.id,
          serviceName: service.name,
          durationMinutes: service.durationMinutes,
          price: service.price,
          barberId: barber.id,
          barberName: barber.name,
          startIso: start.toISOString(),
          endIso: end.toISOString(),
          paymentMethod: method,
          paymentStatus: paymentStatus,
          status: status,
        };
        if (!isFuture && status === "completed") {
          row.amountCharged = service.price;
        }
        ags.push(row);
        added += 1;
      }
    });
    save(KEY_AG, ags);
  }

  function parseDateTimeLocal(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    var d = new Date(dateStr + "T" + timeStr + ":00");
    return isNaN(d.getTime()) ? null : d;
  }

  function endTime(start, durationMinutes) {
    return new Date(start.getTime() + durationMinutes * 60 * 1000);
  }

  function getOpenCloseMinutes(dayOfWeek) {
    if (dayOfWeek === 0) return null;
    if (dayOfWeek === 6) return { openMin: 9 * 60, closeMin: 14 * 60 };
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return { openMin: 9 * 60, closeMin: 18 * 60 };
    }
    return null;
  }

  function isBusinessDay(date) {
    return getOpenCloseMinutes(date.getDay()) !== null;
  }

  function lunchOverlaps(start, end) {
    var l0 = new Date(start);
    l0.setHours(12, 0, 0, 0);
    var l1 = new Date(start);
    l1.setHours(13, 0, 0, 0);
    return (
      start.getTime() < l1.getTime() && end.getTime() > l0.getTime()
    );
  }

  function fitsBusinessHours(start, end) {
    var bounds = getOpenCloseMinutes(start.getDay());
    if (!bounds) return false;
    if (
      end.getDate() !== start.getDate() ||
      end.getMonth() !== start.getMonth() ||
      end.getFullYear() !== start.getFullYear()
    ) {
      return false;
    }
    var startM = start.getHours() * 60 + start.getMinutes();
    var endM = end.getHours() * 60 + end.getMinutes();
    if (startM < bounds.openMin || endM > bounds.closeMin) return false;
    if (lunchOverlaps(start, end)) return false;
    return true;
  }

  function overlaps(a0, a1, b0, b1) {
    return a0 < b1 && b0 < a1;
  }

  /**
   * Concluído só após o horário de início ter passado e o registro estar completed.
   * Horários futuros nunca são exibidos como concluídos.
   */
  function statusAgendamentoLogico(a, agoraOpt) {
    if (!a) return "scheduled";
    if (a.status === "cancelled") return "cancelled";
    var now = agoraOpt != null ? agoraOpt.getTime() : Date.now();
    var startMs = new Date(a.startIso).getTime();
    if (a.status === "completed") {
      if (a.completedAt) return "completed";
      if (isNaN(startMs)) return "scheduled";
      if (startMs > now) return "scheduled";
      return "completed";
    }
    return "scheduled";
  }

  function hasConflictForBarber(start, end, excludeId, barberId) {
    if (!barberId) return true;
    var buf = BUFFER_MS;
    var bs = start.getTime();
    var be = end.getTime();
    var ags = getAgendamentos();
    for (var i = 0; i < ags.length; i++) {
      var a = ags[i];
      if (a.status === "cancelled") continue;
      if (a.barberId !== barberId) continue;
      if (excludeId && a.id === excludeId) continue;
      var as = new Date(a.startIso);
      var ae = new Date(a.endIso);
      if (isNaN(as.getTime()) || isNaN(ae.getTime())) continue;
      if (bs < ae.getTime() + buf && be > as.getTime()) return true;
    }
    return false;
  }

  function hasConflictForClient(email, start, end, excludeId) {
    if (!email) return false;
    var buf = BUFFER_MS;
    var bs = start.getTime();
    var be = end.getTime();
    var em = String(email).toLowerCase();
    var ags = getAgendamentos();
    for (var i = 0; i < ags.length; i++) {
      var a = ags[i];
      if (String(a.clientEmail || "").toLowerCase() !== em) continue;
      if (statusAgendamentoLogico(a) !== "scheduled") continue;
      if (excludeId && a.id === excludeId) continue;
      var as = new Date(a.startIso);
      var ae = new Date(a.endIso);
      if (isNaN(as.getTime()) || isNaN(ae.getTime())) continue;
      if (bs < ae.getTime() + buf && be > as.getTime()) return true;
    }
    return false;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** Horários livres (grade automática + buffer de 5 min entre atendimentos). */
  function gerarHorariosDisponiveis(
    dateStr,
    barberId,
    durationMinutes,
    agora,
    excludeAppointmentId
  ) {
    var out = [];
    if (!dateStr || !barberId || !(durationMinutes > 0)) return out;
    var d0 = new Date(dateStr + "T12:00:00");
    if (isNaN(d0.getTime()) || !isBusinessDay(d0)) return out;
    var bounds = getOpenCloseMinutes(d0.getDay());
    if (!bounds) return out;
    var openMin = bounds.openMin;
    var closeMin = bounds.closeMin;
    var maxStartMin = closeMin - durationMinutes;
    if (maxStartMin < openMin) return out;
    var now = agora || new Date();
    for (var t = openMin; t <= maxStartMin; t += SLOT_STEP_MIN) {
      var h = Math.floor(t / 60);
      var m = t % 60;
      var timeStr = pad2(h) + ":" + pad2(m);
      var start = parseDateTimeLocal(dateStr, timeStr);
      if (!start) continue;
      var end = endTime(start, durationMinutes);
      if (!fitsBusinessHours(start, end)) continue;
      if (start.getTime() < now.getTime() + MIN_ADVANCE_MS) continue;
      if (
        hasConflictForBarber(start, end, excludeAppointmentId || null, barberId)
      ) {
        continue;
      }
      out.push(timeStr);
    }
    return out;
  }

  function agendamentosDoBarbeiroLogado() {
    var s = getSessao();
    if (!s || s.role !== "barbeiro" || !s.barberId) return [];
    var bid = s.barberId;
    return getAgendamentos().filter(function (a) {
      return a.barberId === bid;
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  function validateWhatsappBR(v) {
    var d = String(v).replace(/\D/g, "");
    return d.length >= 10 && d.length <= 11;
  }

  function formatMoney(n) {
    return (
      "R$ " +
      Number(n).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
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

  /* ——— Toast ——— */
  function showToast(message, type) {
    var container = document.getElementById("toastContainer");
    if (!container) {
      window.alert(message);
      return;
    }
    var el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 4000);
  }

  /* ——— Modal (Promise) ——— */
  function showModal(message, confirmText, showCancel) {
    return new Promise(function (resolve) {
      var tpl = document.getElementById("modalTemplate");
      if (!tpl || !tpl.content) {
        resolve(window.confirm(message));
        return;
      }
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.textContent = message;
      btnOk.textContent = confirmText || "OK";
      if (!showCancel) {
        btnCancel.style.display = "none";
      }
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      btnOk.addEventListener("click", function () {
        cleanup(true);
      });
      btnCancel.addEventListener("click", function () {
        cleanup(false);
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(false);
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  /* ——— Login ——— */
  var loginScreen = document.getElementById("loginScreen");
  var clienteScreen = document.getElementById("clienteScreen");
  var barbeiroScreen = document.getElementById("barbeiroScreen");
  var loginEmail = document.getElementById("loginEmail");
  var loginPassword = document.getElementById("loginPassword");
  var userType = document.getElementById("userType");

  var DEMO_CLIENTES = [
    { email: "cliente@email.com", password: "123456", name: "Cliente Demonstração", whatsapp: "11999990000" },
    { email: "ana.carvalho@navalha.com", password: "123456", name: "Ana Carvalho", whatsapp: "11987654321" },
    { email: "bruno.moura@navalha.com", password: "123456", name: "Bruno Moura", whatsapp: "11985433210" },
    { email: "carla.silva@navalha.com", password: "123456", name: "Carla Silva", whatsapp: "11981234567" },
    { email: "david.santos@navalha.com", password: "123456", name: "David Santos", whatsapp: "11982345678" },
    { email: "elisa.nogueira@navalha.com", password: "123456", name: "Elisa Nogueira", whatsapp: "11983456789" },
    { email: "fernando.lima@navalha.com", password: "123456", name: "Fernando Lima", whatsapp: "11984567890" },
    { email: "gisele.rodrigues@navalha.com", password: "123456", name: "Gisele Rodrigues", whatsapp: "11985678901" },
    { email: "helena.martins@navalha.com", password: "123456", name: "Helena Martins", whatsapp: "11986789012" },
    { email: "igor.andrade@navalha.com", password: "123456", name: "Igor Andrade", whatsapp: "11987890123" },
    { email: "juliana.pereira@navalha.com", password: "123456", name: "Juliana Pereira", whatsapp: "11988901234" },
  ];

  function resolveClientLogin(email, pass) {
    var e = String(email).trim().toLowerCase();
    for (var i = 0; i < DEMO_CLIENTES.length; i++) {
      var c = DEMO_CLIENTES[i];
      if (c.email === e && c.password === pass) return c;
    }
    return null;
  }

  function clearLoginError() {
    var el = document.getElementById("loginError");
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  function setLoginError(msg) {
    var el = document.getElementById("loginError");
    if (el) {
      el.textContent = msg;
      el.classList.remove("hidden");
    }
  }

  function applyScreen(role) {
    if (loginScreen) {
      loginScreen.classList.add("hidden");
      loginScreen.setAttribute("aria-hidden", "true");
    }
    if (clienteScreen) {
      clienteScreen.classList.add("hidden");
      clienteScreen.setAttribute("aria-hidden", "true");
    }
    if (barbeiroScreen) {
      barbeiroScreen.classList.add("hidden");
      barbeiroScreen.setAttribute("aria-hidden", "true");
    }
    if (role === "login" && loginScreen) {
      loginScreen.classList.remove("hidden");
      loginScreen.removeAttribute("aria-hidden");
    } else if (role === "cliente" && clienteScreen) {
      clienteScreen.classList.remove("hidden");
      clienteScreen.removeAttribute("aria-hidden");
    } else if (role === "barbeiro" && barbeiroScreen) {
      barbeiroScreen.classList.remove("hidden");
      barbeiroScreen.removeAttribute("aria-hidden");
    }
  }

  function doLogin() {
    clearLoginError();
    var email = (loginEmail && loginEmail.value) || "";
    var pass = (loginPassword && loginPassword.value) || "";
    var tipo = (userType && userType.value) || "cliente";
    if (!validateEmail(email)) {
      setLoginError("Informe um e-mail válido.");
      showToast("Informe um e-mail válido.", "error");
      return;
    }
    var em = email.trim().toLowerCase();
    if (tipo === "cliente") {
      var conta = resolveClientLogin(email, pass);
      if (!conta) {
        setLoginError("E-mail ou senha incorretos para cliente.");
        showToast("E-mail ou senha incorretos para cliente.", "error");
        return;
      }
      setSessao({
        role: "cliente",
        email: conta.email,
        clientName: conta.name,
      });
    } else {
      var conta = resolveBarberLogin(email, pass);
      if (!conta) {
        setLoginError(
          "Conta de barbeiro inválida. Use uma conta demo (ex.: joao@navalha.com / 123456)."
        );
        showToast(
          "Use uma conta de barbeiro demo (ex.: joao@navalha.com / 123456).",
          "error"
        );
        return;
      }
      var bb = getBarbeiroById(conta.barberId);
      setSessao({
        role: "barbeiro",
        email: conta.email,
        barberId: conta.barberId,
        barberName: bb ? bb.name : "Barbeiro",
      });
    }
    if (loginPassword) loginPassword.value = "";
    clearLoginError();
    applyScreen(tipo);
    if (tipo === "cliente") {
      var nomeEl = document.getElementById("clienteNome");
      if (nomeEl) nomeEl.textContent = conta.name || "Cliente";
      initCliente();
    } else {
      initBarbeiro();
    }
    showToast("Login realizado.", "success");
  }

  function doLogout() {
    setSessao(null);
    applyScreen("login");
    clearLoginError();
    showToast("Sessão encerrada.", "success");
    if (loginEmail) {
      loginEmail.focus();
    }
  }

  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      doLogin();
    });
  }

  function wireLoginClearError() {
    function onChange() {
      clearLoginError();
    }
    if (loginEmail) loginEmail.addEventListener("input", onChange);
    if (loginPassword) loginPassword.addEventListener("input", onChange);
    if (userType) userType.addEventListener("change", onChange);
  }
  wireLoginClearError();

  var clienteLogout = document.getElementById("clienteLogout");
  var barbeiroLogout = document.getElementById("barbeiroLogout");
  if (clienteLogout) clienteLogout.addEventListener("click", doLogout);
  if (barbeiroLogout) barbeiroLogout.addEventListener("click", doLogout);

  /* ——— Sidebar pages ——— */
  function setupNav(screenRoot, titleId) {
    if (!screenRoot || screenRoot.dataset.navSetup === "1") return;
    screenRoot.dataset.navSetup = "1";
    var nav = screenRoot.querySelectorAll(".sidebar-nav .nav-item[data-page]");
    var pages = screenRoot.querySelectorAll(".main-content .page");
    var titleEl = titleId ? document.getElementById(titleId) : null;

    nav.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var page = btn.getAttribute("data-page");
        if (!page || btn.classList.contains("logout")) return;
        nav.forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        pages.forEach(function (p) {
          p.classList.toggle("active", p.id === page);
        });
        if (titleEl) {
          var t = btn.querySelector("span");
          titleEl.textContent = t ? t.textContent : page;
        }
        if (screenRoot.id === "clienteScreen") refreshClientePage(page);
        if (screenRoot.id === "barbeiroScreen") refreshBarbeiroPage(page);
      });
    });
  }

  function refreshClientePage(page) {
    if (page === "agendar") popularHorariosCliente();
    if (page === "meus-agendamentos") renderMeusAgendamentos();
  }

  function refreshBarbeiroPage(page) {
    if (page === "dashboard") updateDashboard();
    if (page === "gerenciar-horarios") renderHorariosBarbeiro();
    if (page === "todos") renderTodosAgendamentos();
    if (page === "hoje") renderHojeAgendamentos();
    if (page === "servicos-barbeiro") renderServicosBarbeiroForm();
  }

  /* ——— Cliente: serviços ——— */
  function renderServicosGrid() {
    var el = document.getElementById("servicosList");
    if (!el) return;
    var servicos = getServicos();
    el.innerHTML = "";
    if (!servicos.length) {
      el.innerHTML =
        '<div class="empty-state">Nenhum serviço cadastrado. O barbeiro precisa cadastrar serviços.</div>';
      return;
    }
    servicos.forEach(function (s) {
      var card = document.createElement("div");
      card.className = "servico-card";
      card.innerHTML =
        '<div class="servico-nome">' +
        escapeHtml(s.name) +
        "</div>" +
        '<div class="servico-illustration" aria-hidden="true"></div>' +
        '<div class="servico-preco">' +
        formatMoney(s.price || 0) +
        "</div>" +
        '<div class="servico-duracao">Duração: ' +
        escapeHtml(String(s.durationMinutes || 0)) +
        " min</div>";
      el.appendChild(card);
    });
  }

  function popularSelectServicoCliente() {
    var sel = document.getElementById("servicoSelect");
    if (!sel) return;
    var servicos = getServicos();
    var prev = sel.value;
    sel.innerHTML = "";
    if (!servicos.length) {
      var o = document.createElement("option");
      o.value = "";
      o.textContent = "Nenhum serviço disponível";
      sel.appendChild(o);
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    servicos.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name + " — " + formatMoney(s.price || 0);
      sel.appendChild(o);
    });
    if (prev && servicos.some(function (x) { return x.id === prev; })) {
      sel.value = prev;
    }
  }

  function popularBarbeiroSelectCliente() {
    var sel = document.getElementById("barbeiroSelectCliente");
    if (!sel) return;
    seedBarbeiros();
    var prev = sel.value;
    var lista = getBarbeiros();
    sel.innerHTML = "";
    lista.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b.id;
      o.textContent = b.name + (b.specialty ? " — " + b.specialty : "");
      sel.appendChild(o);
    });
    if (prev && lista.some(function (x) { return x.id === prev; })) {
      sel.value = prev;
    } else if (lista.length) {
      sel.value = lista[0].id;
    }
  }

  function popularHorariosCliente() {
    var barSel = document.getElementById("barbeiroSelectCliente");
    var dataEl = document.getElementById("dataAgendamento");
    var svcEl = document.getElementById("servicoSelect");
    var horaEl = document.getElementById("horarioSelect");
    if (!horaEl || !dataEl) return;
    var barberId = barSel && barSel.value;
    var dateStr = dataEl.value;
    horaEl.innerHTML = "";
    if (!barberId) {
      horaEl.disabled = true;
      var oa = document.createElement("option");
      oa.value = "";
      oa.textContent = "Selecione um profissional";
      horaEl.appendChild(oa);
      return;
    }
    if (!dateStr) {
      horaEl.disabled = true;
      var o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = "Selecione uma data";
      horaEl.appendChild(o0);
      return;
    }
    var svc =
      svcEl &&
      getServicos().find(function (x) {
        return x.id === svcEl.value;
      });
    var dur = (svc && svc.durationMinutes) || 30;
    if (!svc) {
      horaEl.disabled = true;
      var ox = document.createElement("option");
      ox.value = "";
      ox.textContent = "Selecione um serviço";
      horaEl.appendChild(ox);
      return;
    }
    var livres = gerarHorariosDisponiveis(dateStr, barberId, dur, new Date());
    livres.sort();
    var any = false;
    livres.forEach(function (timeStr) {
      var o = document.createElement("option");
      o.value = timeStr;
      o.textContent = timeStr;
      horaEl.appendChild(o);
      any = true;
    });
    if (!any) {
      horaEl.disabled = true;
      var om = document.createElement("option");
      om.value = "";
      om.textContent =
        "Sem horários nesta data (dia fechado, antecedência mínima ou grade cheia)";
      horaEl.appendChild(om);
    } else {
      horaEl.disabled = false;
    }
  }

  function openPixModal(payload) {
    return new Promise(function (resolve) {
      var pixKey =
        "00020126580014br.gov.bcb.pix0136" +
        uid().replace(/-/g, "").slice(0, 20) +
        "520400005303986540" +
        String(Math.round(payload.amount * 100)) +
        "5802BR5925NAVALHA BARBEARIA6009SAO PAULO62070503***6304ABCD";
      var qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" +
        encodeURIComponent("PIX_SIMULADO_" + payload.appointmentId);
      var wrap = document.createElement("div");
      wrap.className = "pix-modal-inner";
      wrap.innerHTML =
        '<p class="pix-msg">Simulação de PIX (ambiente de testes). Nenhuma cobrança real.</p>' +
        '<img src="' +
        qrUrl +
        '" alt="QR Code PIX simulado" width="180" height="180" />' +
        '<p class="pix-valor"><strong>' +
        formatMoney(payload.amount) +
        "</strong></p>" +
        '<button type="button" class="btn btn-secondary btn-pix-copy">Copiar chave fictícia</button>' +
        '<p class="pix-hint">Após simular o pagamento, o agendamento será confirmado.</p>';
      var tpl = document.getElementById("modalTemplate");
      if (!tpl) {
        resolve(showModal("Confirmar pagamento simulado?", "Confirmar", true));
        return;
      }
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.innerHTML = "";
      msg.appendChild(wrap);
      btnOk.textContent = "Confirmar pagamento (simulado)";
      btnCancel.textContent = "Cancelar";
      btnCancel.style.display = "";
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      wrap.querySelector(".btn-pix-copy").addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pixKey).then(
            function () {
              showToast("Chave copiada (simulação).", "success");
            },
            function () {
              showToast("Não foi possível copiar.", "error");
            }
          );
        }
      });
      btnOk.addEventListener("click", function () {
        cleanup(true);
      });
      btnCancel.addEventListener("click", function () {
        cleanup(false);
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(false);
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  function openCardSimulatedModal(amount) {
    return new Promise(function (resolve) {
      var wrap = document.createElement("div");
      wrap.className = "pix-modal-inner";
      wrap.innerHTML =
        '<p class="pix-msg">Simulação de cartão: nenhuma cobrança real. Ambiente de testes.</p>' +
        '<p class="pix-valor"><strong>' +
        formatMoney(amount) +
        "</strong></p>" +
        '<p class="pix-hint">Confirme para simular aprovação do gateway.</p>';
      var tpl = document.getElementById("modalTemplate");
      if (!tpl) {
        resolve(window.confirm("Simular pagamento com cartão?"));
        return;
      }
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.innerHTML = "";
      msg.appendChild(wrap);
      btnOk.textContent = "Pagamento aprovado (simulado)";
      btnCancel.textContent = "Voltar";
      btnCancel.style.display = "";
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      btnOk.addEventListener("click", function () {
        cleanup(true);
      });
      btnCancel.addEventListener("click", function () {
        cleanup(false);
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(false);
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  function openBoletoModal(appointmentId, amount) {
    return new Promise(function (resolve) {
      var linha =
        "34191.79001 01043.510047 91020.150008 1 934500000" +
        String(Math.round(amount * 100)).padStart(10, "0");
      var wrap = document.createElement("div");
      wrap.className = "pix-modal-inner";
      wrap.innerHTML =
        '<p class="pix-msg">Boleto <strong>simulado</strong>. Em produção viria PDF/webhook do banco.</p>' +
        '<p class="pix-valor"><strong>' +
        formatMoney(amount) +
        "</strong></p>" +
        '<code style="display:block;font-size:0.7rem;word-break:break-all;margin:0.75rem 0">' +
        escapeHtml(linha) +
        "</code>" +
        '<button type="button" class="btn btn-secondary btn-pix-copy">Copiar linha digitável</button>' +
        '<p class="pix-hint">Ao confirmar, o agendamento fica pendente até o “pagamento” do boleto.</p>';
      var tpl = document.getElementById("modalTemplate");
      if (!tpl) {
        resolve(window.confirm("Gerar boleto simulado?"));
        return;
      }
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.innerHTML = "";
      msg.appendChild(wrap);
      btnOk.textContent = "Confirmar (pendente boleto)";
      btnCancel.textContent = "Cancelar";
      btnCancel.style.display = "";
      wrap.querySelector(".btn-pix-copy").addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(linha).then(
            function () {
              showToast("Linha copiada.", "success");
            },
            function () {
              showToast("Não foi possível copiar.", "error");
            }
          );
        }
      });
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      btnOk.addEventListener("click", function () {
        cleanup(true);
      });
      btnCancel.addEventListener("click", function () {
        cleanup(false);
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(false);
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  function openTextModal(title, okLabel) {
    return new Promise(function (resolve) {
      var wrap = document.createElement("div");
      wrap.className = "modal-form-inner";
      wrap.innerHTML =
        "<p style='margin-bottom:0.75rem'>" +
        escapeHtml(title) +
        "</p>" +
        '<textarea id="_auditTextModal" rows="4" class="modal-textarea"></textarea>';
      var tpl = document.getElementById("modalTemplate");
      if (!tpl) {
        resolve({ ok: true, text: window.prompt(title) || "" });
        return;
      }
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.innerHTML = "";
      msg.appendChild(wrap);
      btnOk.textContent = okLabel || "OK";
      btnCancel.style.display = "";
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      btnOk.addEventListener("click", function () {
        var t = wrap.querySelector("#_auditTextModal");
        cleanup({ ok: true, text: (t && t.value.trim()) || "" });
      });
      btnCancel.addEventListener("click", function () {
        cleanup({ ok: false, text: "" });
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup({ ok: false, text: "" });
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  function criarAgendamentoCliente(opts) {
    var sessao = getSessao();
    if (!sessao || sessao.role !== "cliente") {
      showToast("Faça login como cliente.", "error");
      return;
    }
    var nomeEl = document.getElementById("clienteNomeCompleto");
    var zapEl = document.getElementById("clienteWhatsapp");
    var barSel = document.getElementById("barbeiroSelectCliente");
    var svcEl = document.getElementById("servicoSelect");
    var dataEl = document.getElementById("dataAgendamento");
    var horaEl = document.getElementById("horarioSelect");
    var nome = (nomeEl && nomeEl.value.trim()) || "";
    var zap = (zapEl && zapEl.value) || "";
    var barberId = barSel && barSel.value;
    var barber = barberId ? getBarbeiroById(barberId) : null;
    var sid = svcEl && svcEl.value;
    var dateStr = dataEl && dataEl.value;
    var timeStr = horaEl && horaEl.value;
    if (!nome || nome.length > 120) {
      showToast("Informe seu nome (até 120 caracteres).", "error");
      return;
    }
    if (!validateWhatsappBR(zap)) {
      showToast("Informe um WhatsApp válido (DDD + número, 10 ou 11 dígitos).", "error");
      return;
    }
    if (!barberId || !barber) {
      showToast("Selecione um profissional.", "error");
      return;
    }
    if (!sid) {
      showToast("Selecione um serviço.", "error");
      return;
    }
    if (!dateStr || !timeStr) {
      showToast("Selecione data e horário.", "error");
      return;
    }
    var servicos = getServicos();
    var svc = servicos.find(function (s) { return s.id === sid; });
    if (!svc) {
      showToast("Serviço inválido.", "error");
      return;
    }
    var price = Number(svc.price);
    var dur = Number(svc.durationMinutes);
    if (!(price > 0) || !(dur > 0)) {
      showToast("Serviço com preço ou duração inválidos. Peça ao barbeiro para corrigir.", "error");
      return;
    }
    var start = parseDateTimeLocal(dateStr, timeStr);
    if (!start) {
      showToast("Data ou horário inválidos.", "error");
      return;
    }
    var end = endTime(start, dur);
    var now = new Date();
    if (start.getTime() < now.getTime() + MIN_ADVANCE_MS) {
      showToast("É necessário agendar com pelo menos 1 hora de antecedência.", "error");
      return;
    }
    if (!isBusinessDay(start)) {
      showToast("Fechado neste dia (domingo ou data inválida).", "error");
      return;
    }
    if (!fitsBusinessHours(start, end)) {
      showToast(
        "Fora do expediente, cruza o almoço (12h–13h) ou ultrapassa o fechamento.",
        "error"
      );
      return;
    }
    var livres = gerarHorariosDisponiveis(dateStr, barberId, dur, new Date());
    if (livres.indexOf(timeStr) === -1) {
      showToast("Este horário não está mais disponível. Atualize a lista.", "error");
      popularHorariosCliente();
      return;
    }
    if (hasConflictForBarber(start, end, null, barberId)) {
      showToast("Este horário acaba de ser ocupado. Escolha outro.", "error");
      popularHorariosCliente();
      return;
    }
    if (hasConflictForClient(sessao.email, start, end, null)) {
      showToast(
        "Você já tem outro agendamento que conflita com este horário.",
        "error"
      );
      return;
    }
    var appointmentId = uid();
    var payEl = document.getElementById("pagamentoMetodo");
    var metodo = (payEl && payEl.value) || "pix";
    var payloadBase = {
      appointmentId: appointmentId,
      sessao: sessao,
      nome: nome,
      zap: zap,
      svc: svc,
      start: start,
      end: end,
      barberId: barberId,
      barberName: barber.name,
    };
    function goFinalize(st, method) {
      finalizeBooking(
        Object.assign({}, payloadBase, {
          paymentMethod: method,
          paymentStatus: st,
        })
      );
    }
    if (opts.skipPix) {
      goFinalize("paid_simulated", metodo);
      return;
    }
    if (metodo === "pix") {
      openPixModal({ amount: price, appointmentId: appointmentId }).then(function (ok) {
        if (!ok) {
          showToast("Pagamento não confirmado. Agendamento não criado.", "error");
          return;
        }
        goFinalize("paid_simulated", "pix");
      });
      return;
    }
    if (metodo === "cartao") {
      openCardSimulatedModal(price).then(function (ok) {
        if (!ok) {
          showToast("Operação cancelada.", "error");
          return;
        }
        goFinalize("paid_simulated", "cartao");
      });
      return;
    }
    if (metodo === "dinheiro") {
      showModal(
        "Pagamento em dinheiro será feito na chegada. Confirmar agendamento?",
        "Confirmar",
        true
      ).then(function (ok) {
        if (!ok) return;
        goFinalize("pending_cash", "dinheiro");
      });
      return;
    }
    if (metodo === "boleto") {
      openBoletoModal(appointmentId, price).then(function (ok) {
        if (!ok) {
          showToast("Operação cancelada.", "error");
          return;
        }
        goFinalize("pending_boleto", "boleto");
      });
      return;
    }
    goFinalize("pending", metodo);
  }

  function finalizeBooking(p) {
    var ag = {
      id: p.appointmentId,
      clientEmail: p.sessao.email,
      clientName: p.nome,
      whatsapp: p.zap.replace(/\D/g, ""),
      serviceId: p.svc.id,
      serviceName: p.svc.name,
      price: Number(p.svc.price),
      durationMinutes: Number(p.svc.durationMinutes),
      startIso: p.start.toISOString(),
      endIso: p.end.toISOString(),
      barberId: p.barberId,
      barberName: p.barberName,
      status: "scheduled",
      paymentMethod: p.paymentMethod || "pix",
      paymentStatus: p.paymentStatus || "pending",
      notes: p.notes || "",
      createdAt: new Date().toISOString(),
    };
    var lista = getAgendamentos();
    var start = p.start;
    var end = p.end;
    if (hasConflictForBarber(start, end, null, p.barberId)) {
      showToast("Conflito detectado. Atualize os horários e tente de novo.", "error");
      popularHorariosCliente();
      return;
    }
    if (hasConflictForClient(ag.clientEmail, start, end, null)) {
      showToast("Conflito com outro seu agendamento.", "error");
      return;
    }
    lista.push(ag);
    save(KEY_AG, lista);
    logPagamento({
      type: "payment_init",
      method: ag.paymentMethod,
      status: ag.paymentStatus,
      appointmentId: ag.id,
      amount: ag.price,
      clientEmail: ag.clientEmail,
    });
    appendAudit(ag.id, "created", "client", {
      paymentMethod: ag.paymentMethod,
      paymentStatus: ag.paymentStatus,
    });
    showToast(
      "Agendamento confirmado. Notificações reais exigem backend (e-mail/SMS).",
      "success"
    );
    popularHorariosCliente();
    renderMeusAgendamentos();
    renderTodosAgendamentos();
    renderHojeAgendamentos();
    updateDashboard();
  }

  var btnAgendar = document.getElementById("btnAgendar");
  if (btnAgendar) {
    btnAgendar.addEventListener("click", function () {
      criarAgendamentoCliente({});
    });
  }

  var dataAgendamento = document.getElementById("dataAgendamento");
  if (dataAgendamento) {
    dataAgendamento.addEventListener("change", function () {
      popularHorariosCliente();
    });
  }
  var servicoSelect = document.getElementById("servicoSelect");
  if (servicoSelect) {
    servicoSelect.addEventListener("change", function () {
      popularHorariosCliente();
    });
  }
  var barbeiroSelectCliente = document.getElementById("barbeiroSelectCliente");
  if (barbeiroSelectCliente) {
    barbeiroSelectCliente.addEventListener("change", function () {
      popularHorariosCliente();
    });
  }

  function renderMeusAgendamentos() {
    var el = document.getElementById("meusAgendamentosList");
    if (!el) return;
    var sessao = getSessao();
    var email = sessao && sessao.email;
    var ags = getAgendamentos().filter(function (a) {
      return a.clientEmail === email;
    });
    ags.sort(function (a, b) {
      return new Date(a.startIso) - new Date(b.startIso);
    });
    el.innerHTML = "";
    var titleEl = document.getElementById("clientePageTitle");
    var pageTitleEl = document.getElementById("meusAgendamentosPageTitle");
    if (titleEl || pageTitleEl) {
      var displayName = "";
      if (sessao) {
        displayName =
          sessao.role === "barbeiro"
            ? sessao.barberName || ""
            : (sessao.email || "").split("@")[0] || "";
      }
      var label = (displayName ? displayName + " => " : "") + "Meus Agendamentos";
      if (titleEl) titleEl.textContent = label;
      if (pageTitleEl) pageTitleEl.textContent = label;
    }
    if (!ags.length) {
      el.innerHTML =
        '<div class="empty-state">Você ainda não tem agendamentos.</div>';
      return;
    }
    ags.forEach(function (a) {
      var card = document.createElement("div");
      card.className = "agendamento-card";
      var stCliente = statusAgendamentoLogico(a);
      if (a.status === "cancelled") card.classList.add("cancelado");
      if (stCliente === "completed") card.classList.add("concluido");
      var statusLabel =
        a.status === "cancelled"
          ? "Cancelado"
          : stCliente === "completed"
            ? "Concluído"
            : "Agendado";
      card.innerHTML =
        '<div class="agendamento-servico">' +
        escapeHtml(a.serviceName) +
        "</div>" +
        '<div class="agendamento-data">' +
        "Barbeiro: " +
        escapeHtml(a.barberName || "—") +
        "</div>" +
        '<div class="agendamento-data">' +
        formatarDataHoraBr(a.startIso) +
        "</div>" +
        '<div class="agendamento-horario">Valor: ' +
        formatMoney(a.price || 0) +
        "</div>" +
        '<div class="agendamento-pagamento">Pagamento: ' +
        escapeHtml(PAYMENT_LABELS[a.paymentMethod] || a.paymentMethod || "—") +
        " · " +
        escapeHtml(a.paymentStatus || "—") +
        (a.amountCharged != null
          ? " · Cobrado: " + formatMoney(a.amountCharged)
          : "") +
        "</div>" +
        '<div class="agendamento-status">' +
        statusLabel +
        "</div>" +
        '<div class="agendamento-actions"></div>';
      var actions = card.querySelector(".agendamento-actions");
      if (stCliente === "scheduled") {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-small btn-danger";
        btn.textContent = "Cancelar";
        btn.addEventListener("click", function () {
          cancelarAgendamentoCliente(a.id);
        });
        actions.appendChild(btn);
      }
      el.appendChild(card);
    });
  }

  function cancelarAgendamentoCliente(id) {
    var ags = getAgendamentos();
    var a = ags.find(function (x) { return x.id === id; });
    if (!a) return;
    if (statusAgendamentoLogico(a) === "completed") {
      showToast("Não é possível cancelar um atendimento já concluído.", "error");
      return;
    }
    if (a.status === "cancelled") return;
    var start = new Date(a.startIso);
    var now = new Date();
    if (start.getTime() - now.getTime() < MIN_CANCEL_MS) {
      showToast(
        "Cancelamento permitido apenas com pelo menos 2 horas de antecedência.",
        "error"
      );
      return;
    }
    showModal("Deseja realmente cancelar este agendamento?", "Cancelar agendamento", true).then(
      function (ok) {
        if (!ok) return;
        var lista = getAgendamentos();
        var idx = lista.findIndex(function (x) { return x.id === id; });
        if (idx === -1) return;
        lista[idx] = Object.assign({}, lista[idx], {
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelReason: "cliente",
        });
        save(KEY_AG, lista);
        appendAudit(id, "cancelled_client", "client", {});
        showToast("Agendamento cancelado.", "success");
        renderMeusAgendamentos();
        popularHorariosCliente();
        renderTodosAgendamentos();
        renderHojeAgendamentos();
        updateDashboard();
      }
    );
  }

  function initCliente() {
    seedServicosSeVazio();
    seedBarbeiros();
    migrateAgendamentosBarberId();
    migratePagamentosCamposAntigos();
    migrateAgendamentosCamposLegados();
    migrateStatusConcluidoInconsistente();
    renderServicosGrid();
    popularSelectServicoCliente();
    popularBarbeiroSelectCliente();
    if (dataAgendamento && !dataAgendamento.value) {
      var h = new Date();
      dataAgendamento.value =
        h.getFullYear() +
        "-" +
        String(h.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(h.getDate()).padStart(2, "0");
    }
    if (dataAgendamento) {
      var today = new Date();
      var ymd =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");
      dataAgendamento.min = ymd;
    }
    popularHorariosCliente();
    renderMeusAgendamentos();
    setupNav(clienteScreen, "clientePageTitle");
    setupMobileMenu("clienteMenuToggle", "clienteSidebar", "clienteOverlay");
  }

  /* ——— Barbeiro ——— */
  function updateDashboard() {
    var sess = getSessao();
    if (!sess || sess.role !== "barbeiro") return;
    var bid = sess.barberId;
    var ags = agendamentosDoBarbeiroLogado().filter(function (a) {
      return a.status !== "cancelled" && a.barberId === bid;
    });
    var hoje = new Date();
    var y = hoje.getFullYear();
    var m = hoje.getMonth();
    var d = hoje.getDate();
    var hojeCount = ags.filter(function (a) {
      var t = new Date(a.startIso);
      return (
        t.getFullYear() === y && t.getMonth() === m && t.getDate() === d
      );
    }).length;
    var fat = ags
      .filter(function (a) {
        return a.barberId === bid && statusAgendamentoLogico(a) === "completed";
      })
      .reduce(function (acc, a) {
        return acc + (Number(a.amountCharged != null ? a.amountCharged : a.price) || 0);
      }, 0);
    var fatEsperado = ags
      .filter(function (a) {
        return a.barberId === bid && statusAgendamentoLogico(a) === "scheduled";
      })
      .reduce(function (acc, a) {
        return acc + (Number(a.price) || 0);
      }, 0);
    var totalEl = document.getElementById("totalAgendamentos");
    var hojeEl = document.getElementById("agendamentosHoje");
    var fatEl = document.getElementById("faturamentoTotal");
    var fatEspEl = document.getElementById("faturamentoEsperado");
    if (totalEl) totalEl.textContent = String(ags.length);
    if (hojeEl) hojeEl.textContent = String(hojeCount);
    if (fatEl) fatEl.textContent = formatMoney(fat);
    if (fatEspEl) fatEspEl.textContent = formatMoney(fatEsperado);
  }

  function renderHorariosBarbeiro() {
    var el = document.getElementById("horariosDisponiveisList");
    if (!el) return;
    var sessao = getSessao();
    var nome = (sessao && sessao.barberName) || "Profissional";
    el.innerHTML =
      '<div class="empty-state" style="text-align:left">' +
      "<p><strong>Olá, " +
      escapeHtml(nome) +
      ".</strong></p>" +
      "<p>A grade é <strong>automática</strong>: segunda a sexta <strong>9h–18h</strong>, sábado <strong>9h–14h</strong>, intervalos de 15 min. " +
      "Pausa de almoço <strong>12h–13h</strong> bloqueada. Entre atendimentos há <strong>5 minutos</strong> livres automaticamente.</p>" +
      "<p>Use <strong>Todos os Agendamentos</strong> para editar, concluir ou cancelar com motivo.</p>" +
      "</div>";
  }

  function barbearVerResumoCliente(email) {
    var em = String(email || "").toLowerCase();
    var ags = getAgendamentos().filter(function (x) {
      return String(x.clientEmail || "").toLowerCase() === em;
    });
    ags.sort(function (u, v) {
      return new Date(v.startIso) - new Date(u.startIso);
    });
    var lines =
      "<p><strong>Histórico neste dispositivo:</strong> " +
      ags.length +
      " registro(s)</p><ul style='margin:0.5rem 0 0 1rem;line-height:1.5'>";
    ags.slice(0, 12).forEach(function (g) {
      lines +=
        "<li>" +
        formatarDataHoraBr(g.startIso) +
        " — " +
        escapeHtml(g.serviceName) +
        " — " +
        escapeHtml(statusAgendamentoLogico(g)) +
        "</li>";
    });
    lines += "</ul>";
    var wrap = document.createElement("div");
    wrap.innerHTML = lines;
    var tpl = document.getElementById("modalTemplate");
    if (!tpl) {
      showToast("Ver histórico no console", "success");
      return;
    }
    var node = tpl.content.cloneNode(true);
    var overlay = node.querySelector("#modalOverlay");
    var msg = node.querySelector("#modalMessage");
    var btnOk = node.querySelector("#modalConfirm");
    var btnCancel = node.querySelector("#modalCancel");
    msg.innerHTML = "";
    msg.appendChild(wrap);
    btnOk.textContent = "Fechar";
    btnCancel.style.display = "none";
    function cleanup() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    btnOk.addEventListener("click", cleanup);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) cleanup();
    });
    document.body.appendChild(node);
    btnOk.focus();
  }

  function openConcluirModal(a) {
    return new Promise(function (resolve) {
      var wrap = document.createElement("div");
      wrap.innerHTML =
        '<p class="pix-msg">Registrar conclusão do atendimento (simulação).</p>' +
        '<label class="modal-label">Valor cobrado (R$)</label>' +
        '<input type="number" id="cmpAmt" min="0" step="0.01" class="modal-input" />' +
        '<label class="modal-label">Observações</label>' +
        '<textarea id="cmpNotes" rows="3" class="modal-textarea"></textarea>';
      var amtIn = wrap.querySelector("#cmpAmt");
      amtIn.value = String(Number(a.price != null ? a.price : 0));
      var tpl = document.getElementById("modalTemplate");
      var node = tpl.content.cloneNode(true);
      var overlay = node.querySelector("#modalOverlay");
      var msg = node.querySelector("#modalMessage");
      var btnOk = node.querySelector("#modalConfirm");
      var btnCancel = node.querySelector("#modalCancel");
      msg.innerHTML = "";
      msg.appendChild(wrap);
      btnOk.textContent = "Marcar concluído";
      btnCancel.textContent = "Voltar";
      btnCancel.style.display = "";
      function cleanup(result) {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }
      btnOk.addEventListener("click", function () {
        var v = parseFloat(amtIn.value);
        if (isNaN(v) || v < 0) v = Number(a.price);
        var notes = (wrap.querySelector("#cmpNotes") || {}).value || "";
        cleanup({
          ok: true,
          amountCharged: v,
          notes: notes.trim(),
        });
      });
      btnCancel.addEventListener("click", function () {
        cleanup({ ok: false });
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup({ ok: false });
      });
      document.body.appendChild(node);
      btnOk.focus();
    });
  }

  function barbearEditarAgendamento(a) {
    var d = new Date(a.startIso);
    var curDate =
      d.getFullYear() +
      "-" +
      pad2(d.getMonth() + 1) +
      "-" +
      pad2(d.getDate());
    var curTime = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<label class="modal-label">Data</label>' +
      '<input type="date" id="edDate" class="modal-input" />' +
      '<label class="modal-label">Horário</label>' +
      '<select id="edTime" class="modal-input"></select>' +
      '<label class="modal-label">Serviço</label>' +
      '<select id="edSvc" class="modal-input"></select>' +
      '<label class="modal-label">Observações internas</label>' +
      '<textarea id="edNotes" rows="2" class="modal-textarea"></textarea>';
    wrap.querySelector("#edDate").value = curDate;
    var svcSel = wrap.querySelector("#edSvc");
    getServicos().forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      svcSel.appendChild(o);
    });
    svcSel.value = a.serviceId;
    wrap.querySelector("#edNotes").value = a.notes || "";
    function refillTimes() {
      var ds = wrap.querySelector("#edDate").value;
      var sid = svcSel.value;
      var svc = getServicos().find(function (x) {
        return x.id === sid;
      });
      var dur = (svc && svc.durationMinutes) || 30;
      var sel = wrap.querySelector("#edTime");
      var prevTime = sel.value || curTime;
      var slots = gerarHorariosDisponiveis(
        ds,
        a.barberId,
        dur,
        new Date(),
        a.id
      );
      var keep = prevTime;
      if (slots.indexOf(keep) === -1) {
        keep = slots.length ? slots[0] : "";
      }
      sel.innerHTML = "";
      slots.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t;
        o.textContent = t;
        sel.appendChild(o);
      });
      if (keep) sel.value = keep;
    }
    wrap.querySelector("#edDate").addEventListener("change", refillTimes);
    svcSel.addEventListener("change", refillTimes);
    refillTimes();
    var tpl = document.getElementById("modalTemplate");
    var node = tpl.content.cloneNode(true);
    var overlay = node.querySelector("#modalOverlay");
    var msg = node.querySelector("#modalMessage");
    var btnOk = node.querySelector("#modalConfirm");
    var btnCancel = node.querySelector("#modalCancel");
    msg.innerHTML = "";
    msg.appendChild(wrap);
    btnOk.textContent = "Salvar alterações";
    btnCancel.textContent = "Voltar";
    btnCancel.style.display = "";
    function cleanup() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    btnOk.addEventListener("click", function () {
      var dateStr = wrap.querySelector("#edDate").value;
      var timeStr = wrap.querySelector("#edTime").value;
      var sid = svcSel.value;
      var svc = getServicos().find(function (x) {
        return x.id === sid;
      });
      if (!dateStr || !timeStr || !svc) {
        showToast("Preencha data, horário e serviço.", "error");
        return;
      }
      var start = parseDateTimeLocal(dateStr, timeStr);
      if (!start) {
        showToast("Data/hora inválida.", "error");
        return;
      }
      var end = endTime(start, svc.durationMinutes);
      var now = new Date();
      if (start.getTime() < now.getTime()) {
        showToast("Não use horário no passado.", "error");
        return;
      }
      if (start.getTime() < now.getTime() + MIN_EDIT_ADVANCE_MS) {
        showToast("Alterações exigem pelo menos 1 hora de antecedência.", "error");
        return;
      }
      if (!fitsBusinessHours(start, end)) {
        showToast("Fora do expediente ou cruza o almoço.", "error");
        return;
      }
      if (hasConflictForBarber(start, end, a.id, a.barberId)) {
        showToast("Conflito com outro agendamento seu.", "error");
        return;
      }
      if (
        hasConflictForClient(a.clientEmail, start, end, a.id)
      ) {
        showToast("Cliente já tem outro horário que conflita.", "error");
        return;
      }
      var lista = getAgendamentos();
      var idx = lista.findIndex(function (x) {
        return x.id === a.id;
      });
      if (idx === -1) return;
      var prev = Object.assign({}, lista[idx]);
      lista[idx] = Object.assign({}, lista[idx], {
        serviceId: svc.id,
        serviceName: svc.name,
        price: Number(svc.price),
        durationMinutes: Number(svc.durationMinutes),
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        notes: (wrap.querySelector("#edNotes") || {}).value.trim() || lista[idx].notes,
        updatedAt: new Date().toISOString(),
      });
      save(KEY_AG, lista);
      appendAudit(a.id, "edited", "barber", { before: prev, after: lista[idx] });
      cleanup();
      showToast("Agendamento atualizado.", "success");
      renderTodosAgendamentos();
      renderHojeAgendamentos();
      updateDashboard();
      popularHorariosCliente();
    });
    btnCancel.addEventListener("click", cleanup);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) cleanup();
    });
    document.body.appendChild(node);
    btnOk.focus();
  }

  function cardAgendamentoBarbeiro(a, allowBarberCancel) {
    var card = document.createElement("div");
    card.className = "agendamento-card";
    var st = statusAgendamentoLogico(a);
    if (a.status === "cancelled") card.classList.add("cancelado");
    if (st === "completed") card.classList.add("concluido");
    card.innerHTML =
      '<div class="agendamento-servico">' +
      escapeHtml(a.serviceName) +
      ' <span class="ag-badge ag-badge--' +
      escapeHtml(st) +
      '">' +
      escapeHtml(st) +
      "</span></div>" +
      '<div class="agendamento-data">' +
      formatarDataHoraBr(a.startIso) +
      " · " +
      escapeHtml(a.clientName || "") +
      "</div>" +
      '<div class="agendamento-horario">' +
      escapeHtml(a.whatsapp || "") +
      " · " +
      escapeHtml(a.clientEmail || "") +
      "</div>" +
      (a.notes
        ? '<div class="ag-notas">Obs: ' + escapeHtml(a.notes) + "</div>"
        : "") +
      '<div class="agendamento-actions"></div>';
    var actions = card.querySelector(".agendamento-actions");
    var btnCl = document.createElement("button");
    btnCl.type = "button";
    btnCl.className = "btn-small btn-secondary";
    btnCl.textContent = "Cliente";
    btnCl.addEventListener("click", function () {
      barbearVerResumoCliente(a.clientEmail);
    });
    actions.appendChild(btnCl);
    if (st === "scheduled") {
      var btnEd = document.createElement("button");
      btnEd.type = "button";
      btnEd.className = "btn-small btn-success";
      btnEd.textContent = "Editar";
      btnEd.addEventListener("click", function () {
        barbearEditarAgendamento(a);
      });
      actions.appendChild(btnEd);
      var btnDone = document.createElement("button");
      btnDone.type = "button";
      btnDone.className = "btn-small btn-primary";
      btnDone.textContent = "Concluir";
      btnDone.addEventListener("click", function () {
        openConcluirModal(a).then(function (res) {
          if (!res || !res.ok) return;
          var lista = getAgendamentos();
          var idx = lista.findIndex(function (x) {
            return x.id === a.id;
          });
          if (idx === -1) return;
          var paySt = lista[idx].paymentStatus;
          if (lista[idx].paymentMethod === "dinheiro") {
            paySt = "paid_cash";
          } else if (/pending/.test(String(paySt || ""))) {
            paySt = "paid_on_completion";
          }
          lista[idx] = Object.assign({}, lista[idx], {
            status: "completed",
            completedAt: new Date().toISOString(),
            amountCharged: res.amountCharged,
            completionNotes: res.notes,
            paymentStatus: paySt,
          });
          save(KEY_AG, lista);
          appendAudit(a.id, "completed", "barber", {
            amountCharged: res.amountCharged,
          });
          showToast("Marcado como concluído.", "success");
          renderTodosAgendamentos();
          renderHojeAgendamentos();
          updateDashboard();
          popularHorariosCliente();
        });
      });
      actions.appendChild(btnDone);
    }
    if (allowBarberCancel && st === "scheduled") {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-small btn-warning";
      btn.textContent = "Cancelar";
      btn.addEventListener("click", function () {
        openTextModal("Motivo do cancelamento (opcional).", "Confirmar cancelamento").then(
          function (r) {
            if (!r.ok) return;
            var lista = getAgendamentos();
            var idx = lista.findIndex(function (x) { return x.id === a.id; });
            if (idx === -1) return;
            lista[idx] = Object.assign({}, lista[idx], {
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
              cancelledBy: "barber",
              cancelReason: r.text || "",
            });
            save(KEY_AG, lista);
            appendAudit(a.id, "cancelled_barber", "barber", {
              reason: r.text || "",
            });
            showToast("Agendamento cancelado.", "success");
            renderTodosAgendamentos();
            renderHojeAgendamentos();
            updateDashboard();
            popularHorariosCliente();
          }
        );
      });
      actions.appendChild(btn);
    }
    return card;
  }

  function renderTodosAgendamentos() {
    var el = document.getElementById("todosAgendamentosList");
    if (!el) return;
    var s = getSessao();
    if (!s || s.role !== "barbeiro") return;
    var ags = agendamentosDoBarbeiroLogado().slice();
    ags.sort(function (a, b) {
      return new Date(b.startIso) - new Date(a.startIso);
    });
    el.innerHTML = "";
    if (!ags.length) {
      el.innerHTML = '<div class="empty-state">Nenhum agendamento.</div>';
      return;
    }
    ags.forEach(function (a) {
      el.appendChild(cardAgendamentoBarbeiro(a, true));
    });
  }

  function renderHojeAgendamentos() {
    var el = document.getElementById("hojeAgendamentosList");
    if (!el) return;
    var s = getSessao();
    if (!s || s.role !== "barbeiro") return;
    var hoje = new Date();
    var y = hoje.getFullYear();
    var m = hoje.getMonth();
    var d = hoje.getDate();
    var ags = agendamentosDoBarbeiroLogado()
      .filter(function (a) {
        var t = new Date(a.startIso);
        return (
          t.getFullYear() === y && t.getMonth() === m && t.getDate() === d
        );
      })
      .sort(function (a, b) {
        return new Date(a.startIso) - new Date(b.startIso);
      });
    el.innerHTML = "";
    if (!ags.length) {
      el.innerHTML = '<div class="empty-state">Nenhum agendamento hoje.</div>';
      return;
    }
    ags.forEach(function (a) {
      el.appendChild(cardAgendamentoBarbeiro(a, true));
    });
  }

  function renderServicosBarbeiroForm() {
    var listEl = document.getElementById("listaServicosBarbeiro");
    if (!listEl) return;
    var servicos = getServicos();
    listEl.innerHTML = "";
    servicos.forEach(function (s) {
      var row = document.createElement("div");
      row.className = "servico-barbeiro-row";
      row.innerHTML =
        "<div>" +
        escapeHtml(s.name) +
        " — " +
        formatMoney(s.price) +
        " · " +
        escapeHtml(String(s.durationMinutes)) +
        " min</div>" +
        '<div class="servico-barbeiro-actions"></div>';
      var act = row.querySelector(".servico-barbeiro-actions");
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-small btn-danger";
      rm.textContent = "Excluir";
      rm.addEventListener("click", function () {
        showModal("Excluir serviço \"" + s.name + "\"?", "Excluir", true).then(
          function (ok) {
            if (!ok) return;
            var rest = getServicos().filter(function (x) {
              return x.id !== s.id;
            });
            save(KEY_SERVICOS, rest);
            renderServicosBarbeiroForm();
            popularSelectServicoCliente();
            renderServicosGrid();
            showToast("Serviço removido.", "success");
          }
        );
      });
      act.appendChild(rm);
      listEl.appendChild(row);
    });
  }

  var formNovoServico = document.getElementById("formNovoServico");
  if (formNovoServico) {
    formNovoServico.addEventListener("submit", function (e) {
      e.preventDefault();
      var nomeEl = document.getElementById("novoServicoNome");
      var precoEl = document.getElementById("novoServicoPreco");
      var durEl = document.getElementById("novoServicoDuracao");
      var nome = (nomeEl && nomeEl.value.trim()) || "";
      var preco = precoEl ? Number(precoEl.value) : 0;
      var dur = durEl ? Number(durEl.value) : 0;
      if (!nome || nome.length > 120) {
        showToast("Nome do serviço inválido.", "error");
        return;
      }
      if (!(preco > 0)) {
        showToast("Preço deve ser maior que zero.", "error");
        return;
      }
      if (!(dur > 0) || dur > 480) {
        showToast("Duração deve ser entre 1 e 480 minutos.", "error");
        return;
      }
      var servicos = getServicos();
      servicos.push({
        id: uid(),
        name: nome,
        price: preco,
        durationMinutes: Math.round(dur),
      });
      save(KEY_SERVICOS, servicos);
      formNovoServico.reset();
      showToast("Serviço cadastrado.", "success");
      renderServicosBarbeiroForm();
      popularSelectServicoCliente();
      renderServicosGrid();
      updateDashboard();
    });
  }

  function initBarbeiro() {
    seedServicosSeVazio();
    seedBarbeiros();
    migrateAgendamentosBarberId();
    migratePagamentosCamposAntigos();
    migrateAgendamentosCamposLegados();
    migrateStatusConcluidoInconsistente();
    var s = getSessao();
    var nd = document.getElementById("barbeiroNomeDisplay");
    if (nd && s && s.barberName) nd.textContent = s.barberName;
    updateDashboard();
    renderHorariosBarbeiro();
    renderTodosAgendamentos();
    renderHojeAgendamentos();
    renderServicosBarbeiroForm();
    setupNav(barbeiroScreen, "barbeiroPageTitle");
    setupMobileMenu("barbeiroMenuToggle", "barbeiroSidebar", "barbeiroOverlay");
  }

  function setupMobileMenu(toggleId, sidebarId, overlayId) {
    var toggle = document.getElementById(toggleId);
    var sidebar = document.getElementById(sidebarId);
    var overlay = document.getElementById(overlayId);
    if (!toggle || !sidebar || toggle.dataset.menuBound === "1") return;
    toggle.dataset.menuBound = "1";
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      if (overlay) overlay.classList.toggle("active");
    });
    if (overlay) {
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }
  }

  /* ——— Boot ——— */
  migrarSessaoLegadaLocalStorage();
  seedServicosSeVazio();
  seedBarbeiros();
  seedDemoAgendamentos();
  migrateAgendamentosBarberId();
  migratePagamentosCamposAntigos();
  migrateAgendamentosCamposLegados();
  migrateStatusConcluidoInconsistente();
  var sessao = getSessao();
  if (sessao && sessao.role === "cliente") {
    applyScreen("cliente");
    var nomeEl = document.getElementById("clienteNome");
    if (nomeEl) {
      nomeEl.textContent =
        sessao.clientName ||
        (sessao.email || "").split("@")[0] ||
        "Cliente";
    }
    initCliente();
  } else if (sessao && sessao.role === "barbeiro") {
    if (!sessao.barberId) {
      setSessao(null);
      applyScreen("login");
    } else {
      applyScreen("barbeiro");
      initBarbeiro();
    }
  } else {
    applyScreen("login");
  }
})();
