(function () {
  "use strict";

  var KEY_SERVICOS = "barbearia_servicos";
  var KEY_AG = "barbearia_agendamentos";
  var KEY_CLIENTES = "barbearia_clientes";
  var KEY_SESSAO = "barbearia_sessao";

  /* Credenciais de demonstração — em produção viriam do servidor */
  var BARBEIRO_USUARIO = "barbeiro";
  var BARBEIRO_SENHA = "navalha";

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

  function normEmail(s) {
    return String(s || "").trim().toLowerCase();
  }

  function getServicos() {
    var s = load(KEY_SERVICOS, []);
    return Array.isArray(s) ? s : [];
  }

  function getAgendamentos() {
    var a = load(KEY_AG, []);
    return Array.isArray(a) ? a : [];
  }

  function getClientes() {
    var c = load(KEY_CLIENTES, []);
    return Array.isArray(c) ? c : [];
  }

  function getSessao() {
    var s = load(KEY_SESSAO, null);
    if (!s || typeof s !== "object") return null;
    return s;
  }

  function setSessao(obj) {
    save(KEY_SESSAO, obj);
  }

  function limparSessao() {
    localStorage.removeItem(KEY_SESSAO);
  }

  function getClienteAtual() {
    var sess = getSessao();
    if (!sess || sess.tipo !== "cliente" || !sess.clientId) return null;
    var list = getClientes();
    return list.find(function (u) {
      return u.id === sess.clientId;
    }) || null;
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

  function isoLocal(dataStr, horaStr) {
    if (!dataStr || !horaStr) return "";
    var d = new Date(dataStr + "T" + horaStr + ":00");
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  }

  function escapeHtml(t) {
    if (!t) return "";
    var div = document.createElement("div");
    div.textContent = t;
    return div.innerHTML;
  }

  /* ——— Expediente: Seg–Sex 9h–18h (slots até 17:30), Sáb 9h–13h (até 12:30), Dom fechado ——— */
  function minutosValidosNoDia(d) {
    var dow = d.getDay();
    if (dow === 0) return [];
    var start = 9 * 60;
    var endMin = dow === 6 ? 12 * 60 + 30 : 17 * 60 + 30;
    var out = [];
    for (var t = start; t <= endMin; t += 30) {
      out.push(t);
    }
    return out;
  }

  function slotOcupado(dataStr, horaStr) {
    var alvo = isoLocal(dataStr, horaStr);
    if (!alvo) return false;
    return getAgendamentos().some(function (a) {
      return a.datetime === alvo;
    });
  }

  function renderHorariosLivresEntrada() {
    var ul = document.getElementById("lista-horarios-livres");
    var vazio = document.getElementById("lista-horarios-vazio");
    if (!ul) return;
    ul.innerHTML = "";
    var agora = new Date();
    var maxDias = 14;
    var maxItens = 36;
    var itens = [];
    var base = new Date();
    base.setHours(0, 0, 0, 0);

    for (var diaOffset = 0; diaOffset < maxDias && itens.length < maxItens; diaOffset++) {
      var dia = new Date(base);
      dia.setDate(base.getDate() + diaOffset);
      var mins = minutosValidosNoDia(dia);
      for (var i = 0; i < mins.length && itens.length < maxItens; i++) {
        var total = mins[i];
        var hh = Math.floor(total / 60);
        var mm = total % 60;
        var slotDate = new Date(dia);
        slotDate.setHours(hh, mm, 0, 0);
        if (slotDate.getTime() <= agora.getTime()) continue;
        var y = slotDate.getFullYear();
        var m = String(slotDate.getMonth() + 1).padStart(2, "0");
        var dd = String(slotDate.getDate()).padStart(2, "0");
        var dataStr = y + "-" + m + "-" + dd;
        var horaStr = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
        if (slotOcupado(dataStr, horaStr)) continue;
        itens.push({
          label:
            slotDate.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            }) +
            " — " +
            horaStr,
        });
      }
    }

    itens.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item.label;
      ul.appendChild(li);
    });
    if (vazio) {
      vazio.classList.toggle("hidden", itens.length > 0);
    }
  }

  /* ——— Navegação entre telas ——— */
  var telas = [
    "tela-entrada",
    "tela-cadastro",
    "tela-login-cliente",
    "tela-login-barbeiro",
    "painel-cliente",
    "painel-barbeiro",
  ];

  function mostrarTela(id) {
    telas.forEach(function (tid) {
      var el = document.getElementById(tid);
      if (!el) return;
      var ativo = tid === id;
      el.hidden = !ativo;
      el.classList.toggle("tela-ativa", ativo);
      if (tid === "painel-cliente" || tid === "painel-barbeiro") {
        el.classList.toggle("ativo", ativo);
      }
    });
    atualizarHeaderAuth();
    if (id === "tela-entrada") {
      renderHorariosLivresEntrada();
    }
    if (id === "painel-cliente") {
      aplicarDadosClienteNoForm();
      renderCalendario();
      popularSelectServicos();
    }
    if (id === "painel-barbeiro") {
      renderBarbeiro();
    }
  }

  function estaLogado() {
    var sess = getSessao();
    if (!sess) return false;
    if (sess.tipo === "barbeiro") return true;
    if (sess.tipo === "cliente" && getClienteAtual()) return true;
    return false;
  }

  function atualizarHeaderAuth() {
    var logado = estaLogado();
    var visitante = document.getElementById("topo-visitante");
    var acoes = document.getElementById("topo-acoes");
    if (visitante) visitante.classList.toggle("hidden", logado);
    if (acoes) acoes.classList.toggle("hidden", !logado);
  }

  function atualizarTopoSaudacao() {
    var span = document.getElementById("topo-saudacao");
    if (!span) return;
    var sess = getSessao();
    if (!sess) {
      span.textContent = "";
      return;
    }
    if (sess.tipo === "cliente") {
      var c = getClienteAtual();
      span.textContent = c ? "Olá, " + c.nome.split(" ")[0] + " (cliente)" : "Cliente";
    } else if (sess.tipo === "barbeiro") {
      span.textContent = "Modo barbeiro";
    }
  }

  function abrirEntrada() {
    limparSessao();
    atualizarTopoSaudacao();
    mostrarTela("tela-entrada");
  }

  function entrarCliente(clientId) {
    setSessao({ tipo: "cliente", clientId: clientId });
    atualizarTopoSaudacao();
    mostrarTela("painel-cliente");
  }

  function entrarBarbeiro() {
    setSessao({ tipo: "barbeiro" });
    atualizarTopoSaudacao();
    mostrarTela("painel-barbeiro");
  }

  /* ——— Header logout ——— */
  var btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", function () {
      abrirEntrada();
    });
  }

  var btnLogoInicio = document.getElementById("btn-logo-inicio");
  if (btnLogoInicio) {
    btnLogoInicio.addEventListener("click", function () {
      mostrarTela("tela-entrada");
    });
  }

  /* ——— Entrada: botões ——— */
  var btnCadastro = document.getElementById("btn-ir-cadastro");
  if (btnCadastro) {
    btnCadastro.addEventListener("click", function () {
      mostrarTela("tela-cadastro");
    });
  }
  var btnLoginCliente = document.getElementById("btn-ir-login-cliente");
  if (btnLoginCliente) {
    btnLoginCliente.addEventListener("click", function () {
      mostrarTela("tela-login-cliente");
    });
  }
  var btnLoginBarbeiro = document.getElementById("btn-ir-login-barbeiro");
  if (btnLoginBarbeiro) {
    btnLoginBarbeiro.addEventListener("click", function () {
      mostrarTela("tela-login-barbeiro");
    });
  }

  var bvC = document.getElementById("btn-voltar-cadastro");
  if (bvC) bvC.addEventListener("click", abrirEntrada);
  var bvLc = document.getElementById("btn-voltar-login-cliente");
  if (bvLc) bvLc.addEventListener("click", abrirEntrada);
  var bvLb = document.getElementById("btn-voltar-login-barbeiro");
  if (bvLb) bvLb.addEventListener("click", abrirEntrada);

  /* ——— Cadastro ——— */
  var formCadastro = document.getElementById("form-cadastro");
  var cadastroErro = document.getElementById("cadastro-erro");

  if (formCadastro) {
    formCadastro.addEventListener("submit", function (e) {
      e.preventDefault();
      if (cadastroErro) {
        cadastroErro.textContent = "";
        cadastroErro.classList.add("hidden");
      }
      var nome = document.getElementById("cd-nome").value.trim();
      var email = normEmail(document.getElementById("cd-email").value);
      var whatsapp = document.getElementById("cd-whatsapp").value.trim();
      var senha = document.getElementById("cd-senha").value;
      var senha2 = document.getElementById("cd-senha2").value;
      if (nome.length < 2) {
        if (cadastroErro) {
          cadastroErro.textContent = "Informe um nome válido.";
          cadastroErro.classList.remove("hidden");
        }
        return;
      }
      if (!email || email.indexOf("@") < 0) {
        if (cadastroErro) {
          cadastroErro.textContent = "E-mail inválido.";
          cadastroErro.classList.remove("hidden");
        }
        return;
      }
      if (senha !== senha2) {
        if (cadastroErro) {
          cadastroErro.textContent = "As senhas não coincidem.";
          cadastroErro.classList.remove("hidden");
        }
        return;
      }
      var clientes = getClientes();
      if (clientes.some(function (c) { return normEmail(c.email) === email; })) {
        if (cadastroErro) {
          cadastroErro.textContent = "Este e-mail já está cadastrado. Use Entrar.";
          cadastroErro.classList.remove("hidden");
        }
        return;
      }
      var novo = { id: uid(), nome: nome, email: email, whatsapp: whatsapp, senha: senha };
      clientes.push(novo);
      save(KEY_CLIENTES, clientes);
      entrarCliente(novo.id);
      formCadastro.reset();
    });
  }

  /* ——— Login cliente ——— */
  var formLoginCliente = document.getElementById("form-login-cliente");
  var loginClienteErro = document.getElementById("login-cliente-erro");

  if (formLoginCliente) {
    formLoginCliente.addEventListener("submit", function (e) {
      e.preventDefault();
      if (loginClienteErro) {
        loginClienteErro.textContent = "";
        loginClienteErro.classList.add("hidden");
      }
      var email = normEmail(document.getElementById("lc-email").value);
      var senha = document.getElementById("lc-senha").value;
      var c = getClientes().find(function (u) {
        return normEmail(u.email) === email && u.senha === senha;
      });
      if (!c) {
        if (loginClienteErro) {
          loginClienteErro.textContent = "E-mail ou senha incorretos.";
          loginClienteErro.classList.remove("hidden");
        }
        return;
      }
      entrarCliente(c.id);
      formLoginCliente.reset();
    });
  }

  /* ——— Login barbeiro ——— */
  var formLoginBarbeiro = document.getElementById("form-login-barbeiro");
  var loginBarbeiroErro = document.getElementById("login-barbeiro-erro");

  if (formLoginBarbeiro) {
    formLoginBarbeiro.addEventListener("submit", function (e) {
      e.preventDefault();
      if (loginBarbeiroErro) {
        loginBarbeiroErro.textContent = "";
        loginBarbeiroErro.classList.add("hidden");
      }
      var u = document.getElementById("lb-usuario").value.trim();
      var s = document.getElementById("lb-senha").value;
      if (u !== BARBEIRO_USUARIO || s !== BARBEIRO_SENHA) {
        if (loginBarbeiroErro) {
          loginBarbeiroErro.textContent = "Usuário ou senha incorretos.";
          loginBarbeiroErro.classList.remove("hidden");
        }
        return;
      }
      entrarBarbeiro();
      formLoginBarbeiro.reset();
    });
  }

  /* ——— Serviços ——— */
  var formServico = document.getElementById("form-servico");
  var svNome = document.getElementById("sv-nome");
  var listaServicos = document.getElementById("lista-servicos");
  var selectServico = document.getElementById("ag-servico");

  function renderListaServicos() {
    if (!listaServicos) return;
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
    if (!selectServico) return;
    var servicos = getServicos();
    var val = selectServico.value;
    selectServico.innerHTML = "";
    if (servicos.length === 0) {
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "Nenhum serviço — o barbeiro deve cadastrar";
      selectServico.appendChild(ph);
      selectServico.disabled = true;
      return;
    }
    selectServico.disabled = false;
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

  if (formServico) {
    formServico.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = svNome.value.trim();
      if (!nome) return;
      var servicos = getServicos();
      servicos.push({ id: uid(), name: nome });
      save(KEY_SERVICOS, servicos);
      svNome.value = "";
      renderListaServicos();
      popularSelectServicos();
    });
  }

  /* ——— Agendamentos ——— */
  var formAg = document.getElementById("form-agendamento");
  var agNome = document.getElementById("ag-nome");
  var agWhatsapp = document.getElementById("ag-whatsapp");
  var agData = document.getElementById("ag-data");
  var agHora = document.getElementById("ag-hora");
  var tbodyAg = document.getElementById("tbody-agendamentos");
  var agendamentoErro = document.getElementById("agendamento-erro");

  function aplicarDadosClienteNoForm() {
    var c = getClienteAtual();
    if (!c) return;
    agNome.value = c.nome;
    agWhatsapp.value = c.whatsapp || "";
  }

  if (formAg) {
    formAg.addEventListener("submit", function (e) {
      e.preventDefault();
      if (agendamentoErro) {
        agendamentoErro.textContent = "";
        agendamentoErro.classList.add("hidden");
      }
      var sess = getSessao();
      if (!sess || sess.tipo !== "cliente") {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Faça login como cliente para agendar.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      var cliente = getClienteAtual();
      if (!cliente) {
        abrirEntrada();
        return;
      }
      var servicos = getServicos();
      var sid = selectServico.value;
      if (!sid || servicos.length === 0) {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Não há serviços disponíveis. Aguarde o barbeiro cadastrar.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      var data = agData.value;
      var hora = agHora.value;
      if (!data || !hora) {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Preencha data e horário.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      var iso = isoLocal(data, hora);
      if (!iso) {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Data ou horário inválidos.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      if (slotOcupado(data, hora)) {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Este horário já foi agendado. Escolha outro.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      var nomeVal = agNome.value.trim();
      var zapVal = agWhatsapp.value.trim();
      if (nomeVal.length < 2) {
        if (agendamentoErro) {
          agendamentoErro.textContent = "Informe seu nome.";
          agendamentoErro.classList.remove("hidden");
        }
        return;
      }
      var svc = servicos.find(function (s) { return s.id === sid; });
      var lista = getAgendamentos();
      lista.push({
        id: uid(),
        userId: cliente.id,
        clientName: nomeVal,
        whatsapp: zapVal,
        datetime: iso,
        serviceId: sid,
        serviceName: svc ? svc.name : "",
      });
      save(KEY_AG, lista);
      renderCalendario();
      renderHorariosLivresEntrada();
      if (agendamentoErro) agendamentoErro.classList.add("hidden");
    });
  }

  function renderBarbeiro() {
    renderListaServicos();
    if (!tbodyAg) return;
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
        renderHorariosLivresEntrada();
      });
      tdBtn.appendChild(rm);
      tbodyAg.appendChild(tr);
    });
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
    if (!calTitulo || !calGrade) return;
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

  if (calMesAnt) {
    calMesAnt.addEventListener("click", function () {
      mesCal--;
      if (mesCal < 0) {
        mesCal = 11;
        anoCal--;
      }
      renderCalendario();
    });
  }
  if (calProxMes) {
    calProxMes.addEventListener("click", function () {
      mesCal++;
      if (mesCal > 11) {
        mesCal = 0;
        anoCal++;
      }
      renderCalendario();
    });
  }

  /* ——— Início: estado da sessão ou entrada ——— */
  var h = new Date();
  if (agData) {
    agData.value =
      h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0") + "-" + String(h.getDate()).padStart(2, "0");
  }
  if (agHora) {
    agHora.value = "09:00";
  }

  var sessIni = getSessao();
  if (sessIni && sessIni.tipo === "cliente" && getClienteAtual()) {
    atualizarTopoSaudacao();
    mostrarTela("painel-cliente");
  } else if (sessIni && sessIni.tipo === "barbeiro") {
    atualizarTopoSaudacao();
    mostrarTela("painel-barbeiro");
  } else {
    limparSessao();
    atualizarTopoSaudacao();
    mostrarTela("tela-entrada");
  }

  renderListaServicos();
  popularSelectServicos();
})();
