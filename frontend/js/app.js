(function () {
  "use strict";

  var API_BASE = "/api";
  var SESSION_KEY = "barbearia_navalha_sessao";

  function $(id) {
    return document.getElementById(id);
  }

  function showError(id, message) {
    var el = $(id);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  function hideError(id) {
    var el = $(id);
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
  }

  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function authHeaders() {
    var session = getSession();
    if (!session || !session.token) return {};
    return { Authorization: "Bearer " + session.token };
  }

  function fetchJson(url, options) {
    options = options || {};
    options.headers = options.headers || {};
    if (options.headers && options.headers.Authorization === undefined) {
      var auth = authHeaders();
      if (auth.Authorization) {
        options.headers.Authorization = auth.Authorization;
      }
    }
    return fetch(url, options).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (payload) {
          var error = payload && payload.error ? payload.error : "Erro de rede.";
          throw new Error(error);
        }).catch(function () {
          throw new Error("Erro de rede.");
        });
      }
      return response.json();
    });
  }

  function showScreen(id) {
    var screens = [
      "tela-entrada",
      "tela-login",
      "tela-cadastro",
      "painel-cliente",
      "painel-barbeiro",
      "painel-admin"
    ];
    screens.forEach(function (screen) {
      var el = $(screen);
      if (!el) return;
      el.hidden = screen !== id;
      el.classList.toggle("tela-ativa", screen === id);
    });
    updateHeader();
    if (id === "tela-entrada") {
      renderHomeAvailability();
    }
    if (id === "painel-cliente") {
      loadAppointmentForm();
      renderClientBookings();
      renderCalendar();
      renderAvailableTimes();
      renderHomeAvailability();
    }
    if (id === "painel-barbeiro") {
      renderBarberBookings();
    }
    if (id === "painel-admin") {
      renderAdminBarbers();
      renderAdminServices();
      renderAdminClients();
      renderAdminBookings();
    }
  }

  function updateHeader() {
    var session = getSession();
    var visitor = $("topo-visitante");
    var actions = $("topo-acoes");
    if (visitor) visitor.classList.toggle("hidden", !!session);
    if (actions) actions.classList.toggle("hidden", !session);
    var greeting = $("topo-saudacao");
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

  function buildQuery(params) {
    var search = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] !== undefined && params[key] !== "") {
        search.set(key, params[key]);
      }
    });
    return search.toString() ? "?" + search.toString() : "";
  }

  function apiGetServices() {
    return fetchJson(API_BASE + "/services");
  }

  function apiGetBarbers() {
    return fetchJson(API_BASE + "/barbers");
  }

  function apiGetAvailability(params) {
    if (typeof params === "number") {
      return fetchJson(API_BASE + "/availability" + buildQuery({ days: params }));
    }
    return fetchJson(API_BASE + "/availability" + buildQuery({ date: params.date, barberId: params.barberId }));
  }

  function apiRegisterClient(payload) {
    return fetchJson(API_BASE + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function apiLogin(payload) {
    return fetchJson(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function apiGetProfile() {
    return fetchJson(API_BASE + "/auth/me");
  }

  function apiCreateBooking(payload) {
    return fetchJson(API_BASE + "/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function apiCancelBooking(id) {
    return fetchJson(API_BASE + "/bookings/" + encodeURIComponent(id), {
      method: "DELETE"
    });
  }

  function apiCreateBarber(payload) {
    return fetchJson(API_BASE + "/admin/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function apiCreateService(payload) {
    return fetchJson(API_BASE + "/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function apiGetClients() {
    return fetchJson(API_BASE + "/admin/clients");
  }

  function apiDeleteClient(clientId) {
    return fetchJson(API_BASE + "/admin/clients/" + encodeURIComponent(clientId), {
      method: "DELETE"
    });
  }

  function renderOptions(select, items, getLabel) {
    if (!select) return;
    select.innerHTML = "";
    if (!items || !items.length) {
      var option = document.createElement("option");
      option.value = "";
      option.textContent = "Nenhum item disponível";
      select.appendChild(option);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = getLabel(item);
      select.appendChild(option);
    });
  }

  function getNextBusinessDate(start) {
    var candidate = new Date(start);
    while (candidate.getDay() === 0) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate.toISOString().slice(0, 10);
  }

  function setDefaultAppointment() {
    var dateInput = $("ag-data");
    var timeInput = $("ag-hora");
    if (!dateInput) return;
    var defaultDate = getNextBusinessDate(new Date());
    dateInput.min = defaultDate;
    if (!dateInput.value || new Date(dateInput.value + "T00:00:00") < new Date(defaultDate + "T00:00:00")) {
      dateInput.value = defaultDate;
    }
    if (timeInput) {
      timeInput.value = "09:00";
    }
    renderAvailableTimes();
  }

  function highlightSelectedTime(selectedValue) {
    var buttons = document.querySelectorAll(".btn-time-slot");
    buttons.forEach(function (button) {
      button.classList.toggle("selected", button.textContent === selectedValue);
    });
  }

  function renderAvailableTimes() {
    var list = $("ag-horarios-disponiveis");
    if (!list) return;
    var barberId = $("ag-barbeiro") ? $("ag-barbeiro").value : "";
    var date = $("ag-data") ? $("ag-data").value : "";
    list.innerHTML = "";
    if (!barberId || !date) {
      list.innerHTML = '<p class="help-text">Selecione barbeiro e data para ver horários disponíveis.</p>';
      return;
    }
    apiGetAvailability({ barberId: barberId, date: date }).then(function (result) {
      var slots = (result.slots || []).filter(function (slot) {
        return !slot.occupied;
      });
      if (!slots.length) {
        list.innerHTML = '<p class="help-text">Nenhum horário disponível neste dia.</p>';
        return;
      }
      slots.forEach(function (slot) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-time-slot";
        button.textContent = slot.time;
        if (slot.occupied) {
          button.disabled = true;
        }
        button.addEventListener("click", function () {
          var timeInput = $("ag-hora");
          if (timeInput) {
            timeInput.value = slot.time;
          }
          highlightSelectedTime(slot.time);
        });
        list.appendChild(button);
      });
      var selectedTime = $("ag-hora") ? $("ag-hora").value : "";
      highlightSelectedTime(selectedTime);
    }).catch(function () {
      list.innerHTML = '<p class="help-text">Erro ao carregar horários disponíveis.</p>';
    });
  }

  function renderHomeAvailability() {
    var list = $("lista-horarios-livres");
    var empty = $("lista-horarios-vazio");
    if (!list) return;
    list.innerHTML = "";
    apiGetAvailability(14).then(function (items) {
      if (!items.length) {
        if (empty) {
          empty.textContent = "Nenhum horário livre encontrado nos próximos dias.";
          empty.classList.remove("hidden");
        }
        return;
      }
      items.forEach(function (slot) {
        var li = document.createElement("li");
        li.textContent = slot.label;
        list.appendChild(li);
      });
      if (empty) empty.classList.add("hidden");
    }).catch(function () {
      if (empty) {
        empty.textContent = "Erro ao carregar horários disponíveis.";
        empty.classList.remove("hidden");
      }
    });
  }

  function createTableRow(cells) {
    var tr = document.createElement("tr");
    cells.forEach(function (cell) {
      var td = document.createElement("td");
      if (typeof cell === "string") {
        td.textContent = cell;
      } else {
        td.appendChild(cell);
      }
      tr.appendChild(td);
    });
    return tr;
  }

  function formatDate(date, time) {
    return new Date(date + "T" + time + ":00").toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function renderClientBookings() {
    var tbody = $("tbody-meus-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    apiGetBookings().then(function (bookings) {
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=4>Nenhum agendamento encontrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", function () {
          apiCancelBooking(booking.id).then(function () {
            renderClientBookings();
            renderHomeAvailability();
          }).catch(function (err) {
            alert(err.message);
          });
        });
        tbody.appendChild(createTableRow([
          formatDate(booking.date, booking.time),
          booking.barberName || "-",
          booking.serviceName || "-",
          button
        ]));
      });
    }).catch(function () {
      tbody.innerHTML = "<tr><td colspan=4>Erro ao carregar agendamentos.</td></tr>";
    });
  }

  function renderBarberBookings() {
    var tbody = $("tbody-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    apiGetBookings().then(function (bookings) {
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=5>Nenhum agendamento encontrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", function () {
          apiCancelBooking(booking.id).then(function () {
            renderBarberBookings();
            renderHomeAvailability();
          }).catch(function (err) {
            alert(err.message);
          });
        });
        tbody.appendChild(createTableRow([
          formatDate(booking.date, booking.time),
          booking.clientName || "-",
          booking.whatsapp || "-",
          booking.serviceName || "-",
          button
        ]));
      });
    }).catch(function () {
      tbody.innerHTML = "<tr><td colspan=5>Erro ao carregar agendamentos.</td></tr>";
    });
  }

  function renderAdminBarbers() {
    var list = $("lista-barbeiros");
    if (!list) return;
    list.innerHTML = "";
    apiGetBarbers().then(function (barbers) {
      if (!barbers.length) {
        list.innerHTML = "<li>Nenhum barbeiro cadastrado.</li>";
        return;
      }
      barbers.forEach(function (barber) {
        var li = document.createElement("li");
        li.textContent = barber.name + " (" + barber.email + ")";
        list.appendChild(li);
      });
    }).catch(function () {
      list.innerHTML = "<li>Erro ao carregar barbeiros.</li>";
    });
  }

  function renderAdminServices() {
    var list = $("lista-servicos-admin");
    if (!list) return;
    list.innerHTML = "";
    apiGetServices().then(function (services) {
      if (!services.length) {
        list.innerHTML = "<li>Nenhum serviço cadastrado.</li>";
        return;
      }
      services.forEach(function (service) {
        var li = document.createElement("li");
        li.textContent = service.name;
        list.appendChild(li);
      });
    }).catch(function () {
      list.innerHTML = "<li>Erro ao carregar serviços.</li>";
    });
  }

  function renderAdminClients() {
    var tbody = $("tbody-clientes");
    if (!tbody) return;
    tbody.innerHTML = "";
    apiGetClients().then(function (clients) {
      if (!clients.length) {
        tbody.innerHTML = "<tr><td colspan=4>Nenhum cliente cadastrado.</td></tr>";
        return;
      }
      clients.forEach(function (client) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Remover";
        button.addEventListener("click", function () {
          if (!confirm("Remover cliente e seus agendamentos?")) return;
          apiDeleteClient(client.id).then(function () {
            renderAdminClients();
            renderAdminBookings();
          }).catch(function (err) {
            alert(err.message);
          });
        });
        tbody.appendChild(createTableRow([
          client.nome,
          client.email,
          client.whatsapp || "-",
          button
        ]));
      });
    }).catch(function () {
      tbody.innerHTML = "<tr><td colspan=4>Erro ao carregar clientes.</td></tr>";
    });
  }

  function renderAdminBookings() {
    var tbody = $("tbody-todos-agendamentos");
    if (!tbody) return;
    tbody.innerHTML = "";
    apiGetBookings().then(function (bookings) {
      if (!bookings.length) {
        tbody.innerHTML = "<tr><td colspan=5>Nenhum agendamento registrado.</td></tr>";
        return;
      }
      bookings.forEach(function (booking) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "btn-icone";
        button.textContent = "Cancelar";
        button.addEventListener("click", function () {
          apiCancelBooking(booking.id).then(function () {
            renderAdminBookings();
            renderHomeAvailability();
          }).catch(function (err) {
            alert(err.message);
          });
        });
        tbody.appendChild(createTableRow([
          formatDate(booking.date, booking.time),
          booking.clientName || "-",
          booking.barberName || "-",
          booking.serviceName || "-",
          button
        ]));
      });
    }).catch(function () {
      tbody.innerHTML = "<tr><td colspan=5>Erro ao carregar agendamentos.</td></tr>";
    });
  }

  function apiGetBookings() {
    return fetchJson(API_BASE + "/bookings");
  }

  function loadAppointmentForm() {
    return Promise.all([apiGetBarbers(), apiGetServices()]).then(function (results) {
      renderOptions($("ag-barbeiro"), results[0], function (item) {
        return item.name;
      });
      renderOptions($("ag-servico"), results[1], function (item) {
        return item.name;
      });
      setDefaultAppointment();
    });
  }

  function renderCalendar() {
    var calTitulo = $("cal-titulo-mes");
    var calGrade = $("cal-grade");
    if (!calTitulo || !calGrade) return;
    var today = new Date();
    var currentMonth = today.getMonth();
    var currentYear = today.getFullYear();
    var state = { month: currentMonth, year: currentYear };

    function draw() {
      var firstDay = new Date(state.year, state.month, 1);
      var lastDay = new Date(state.year, state.month + 1, 0).getDate();
      var startWeek = firstDay.getDay();
      calTitulo.textContent = firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      calGrade.innerHTML = "";
      apiGetBookings().then(function (bookings) {
        var markers = {};
        bookings.forEach(function (booking) {
          var date = new Date(booking.date + "T" + booking.time + ":00");
          if (date.getFullYear() === state.year && date.getMonth() === state.month) {
            markers[date.getDate()] = true;
          }
        });
        for (var i = 0; i < startWeek; i += 1) {
          calGrade.appendChild(createDisabledSquare());
        }
        for (var day = 1; day <= lastDay; day += 1) {
          var date = new Date(state.year, state.month, day);
          var isToday = date.toDateString() === today.toDateString();
          calGrade.appendChild(createDaySquare(day, markers[day], isToday, state.year, state.month));
        }
      }).catch(function () {
        for (var i = 0; i < startWeek; i += 1) {
          calGrade.appendChild(createDisabledSquare());
        }
        for (var day = 1; day <= lastDay; day += 1) {
          var date = new Date(state.year, state.month, day);
          var isToday = date.toDateString() === today.toDateString();
          calGrade.appendChild(createDaySquare(day, false, isToday, state.year, state.month));
        }
      });
    }

    function createDisabledSquare() {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cal-dia fora";
      button.disabled = true;
      button.setAttribute("aria-hidden", "true");
      return button;
    }

    function createDaySquare(day, hasBooking, isToday, year, month) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cal-dia";
      button.textContent = String(day);
      if (isToday) button.classList.add("hoje");
      if (hasBooking) button.classList.add("tem-evento");
      button.addEventListener("click", function () {
        var dateInput = $("ag-data");
        if (dateInput) {
          dateInput.value = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
        }
      });
      return button;
    }

    $("cal-mes-ant").addEventListener("click", function () {
      state.month -= 1;
      if (state.month < 0) {
        state.month = 11;
        state.year -= 1;
      }
      draw();
    });

    $("cal-prox-mes").addEventListener("click", function () {
      state.month += 1;
      if (state.month > 11) {
        state.month = 0;
        state.year += 1;
      }
      draw();
    });

    draw();
  }

  function bindEvents() {
    $("btn-entrar").addEventListener("click", function () {
      showScreen("tela-login");
    });
    $("btn-entrar-hero").addEventListener("click", function () {
      showScreen("tela-login");
    });
    $("btn-link-cadastro").addEventListener("click", function () {
      showScreen("tela-cadastro");
    });
    $("btn-link-login").addEventListener("click", function () {
      showScreen("tela-login");
    });
    $("btn-logout").addEventListener("click", function () {
      clearSession();
      showScreen("tela-entrada");
    });

    $("form-login").addEventListener("submit", function (event) {
      event.preventDefault();
      hideError("login-erro");
      var email = $("login-email").value.trim();
      var senha = $("login-senha").value.trim();
      if (!email || !senha) {
        showError("login-erro", "Preencha e-mail e senha.");
        return;
      }
      apiLogin({ email: email, senha: senha }).then(function (result) {
        saveSession(result);
        showScreenByRole(result.role);
        $("form-login").reset();
      }).catch(function (err) {
        showError("login-erro", err.message);
      });
    });

    $("form-cadastro").addEventListener("submit", function (event) {
      event.preventDefault();
      hideError("cadastro-erro");
      var nome = $("cd-nome").value.trim();
      var email = $("cd-email").value.trim();
      var whatsapp = $("cd-whatsapp").value.trim();
      var senha = $("cd-senha").value.trim();
      var senha2 = $("cd-senha2").value.trim();
      if (!nome || nome.length < 2) {
        showError("cadastro-erro", "Informe um nome válido.");
        return;
      }
      if (!email || email.indexOf("@") < 0) {
        showError("cadastro-erro", "E-mail inválido.");
        return;
      }
      if (senha !== senha2) {
        showError("cadastro-erro", "As senhas não coincidem.");
        return;
      }
      apiRegisterClient({ nome: nome, email: email, whatsapp: whatsapp, senha: senha }).then(function (result) {
        saveSession(result);
        showScreenByRole(result.role);
        $("form-cadastro").reset();
      }).catch(function (err) {
        showError("cadastro-erro", err.message);
      });
    });

    $("form-agendamento").addEventListener("submit", function (event) {
      event.preventDefault();
      hideError("agendamento-erro");
      var barberId = $("ag-barbeiro").value;
      var serviceId = $("ag-servico").value;
      var date = $("ag-data").value;
      var time = $("ag-hora").value;
      if (!barberId || !serviceId || !date || !time) {
        showError("agendamento-erro", "Preencha todos os campos do agendamento.");
        return;
      }
      apiCreateBooking({ barberId: barberId, serviceId: serviceId, date: date, time: time }).then(function () {
        renderClientBookings();
        renderHomeAvailability();
        alert("Agendamento realizado com sucesso.");
      }).catch(function (err) {
        showError("agendamento-erro", err.message);
      });
    });

    $("form-criar-barbeiro").addEventListener("submit", function (event) {
      event.preventDefault();
      hideError("admin-barbeiro-erro");
      var name = $("ab-nome").value.trim();
      var email = $("ab-email").value.trim();
      var password = $("ab-senha").value.trim();
      if (!name || !email || !password) {
        showError("admin-barbeiro-erro", "Preencha todos os campos.");
        return;
      }
      apiCreateBarber({ name: name, email: email, password: password }).then(function () {
        $("form-criar-barbeiro").reset();
        renderAdminBarbers();
      }).catch(function (err) {
        showError("admin-barbeiro-erro", err.message);
      });
    });

    $("ag-barbeiro").addEventListener("change", renderAvailableTimes);
    $("ag-data").addEventListener("change", renderAvailableTimes);
    $("ag-hora").addEventListener("input", function () {
      highlightSelectedTime($("ag-hora").value);
    });

    $("form-criar-servico").addEventListener("submit", function (event) {
      event.preventDefault();
      hideError("admin-servico-erro");
      var name = $("as-nome").value.trim();
      if (!name) {
        showError("admin-servico-erro", "Informe o nome do serviço.");
        return;
      }
      apiCreateService({ name: name }).then(function () {
        $("form-criar-servico").reset();
        renderAdminServices();
      }).catch(function (err) {
        showError("admin-servico-erro", err.message);
      });
    });
  }

  function showScreenByRole(role) {
    if (role === "client") {
      showScreen("painel-cliente");
    } else if (role === "barber") {
      showScreen("painel-barbeiro");
    } else if (role === "admin") {
      showScreen("painel-admin");
    } else {
      showScreen("tela-entrada");
    }
  }

  async function init() {
    bindEvents();
    updateHeader();
    var session = getSession();
    if (!session || !session.token) {
      showScreen("tela-entrada");
      return;
    }
    try {
      var profile = await apiGetProfile();
      session.role = profile.role;
      session.user = profile.user;
      saveSession(session);
      showScreenByRole(profile.role);
    } catch (err) {
      clearSession();
      showScreen("tela-entrada");
    }
  }

  window.addEventListener("load", init);
})();
