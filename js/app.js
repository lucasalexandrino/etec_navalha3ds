(function () {
  "use strict";

  var API_BASE = "/api";
  var SESSION_KEY = "barbearia_sessao";

  function showError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  function hideError(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    return loadSession();
  }

  async function fetchJson(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    var session = getSession();
    if (session && session.token) {
      options.headers.Authorization = "Bearer " + session.token;
    }
    var response = await fetch(url, options);
    if (!response.ok) {
      var error = "Erro de comunicação.";
      try {
        var payload = await response.json();
        if (payload && payload.error) {
          error = payload.error;
        }
      } catch (e) {}
      throw new Error(error);
    }
    return response.json();
  }

  function showScreen(id) {
    var screens = [
      "tela-entrada",
      "tela-cadastro",
      "tela-login-cliente",
      "tela-login-barbeiro",
      "tela-login-admin",
      "painel-cliente",
      "painel-barbeiro",
      "painel-admin",
    ];
    screens.forEach(function (screen) {
      var element = document.getElementById(screen);
      if (!element) return;
      element.hidden = screen !== id;
      element.classList.toggle("tela-ativa", screen === id);
      element.classList.toggle("ativo", screen === id);
    });
    updateHeader();
    if (id === "tela-entrada") {
      renderHomeAvailability();
    }
    if (id === "painel-cliente") {
      populateSelectServicos();
      populateSelectBarbers();
      renderCalendar();
      renderClientBookings();
      renderHomeAvailability();
    }
    if (id === "painel-barbeiro") {
      renderBarberBookings();
    }
    if (id === "painel-admin") {
      renderAdminBarbers();
      renderAdminClients();
      renderAdminBookings();
    }
  }

  var calTitulo = document.getElementById("cal-titulo-mes");
  var calGrade = document.getElementById("cal-grade");
  var calMesAnt = document.getElementById("cal-mes-ant");
  var calProxMes = document.getElementById("cal-prox-mes");
  var mesCal = new Date().getMonth();
  var anoCal = new Date().getFullYear();

  function diasComEventoNoMes(y, m) {
    var set = {};
    var session = getSession();
    if (!session || session.role !== "client") return set;
    apiGetBookings("client", { userId: session.user.id }).then(function (bookings) {
      bookings.forEach(function (booking) {
        var d = new Date(booking.date + "T" + booking.time + ":00");
        if (d.getFullYear() === y && d.getMonth() === m) {
          set[d.getDate()] = true;
        }
      });
      renderCalendar();
    });
    return set;
  }

  function renderCalendar() {
    if (!calTitulo || !calGrade) return;
    var today = new Date();
    var first = new Date(anoCal, mesCal, 1);
    var lastDay = new Date(anoCal, mesCal + 1, 0).getDate();
    var startWeek = first.getDay();
    calTitulo.textContent = first.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    calGrade.innerHTML = "";
    apiGetBookings("client", { userId: getSession()?.user?.id || "" }).then(function (bookings) {
      var markers = {};
      bookings.forEach(function (booking) {
        var d = new Date(booking.date + "T" + booking.time + ":00");
        if (d.getFullYear() === anoCal && d.getMonth() === mesCal) {
          markers[d.getDate()] = true;
        }
      });
      for (var i = 0; i < startWeek; i++) {
        calGrade.appendChild(celulaVaziaCal());
      }
      for (var day = 1; day <= lastDay; day++) {
        var isToday =
          day === today.getDate() &&
          mesCal === today.getMonth() &&
          anoCal === today.getFullYear();
        calGrade.appendChild(diaCel(day, false, isToday, !!markers[day], anoCal, mesCal));
      }
    });
  }

  function celulaVaziaCal() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-dia fora";
    btn.disabled = true;
    btn.setAttribute("aria-hidden", "true");
    return btn;
  }

  function diaCel(day, fora, hoje, temEvento, year, month) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-dia";
    btn.textContent = String(day);
    if (hoje) btn.classList.add("hoje");
    if (temEvento) btn.classList.add("tem-evento");
    btn.addEventListener("click", function () {
      var m = String(month + 1).padStart(2, "0");
      var d = String(day).padStart(2, "0");
      var dateInput = document.getElementById("ag-data");
      if (dateInput) dateInput.value = year + "-" + m + "-" + d;
    });
    return btn;
  }

  if (calMesAnt) {
    calMesAnt.addEventListener("click", function () {
      mesCal--;
      if (mesCal < 0) {
        mesCal = 11;
        anoCal--;
      }
      renderCalendar();
    });
  }

  if (calProxMes) {
    calProxMes.addEventListener("click", function () {
      mesCal++;
      if (mesCal > 11) {
        mesCal = 0;
        anoCal++;
      }
      renderCalendar();
    });
  }

  function updateHeader() {
    var session = getSession();
    var visitor = document.getElementById("topo-visitante");
    var actions = document.getElementById("topo-acoes");
    var mainAction = document.getElementById("btn-topo-principal");
    if (visitor) visitor.classList.toggle("hidden", !!session);
    if (actions) actions.classList.toggle("hidden", !session);
    if (mainAction) {
      if (!session) {
        mainAction.classList.add("hidden");
        mainAction.onclick = null;
      } else {
        mainAction.classList.remove("hidden");
        if (session.role === "client") {
          mainAction.textContent = "Agendar horário";
          mainAction.onclick = function () {
            showScreen("painel-cliente");
          };
        } else if (session.role === "barber") {
          mainAction.textContent = "Minha agenda";
          mainAction.onclick = function () {
            showScreen("painel-barbeiro");
          };
        } else if (session.role === "admin") {
          mainAction.textContent = "Área administrativa";
          mainAction.onclick = function () {
            showScreen("painel-admin");
          };
        } else {
          mainAction.classList.add("hidden");
          mainAction.onclick = null;
        }
      }
    }
    var greeting = document.getElementById("topo-saudacao");
    if (!greeting) return;
    if (!session) {
      greeting.textContent = "";
      return;
    }
    if (session.role === "client") {
      greeting.textContent = "Olá, " + (session.user.nome || "cliente").split(" ")[0] + " (cliente)";
    } else if (session.role === "barber") {
      greeting.textContent = "Olá, " + (session.user.name || "barbeiro") + " (barbeiro)";
    } else if (session.role === "admin") {
      greeting.textContent = "Olá, administrador";
    }
  }

  function openPrivacyModal() {
    var modal = document.getElementById("modal-privacidade");
    if (modal) modal.classList.remove("hidden");
  }

  function closePrivacyModal() {
    var modal = document.getElementById("modal-privacidade");
    if (modal) modal.classList.add("hidden");
  }

  async function apiGetServices() {
    return fetchJson(API_BASE + "/services");
  }

  async function apiGetBarbers() {
    return fetchJson(API_BASE + "/barbers");
  }

  async function apiGetAvailability(days) {
    return fetchJson(API_BASE + "/availability?days=" + encodeURIComponent(days));
  }

  async function apiGetBookings(role, query) {
    var params = new URLSearchParams({ role: role });
    if (query) {
      Object.keys(query).forEach(function (key) {
        if (query[key]) params.set(key, query[key]);
      });
    }
    return fetchJson(API_BASE + "/bookings?" + params.toString());
  }

  async function apiCreateBooking(payload) {
    return fetchJson(API_BASE + "/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function apiCancelBooking(id, role, query) {
    var params = new URLSearchParams({ role: role });
    if (query) {
      Object.keys(query).forEach(function (key) {
        if (query[key]) params.set(key, query[key]);
      });
    }
    return fetchJson(API_BASE + "/bookings/" + encodeURIComponent(id) + "?" + params.toString(), {
      method: "DELETE",
    });
  }

  async function apiRegisterClient(payload) {
    return fetchJson(API_BASE + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function apiLogin(payload) {
    return fetchJson(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function apiLoginBarber(payload) {
    return fetchJson(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function apiCreateBarber(payload) {
    return fetchJson(API_BASE + "/admin/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function apiGetClients(adminSenha) {
    var session = getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Acesso de administrador necessário.");
    }
    var adminPass = adminSenha || session.adminSenha;
    if (!adminPass) {
      adminPass = prompt("Digite a senha do administrador para carregar a lista de clientes:");
    }
    if (!adminPass) {
      throw new Error("Senha do administrador necessária.");
    }
    var params = new URLSearchParams({ adminEmail: session.user.email, adminSenha: adminPass });
    return fetchJson(API_BASE + "/clients?" + params.toString());
  }

  async function apiDeleteClient(clientId, adminSenha) {
    var session = getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Acesso de administrador necessário.");
    }
    var adminPass = adminSenha || session.adminSenha;
    if (!adminPass) {
      adminPass = prompt("Digite a senha do administrador para confirmar a remoção do cliente:");
    }
    if (!adminPass) {
      throw new Error("Senha do administrador necessária.");
    }
    var params = new URLSearchParams({ adminEmail: session.user.email, adminSenha: adminPass });
    return fetchJson(API_BASE + "/clients/" + encodeURIComponent(clientId) + "?" + params.toString(), {
      method: "DELETE",
    });
  }

  async function renderHomeAvailability() {
    var list = document.getElementById("lista-horarios-livres");
    var empty = document.getElementById("lista-horarios-vazio");
    if (!list) return;
    list.innerHTML = "";
    try {
      var items = await apiGetAvailability(14);
      items.forEach(function (slot) {
        var li = document.createElement("li");
        li.textContent = slot.label;
        list.appendChild(li);
      });
      if (empty) empty.classList.toggle("hidden", items.length > 0);
    } catch (err) {
      if (empty) {
        empty.textContent = "Não foi possível carregar horários disponíveis.";
        empty.classList.remove("hidden");
      }
    }
  }

  async function populateSelectServicos() {
    var select = document.getElementById("ag-servico");
    if (!select) return;
    try {
      var services = await apiGetServices();
      select.innerHTML = "";
      if (!services.length) {
        var option = document.createElement("option");
        option.value = "";
        option.textContent = "Nenhum serviço disponível";
        select.appendChild(option);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      services.forEach(function (service) {
        var option = document.createElement("option");
        option.value = service.id;
        option.textContent = service.name;
        select.appendChild(option);
      });
    } catch (err) {
      select.innerHTML = "<option>Erro ao carregar serviços</option>";
      select.disabled = true;
    }
  }

  async function populateSelectBarbers() {
    var select = document.getElementById("ag-barbeiro");
    if (!select) return;
    try {
      var barbers = await apiGetBarbers();
      select.innerHTML = "";
      if (!barbers.length) {
        var option = document.createElement("option");
        option.value = "";
        option.textContent = "Nenhum barbeiro cadastrado";
        select.appendChild(option);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      barbers.forEach(function (barber) {
        var option = document.createElement("option");
        option.value = barber.id;
        option.textContent = barber.name;
        select.appendChild(option);
      });
    } catch (err) {
      select.innerHTML = "<option>Erro ao carregar barbeiros</option>";
      select.disabled = true;
    }
  }

  function setDefaultAppointment() {
    var dateInput = document.getElementById("ag-data");
    var timeInput = document.getElementById("ag-hora");
    if (dateInput) {
      var today = new Date().toISOString().slice(0, 10);
      dateInput.value = today;
    }
    if (timeInput) {
      timeInput.value = "09:00";
    }
  }

  async function renderClientBookings() {
    var tbody = document.getElementById("tbody-meus-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    var session = getSession();
    if (!session || session.role !== "client") return;
    try {
      var bookings = await apiGetBookings("client", { userId: session.user.id });
      bookings.sort(function (a, b) {
        return new Date(a.date + "T" + a.time + ":00") - new Date(b.date + "T" + b.time + ":00");
      });
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=4>Nenhum agendamento encontrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + new Date(booking.date + "T" + booking.time + ":00").toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "</td>" +
          "<td>" + (booking.barberName || "-") + "</td>" +
          "<td>" + (booking.serviceName || "-") + "</td>" +
          "<td></td>";
        var td = tr.lastElementChild;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", async function () {
          try {
            await apiCancelBooking(booking.id, "client", { userId: session.user.id });
            await renderClientBookings();
            await renderHomeAvailability();
          } catch (err) {
            alert(err.message);
          }
        });
        td.appendChild(button);
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan=4>Erro ao carregar agendamentos.</td></tr>";
    }
  }

  async function renderBarberBookings() {
    var tbody = document.getElementById("tbody-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    var session = getSession();
    if (!session || session.role !== "barber") return;
    try {
      var bookings = await apiGetBookings("barber", { barberId: session.user.id });
      bookings.sort(compareBookingsByDateTime);
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=5>Nenhum agendamento encontrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + new Date(booking.date + "T" + booking.time + ":00").toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "</td>" +
          "<td>" + (booking.clientName || "-") + "</td>" +
          "<td>" + (booking.whatsapp || "-") + "</td>" +
          "<td>" + (booking.serviceName || "-") + "</td>" +
          "<td></td>";
        var td = tr.lastElementChild;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", async function () {
          try {
            await apiCancelBooking(booking.id, "barber", { barberId: session.user.id });
            await renderBarberBookings();
            await renderHomeAvailability();
          } catch (err) {
            alert(err.message);
          }
        });
        td.appendChild(button);
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan=5>Erro ao carregar agendamentos.</td></tr>";
    }
  }

  async function renderAdminBarbers() {
    var list = document.getElementById("lista-barbeiros");
    if (!list) return;
    list.innerHTML = "";
    try {
      var barbers = await apiGetBarbers();
      if (!barbers.length) {
        list.innerHTML = "<li>Nenhum barbeiro cadastrado.</li>";
        return;
      }
      barbers.forEach(function (barber) {
        var li = document.createElement("li");
        li.textContent = barber.name + " (" + barber.username + ")";
        list.appendChild(li);
      });
    } catch (err) {
      list.innerHTML = "<li>Erro ao carregar barbeiros.</li>";
    }
  }

  async function renderAdminClients() {
    var tbody = document.getElementById("tbody-clientes");
    if (!tbody) return;
    tbody.innerHTML = "";
    var session = getSession();
    if (!session || session.role !== "admin") return;
    try {
      var clients = await apiGetClients();
      if (!clients.length) {
        tbody.innerHTML = "<tr><td colspan=4>Nenhum cliente cadastrado.</td></tr>";
        return;
      }
      clients.forEach(function (client) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + client.nome + "</td>" +
          "<td>" + client.email + "</td>" +
          "<td>" + (client.whatsapp || "-") + "</td>" +
          "<td></td>";
        var td = tr.lastElementChild;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Remover";
        button.addEventListener("click", async function () {
          var adminSenha = prompt("Digite a senha do administrador para confirmar a exclusão:");
          if (!adminSenha) return;
          try {
            await apiDeleteClient(client.id, adminSenha);
            await renderAdminClients();
            await renderAdminBookings();
          } catch (err) {
            alert(err.message);
          }
        });
        td.appendChild(button);
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan=4>Erro ao carregar clientes.</td></tr>";
    }
  }

  async function renderAdminBookings() {
    var tbody = document.getElementById("tbody-todos-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    try {
      var bookings = await apiGetBookings("admin", {});
      bookings.sort(compareBookingsByDateTime);
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=5>Nenhum agendamento registrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + new Date(booking.date + "T" + booking.time + ":00").toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "</td>" +
          "<td>" + (booking.clientName || "-") + "</td>" +
          "<td>" + (booking.barberName || "-") + "</td>" +
          "<td>" + (booking.serviceName || "-") + "</td>" +
          "<td></td>";
        var td = tr.lastElementChild;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", async function () {
          try {
            await apiCancelBooking(booking.id, "admin", {});
            await renderAdminBookings();
            await renderHomeAvailability();
          } catch (err) {
            alert(err.message);
          }
        });
        td.appendChild(button);
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan=5>Erro ao carregar agendamentos.</td></tr>";
    }
  }

  function getFormValues(ids) {
    var values = {};
    ids.forEach(function (id) {
      var input = document.getElementById(id);
      values[id] = input ? input.value.trim() : "";
    });
    return values;
  }

  function getBookingDateTime(booking) {
    return new Date((booking.date || "") + "T" + (booking.time || "") + ":00");
  }

  function compareBookingsByDateTime(a, b) {
    return getBookingDateTime(a) - getBookingDateTime(b);
  }

  function isValidTimeSlot(time) {
    return typeof time === "string" && /^([01]\d|2[0-3]):(00|30)$/.test(time);
  }

  document.getElementById("btn-logo-inicio")?.addEventListener("click", function () {
    showScreen("tela-entrada");
  });
  document.getElementById("btn-ir-cadastro")?.addEventListener("click", function () {
    showScreen("tela-cadastro");
  });
  document.getElementById("btn-ir-login-cliente")?.addEventListener("click", function () {
    showScreen("tela-login-cliente");
  });
  document.getElementById("btn-ir-login-barbeiro")?.addEventListener("click", function () {
    showScreen("tela-login-barbeiro");
  });
  document.getElementById("btn-ir-login-admin")?.addEventListener("click", function () {
    showScreen("tela-login-admin");
  });
  document.getElementById("btn-voltar-cadastro")?.addEventListener("click", function () {
    showScreen("tela-entrada");
  });
  document.getElementById("btn-voltar-login-cliente")?.addEventListener("click", function () {
    showScreen("tela-entrada");
  });
  document.getElementById("btn-voltar-login-barbeiro")?.addEventListener("click", function () {
    showScreen("tela-entrada");
  });
  document.getElementById("btn-voltar-login-admin")?.addEventListener("click", function () {
    showScreen("tela-entrada");
  });
  document.getElementById("btn-logout")?.addEventListener("click", function () {
    clearSession();
    updateHeader();
    showScreen("tela-entrada");
  });

  document.getElementById("btn-politica-privacidade")?.addEventListener("click", function () {
    openPrivacyModal();
  });
  document.getElementById("btn-fechar-privacidade")?.addEventListener("click", function () {
    closePrivacyModal();
  });

  document.getElementById("form-cadastro")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("cadastro-erro");
    var values = getFormValues(["cd-nome", "cd-email", "cd-whatsapp", "cd-senha", "cd-senha2"]);
    if (!values["cd-nome"] || values["cd-nome"].length < 2) {
      showError("cadastro-erro", "Informe um nome válido.");
      return;
    }
    if (!values["cd-email"] || values["cd-email"].indexOf("@") < 0) {
      showError("cadastro-erro", "E-mail inválido.");
      return;
    }
    if (values["cd-senha"] !== values["cd-senha2"]) {
      showError("cadastro-erro", "As senhas não coincidem.");
      return;
    }
    try {
      var result = await apiRegisterClient({
        nome: values["cd-nome"],
        email: values["cd-email"],
        whatsapp: values["cd-whatsapp"],
        senha: values["cd-senha"],
      });
      saveSession(result);
      updateHeader();
      showScreen("painel-cliente");
      setDefaultAppointment();
      await populateSelectServicos();
      await populateSelectBarbers();
      await renderClientBookings();
      event.target.reset();
    } catch (err) {
      showError("cadastro-erro", err.message);
    }
  });

  document.getElementById("form-login-cliente")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("login-cliente-erro");
    var values = getFormValues(["lc-email", "lc-senha"]);
    try {
      var result = await apiLogin({ email: values["lc-email"], senha: values["lc-senha"] });
      if (result.role !== "client") {
        showError("login-cliente-erro", "Use credenciais de cliente.");
        return;
      }
      saveSession(result);
      updateHeader();
      showScreen("painel-cliente");
      setDefaultAppointment();
      await populateSelectServicos();
      await populateSelectBarbers();
      await renderClientBookings();
      event.target.reset();
    } catch (err) {
      showError("login-cliente-erro", err.message);
    }
  });

  document.getElementById("form-login-barbeiro")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("login-barbeiro-erro");
    var values = getFormValues(["lb-email", "lb-senha"]);
    try {
      var result = await apiLoginBarber({ email: values["lb-email"], senha: values["lb-senha"] });
      if (result.role !== "barber") {
        showError("login-barbeiro-erro", "Credenciais inválidas para barbeiro.");
        return;
      }
      saveSession(result);
      updateHeader();
      showScreen("painel-barbeiro");
      await renderBarberBookings();
      event.target.reset();
    } catch (err) {
      showError("login-barbeiro-erro", err.message);
    }
  });

  document.getElementById("form-login-admin")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("login-admin-erro");
    var values = getFormValues(["la-email", "la-senha"]);
    try {
      var result = await apiLogin({ email: values["la-email"], senha: values["la-senha"] });
      if (result.role !== "admin") {
        showError("login-admin-erro", "Credenciais inválidas para administrador.");
        return;
      }
      result.adminSenha = values["la-senha"];
      saveSession(result);
      updateHeader();
      showScreen("painel-admin");
      await renderAdminBarbers();
      await renderAdminClients();
      await renderAdminBookings();
      event.target.reset();
    } catch (err) {
      showError("login-admin-erro", err.message);
    }
  });

  document.getElementById("form-agendamento")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("agendamento-erro");
    var session = getSession();
    if (!session || session.role !== "client") {
      showError("agendamento-erro", "Faça login como cliente para agendar.");
      return;
    }
    var values = getFormValues(["ag-nome", "ag-whatsapp", "ag-servico", "ag-barbeiro", "ag-data", "ag-hora"]);
    if (!values["ag-nome"]) {
      showError("agendamento-erro", "Informe seu nome.");
      return;
    }
    if (!values["ag-servico"]) {
      showError("agendamento-erro", "Escolha um serviço.");
      return;
    }
    if (!values["ag-barbeiro"]) {
      showError("agendamento-erro", "Escolha um barbeiro.");
      return;
    }
    if (!values["ag-data"] || !values["ag-hora"]) {
      showError("agendamento-erro", "Preencha data e horário.");
      return;
    }
    if (!isValidTimeSlot(values["ag-hora"])) {
      showError("agendamento-erro", "O horário precisa ser em intervalos de 30 minutos, como 09:00 ou 09:30.");
      return;
    }
    try {
      await apiCreateBooking({
        clientId: session.user.id,
        barberId: values["ag-barbeiro"],
        serviceId: values["ag-servico"],
        date: values["ag-data"],
        time: values["ag-hora"],
        clientName: values["ag-nome"],
        whatsapp: values["ag-whatsapp"],
      });
      await renderClientBookings();
      await renderHomeAvailability();
    } catch (err) {
      showError("agendamento-erro", err.message);
    }
  });

  document.getElementById("form-criar-barbeiro")?.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError("admin-erro");
    var values = getFormValues(["ab-nome", "ab-usuario", "ab-senha"]);
    if (!values["ab-nome"] || !values["ab-usuario"] || !values["ab-senha"]) {
      showError("admin-erro", "Preencha todos os campos.");
      return;
    }
    var session = getSession();
    if (!session || session.role !== "admin") {
      showError("admin-erro", "Acesso de administrador necessário.");
      return;
    }
    try {
      var adminPassword = prompt("Digite novamente a senha do administrador para confirmar");
      await apiCreateBarber({
        name: values["ab-nome"],
        username: values["ab-usuario"],
        password: values["ab-senha"],
        adminEmail: session.user.email,
        adminSenha: adminPassword || "",
      });
      document.getElementById("ab-nome").value = "";
      document.getElementById("ab-usuario").value = "";
      document.getElementById("ab-senha").value = "";
      await renderAdminBarbers();
      await populateSelectBarbers();
    } catch (err) {
      showError("admin-erro", err.message);
    }
  });

  async function init() {
    updateHeader();
    setDefaultAppointment();
    await populateSelectServicos();
    await populateSelectBarbers();
    var session = getSession();
    if (!session) {
      showScreen("tela-entrada");
      return;
    }
    if (session.role === "client") {
      showScreen("painel-cliente");
      await renderClientBookings();
    } else if (session.role === "barber") {
      showScreen("painel-barbeiro");
      await renderBarberBookings();
    } else if (session.role === "admin") {
      showScreen("painel-admin");
      await renderAdminBarbers();
      await renderAdminClients();
      await renderAdminBookings();
    } else {
      showScreen("tela-entrada");
    }
  }

  window.addEventListener("load", init);
})();
