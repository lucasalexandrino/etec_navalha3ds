import { storage } from "../js/storage.js";
import { scheduler } from "../js/scheduler.js";
import { ui } from "../js/ui.js";

storage.garantirDadosIniciais();

function migrarAgendamento(a) {
  if (a.concluidoEmIso === undefined) a.concluidoEmIso = null;
  if (!Array.isArray(a.historicoLog)) a.historicoLog = [];
  return a;
}

const state = {
  sessao: storage.lerSessao(),
  usuarios: storage.lerUsuarios(),
  barbeiros: storage.lerBarbeiros(),
  servicos: storage.lerServicos(),
  agendamentos: storage.lerAgendamentos(),
};

state.agendamentos = state.agendamentos.map(migrarAgendamento);
storage.salvarAgendamentos(state.agendamentos);

const el = {
  viewAdminLogin: ui.qs("#viewAdminLogin"),
  viewAdminDash: ui.qs("#viewAdminDash"),
  formAdminLogin: ui.qs("#formAdminLogin"),
  admEmail: ui.qs("#admEmail"),
  admSenha: ui.qs("#admSenha"),
  admEmailHelp: ui.qs("#admEmailHelp"),
  admSenhaHelp: ui.qs("#admSenhaHelp"),
  btnAdminDemo: ui.qs("#btnAdminDemo"),
  btnAdminLogout: ui.qs("#btnAdminLogout"),
  adminSessionChip: ui.qs("#adminSessionChip"),
  adminPageTitle: ui.qs("#adminPageTitle"),
  adminPageSub: ui.qs("#adminPageSub"),
  adminViewDashboard: ui.qs("#adminViewDashboard"),
  adminViewAgenda: ui.qs("#adminViewAgenda"),
  adminViewServicos: ui.qs("#adminViewServicos"),
  adminData: ui.qs("#adminData"),
  adminBarbeiro: ui.qs("#adminBarbeiro"),
  btnAdminHoje: ui.qs("#btnAdminHoje"),
  kpiTotal: ui.qs("#kpiTotal"),
  kpiPix: ui.qs("#kpiPix"),
  kpiDinheiro: ui.qs("#kpiDinheiro"),
  kpiCartao: ui.qs("#kpiCartao"),
  kpiBoleto: ui.qs("#kpiBoleto"),
  adminPendentes: ui.qs("#adminPendentes"),
  adminAgendamentosBody: ui.qs("#adminAgendamentosBody"),
  adminServicosBody: ui.qs("#adminServicosBody"),
  adminSrvNome: ui.qs("#adminSrvNome"),
  adminSrvDuracao: ui.qs("#adminSrvDuracao"),
  adminSrvPreco: ui.qs("#adminSrvPreco"),
  btnAdminSrvAdicionar: ui.qs("#btnAdminSrvAdicionar"),
};

const TAB_COPY = {
  Dashboard: {
    title: "Visão geral",
    sub: "Faturamento e pendências do dia selecionado.",
  },
  Agenda: {
    title: "Agenda do dia",
    sub: "Todos os agendamentos do filtro atual, com ações rápidas.",
  },
  Servicos: {
    title: "Serviços",
    sub: "Cadastro de serviços e preços usados nos novos agendamentos.",
  },
};

function validarLogin({ email, senha }) {
  const emailTrim = String(email || "").trim().toLowerCase();
  const senhaStr = String(senha || "");
  const usuario = state.usuarios.find(
    (u) => u.email.toLowerCase() === emailTrim && u.senha === senhaStr
  );
  return { ok: Boolean(usuario), usuario };
}

function setSessao(usuario) {
  state.sessao = usuario
    ? {
        usuarioId: usuario.id,
        nivelAcesso: usuario.nivelAcesso,
        criadoEmIso: new Date().toISOString(),
      }
    : null;
  if (state.sessao) storage.salvarSessao(state.sessao);
  else storage.limparSessao();
}

function obterUsuarioAtual() {
  if (!state.sessao) return null;
  return state.usuarios.find((u) => u.id === state.sessao.usuarioId) || null;
}

function recarregarEstadoDoStorage() {
  state.usuarios = storage.lerUsuarios();
  state.barbeiros = storage.lerBarbeiros();
  state.servicos = storage.lerServicos();
  state.agendamentos = storage.lerAgendamentos().map(migrarAgendamento);
}

function dataYmdDeDate(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function obterHojeYmd() {
  return dataYmdDeDate(new Date());
}

function formatarDataYmdParaBR(ymd) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function obterServicoPorId(id) {
  return state.servicos.find((s) => s.id === id) || null;
}

function obterBarbeiroPorId(id) {
  return state.barbeiros.find((b) => b.id === id) || null;
}

function logAgendamento(ag, msg) {
  ag.historicoLog.push(`${new Date().toISOString()} — ${msg}`);
}

function salvarAgendamentos() {
  storage.salvarAgendamentos(state.agendamentos);
}

function salvarServicos() {
  storage.salvarServicos(state.servicos);
}

function parseMoedaBRLParaCentavos(str) {
  const limpo = String(str || "")
    .trim()
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const v = Number(normalizado);
  if (!Number.isFinite(v) || v < 0) return null;
  return Math.round(v * 100);
}

function formatarCentavosInputBR(centavos) {
  const v = (centavos || 0) / 100;
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarMetodoPagamentoLabel(metodo) {
  if (metodo === "CartaoCredito") return "Cartão (Crédito)";
  if (metodo === "CartaoDebito") return "Cartão (Débito)";
  if (metodo === "Boleto") return "Boleto";
  return metodo;
}

function renderPillStatus(status) {
  const s = status || "Pendente";
  if (s === "Pago") return `<span class="pill pillOk">Pago</span>`;
  if (s === "Cancelado") return `<span class="pill pillDanger">Cancelado</span>`;
  return `<span class="pill pillWarn">Pendente</span>`;
}

function pillAtendimento(ag) {
  if (ag.statusPagamento === "Cancelado") return `<span class="pill pillDanger">Cancelado</span>`;
  if (ag.concluidoEmIso)
    return `<span class="pill pillOk">Concluído</span><div class="slotMeta" style="margin-top:4px">${new Date(
      ag.concluidoEmIso
    ).toLocaleString("pt-BR")}</div>`;
  return `<span class="pill pillMuted">Agendado</span>`;
}

function uiEscape(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function carregarSelectBarbeirosAdmin() {
  ui.limpar(el.adminBarbeiro);
  const oTodos = document.createElement("option");
  oTodos.value = "Todos";
  oTodos.textContent = "Todos";
  el.adminBarbeiro.appendChild(oTodos);
  for (const b of state.barbeiros) {
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = b.nome;
    el.adminBarbeiro.appendChild(o);
  }
}

function configurarDefaultsAdmin() {
  if (!el.adminData.value) el.adminData.value = obterHojeYmd();
  if (!el.adminBarbeiro.value) el.adminBarbeiro.value = "Todos";
}

function syncNavTabClasses(tab) {
  const t = tab === "Agenda" ? "Agenda" : tab === "Servicos" ? "Servicos" : "Dashboard";
  document.querySelectorAll(".adminNavBtn[data-admin-tab]").forEach((btn) => {
    const on = btn.dataset.adminTab === t;
    btn.classList.toggle("isActive", on);
    btn.setAttribute("aria-current", on ? "page" : "false");
  });
}

function setAdminTab(tab) {
  const t = tab === "Agenda" ? "Agenda" : tab === "Servicos" ? "Servicos" : "Dashboard";
  localStorage.setItem("navalha_ui_adminTab", t);
  const copy = TAB_COPY[t];
  el.adminPageTitle.textContent = copy.title;
  el.adminPageSub.textContent = copy.sub;
  syncNavTabClasses(t);
  ui.setHidden(el.adminViewDashboard, t !== "Dashboard");
  ui.setHidden(el.adminViewAgenda, t !== "Agenda");
  ui.setHidden(el.adminViewServicos, t !== "Servicos");
  if (t === "Servicos") renderAdminServicos();
  else renderAdmin();
}

function filtrarAgendamentosAdmin({ dataYmd, barbeiroFiltro }) {
  return state.agendamentos.filter((a) => {
    if (a.dataYmd !== dataYmd) return false;
    if (barbeiroFiltro && barbeiroFiltro !== "Todos" && a.barbeiroId !== barbeiroFiltro) return false;
    return true;
  });
}

function renderAdmin() {
  const dataYmd = el.adminData.value || obterHojeYmd();
  const barbeiroFiltro = el.adminBarbeiro.value || "Todos";
  const lista = filtrarAgendamentosAdmin({ dataYmd, barbeiroFiltro }).slice();
  lista.sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));
  renderAdminKpis(lista);
  renderAdminPendentes(lista);
  renderAdminTabela(lista);
}

function renderAdminKpis(lista) {
  const pagos = lista.filter((a) => a.statusPagamento === "Pago");
  const somaTotal = pagos.reduce((acc, a) => acc + (a.valorCentavos || 0), 0);
  const somaPix = pagos
    .filter((a) => scheduler.normalizarMetodoPagamento(a.metodoPagamento) === "Pix")
    .reduce((acc, a) => acc + (a.valorCentavos || 0), 0);
  const somaDinheiro = pagos
    .filter((a) => scheduler.normalizarMetodoPagamento(a.metodoPagamento) === "Dinheiro")
    .reduce((acc, a) => acc + (a.valorCentavos || 0), 0);
  const somaCartao = pagos
    .filter((a) => scheduler.normalizarMetodoPagamento(a.metodoPagamento) === "Cartao")
    .reduce((acc, a) => acc + (a.valorCentavos || 0), 0);
  const somaBoleto = pagos
    .filter((a) => scheduler.normalizarMetodoPagamento(a.metodoPagamento) === "Boleto")
    .reduce((acc, a) => acc + (a.valorCentavos || 0), 0);

  el.kpiTotal.textContent = scheduler.formatarMoedaBR(somaTotal);
  el.kpiPix.textContent = scheduler.formatarMoedaBR(somaPix);
  el.kpiDinheiro.textContent = scheduler.formatarMoedaBR(somaDinheiro);
  el.kpiCartao.textContent = scheduler.formatarMoedaBR(somaCartao);
  el.kpiBoleto.textContent = scheduler.formatarMoedaBR(somaBoleto);
}

function calcularUrgenciaPendente(ag) {
  const agora = new Date();
  const inicio = new Date(ag.inicioIso);
  const diffMin = Math.round((inicio - agora) / 60000);
  if (inicio < agora) return "danger";
  if (diffMin <= 120) return "warn";
  return "none";
}

function renderAdminPendentes(lista) {
  const pendentes = lista.filter((a) => a.statusPagamento === "Pendente");
  ui.limpar(el.adminPendentes);
  if (pendentes.length === 0) {
    el.adminPendentes.innerHTML = `<div class="hint">Nenhuma pendência no filtro atual.</div>`;
    return;
  }
  for (const a of pendentes) {
    const servico = obterServicoPorId(a.servicoId);
    const barbeiro = obterBarbeiroPorId(a.barbeiroId);
    const inicio = new Date(a.inicioIso);
    const urgencia = calcularUrgenciaPendente(a);
    const item = document.createElement("div");
    item.className = `listItem${
      urgencia === "danger" ? " listItemUrgencyDanger" : urgencia === "warn" ? " listItemUrgencyWarn" : ""
    }`;
    const main = document.createElement("div");
    main.className = "listItemMain";
    main.innerHTML = `
      <div class="listItemTitle">${scheduler.formatarHora(inicio)} • ${a.clienteNome}</div>
      <div class="listItemMeta">${servico?.nome ?? "—"} • ${barbeiro?.nome ?? "—"} • ${scheduler.formatarMoedaBR(
        a.valorCentavos
      )} • ${formatarMetodoPagamentoLabel(a.metodoPagamento)}</div>
    `;
    const actions = document.createElement("div");
    actions.className = "row";
    const btnPago = document.createElement("button");
    btnPago.type = "button";
    btnPago.className = "btn btnPrimary btnSm";
    btnPago.textContent = "Marcar como Pago";
    btnPago.addEventListener("click", () => marcarPago(a.id));
    actions.appendChild(btnPago);
    item.appendChild(main);
    item.appendChild(actions);
    el.adminPendentes.appendChild(item);
  }
}

function renderAdminTabela(lista) {
  ui.limpar(el.adminAgendamentosBody);
  for (const a of lista) {
    const inicio = new Date(a.inicioIso);
    const servico = obterServicoPorId(a.servicoId);
    const barbeiro = obterBarbeiroPorId(a.barbeiroId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${scheduler.formatarHora(inicio)}</td>
      <td>${a.clienteNome}</td>
      <td>${servico?.nome ?? "—"}</td>
      <td>${barbeiro?.nome ?? "—"}</td>
      <td>${scheduler.formatarMoedaBR(a.valorCentavos)}</td>
      <td>${formatarMetodoPagamentoLabel(a.metodoPagamento)}</td>
      <td>${renderPillStatus(a.statusPagamento)}</td>
      <td>${pillAtendimento(a)}</td>
      <td></td>
    `;
    const tdAcoes = tr.querySelector("td:last-child");
    const row = document.createElement("div");
    row.className = "row";
    row.style.flexWrap = "wrap";
    if (a.statusPagamento !== "Cancelado") {
      const btnCancelar = document.createElement("button");
      btnCancelar.type = "button";
      btnCancelar.className = "btn btnDanger btnSm";
      btnCancelar.textContent = "Cancelar";
      btnCancelar.addEventListener("click", () => cancelarAgendamento(a.id));
      row.appendChild(btnCancelar);
    }
    if (a.statusPagamento === "Pendente") {
      const btnPago = document.createElement("button");
      btnPago.type = "button";
      btnPago.className = "btn btnPrimary btnSm";
      btnPago.textContent = "Pago";
      btnPago.addEventListener("click", () => marcarPago(a.id));
      row.appendChild(btnPago);
    }
    tdAcoes.appendChild(row);
    el.adminAgendamentosBody.appendChild(tr);
  }
  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" style="color:var(--muted)">Nenhum agendamento no filtro atual.</td>`;
    el.adminAgendamentosBody.appendChild(tr);
  }
}

function renderAdminServicos() {
  ui.limpar(el.adminServicosBody);
  for (const s of state.servicos) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input data-k="nome" data-id="${s.id}" type="text" value="${uiEscape(s.nome)}" style="width:100%; min-width:160px" /></td>
      <td><input data-k="dur" data-id="${s.id}" type="number" min="10" step="5" value="${s.duracaoMinutos}" style="width:96px" /></td>
      <td><input data-k="preco" data-id="${s.id}" type="text" value="${formatarCentavosInputBR(s.precoCentavos)}" style="width:120px" /></td>
      <td></td>
    `;
    const td = tr.querySelector("td:last-child");
    const row = document.createElement("div");
    row.className = "row";
    const btnSalvar = document.createElement("button");
    btnSalvar.type = "button";
    btnSalvar.className = "btn btnPrimary btnSm";
    btnSalvar.textContent = "Salvar";
    btnSalvar.addEventListener("click", () => salvarServicoLinha(s.id, tr));
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn btnDanger btnSm";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", () => excluirServico(s.id));
    row.appendChild(btnSalvar);
    row.appendChild(btnDel);
    td.appendChild(row);
    el.adminServicosBody.appendChild(tr);
  }
  if (state.servicos.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="color:var(--muted)">Nenhum serviço cadastrado.</td>`;
    el.adminServicosBody.appendChild(tr);
  }
}

function salvarServicoLinha(servicoId, tr) {
  const nome = tr.querySelector(`input[data-k="nome"][data-id="${servicoId}"]`)?.value?.trim();
  const dur = Number(tr.querySelector(`input[data-k="dur"][data-id="${servicoId}"]`)?.value);
  const precoStr = tr.querySelector(`input[data-k="preco"][data-id="${servicoId}"]`)?.value;
  const preco = parseMoedaBRLParaCentavos(precoStr);
  if (!nome) {
    ui.toast({ titulo: "Nome obrigatório", msg: "Informe o nome do serviço.", tipo: "warn" });
    return;
  }
  if (!Number.isFinite(dur) || dur < 10) {
    ui.toast({ titulo: "Duração inválida", msg: "Use pelo menos 10 minutos.", tipo: "warn" });
    return;
  }
  if (preco === null) {
    ui.toast({ titulo: "Preço inválido", msg: "Use formato como 35,00.", tipo: "warn" });
    return;
  }
  const s = state.servicos.find((x) => x.id === servicoId);
  if (!s) return;
  s.nome = nome;
  s.duracaoMinutos = Math.round(dur);
  s.precoCentavos = preco;
  salvarServicos();
  renderAdminServicos();
  ui.toast({ titulo: "Serviço atualizado", msg: s.nome, tipo: "ok" });
}

function excluirServico(servicoId) {
  void (async () => {
    const ok = await ui.confirmar({
      titulo: "Excluir serviço?",
      msg: "Agendamentos antigos podem exibir “—” para o nome se o serviço sumir.",
      confirmarTexto: "Excluir",
    });
    if (!ok) return;
    state.servicos = state.servicos.filter((s) => s.id !== servicoId);
    salvarServicos();
    renderAdminServicos();
    ui.toast({ titulo: "Removido", msg: "Serviço excluído.", tipo: "warn" });
  })();
}

function adminAdicionarServico() {
  const nome = el.adminSrvNome.value.trim();
  const dur = Number(el.adminSrvDuracao.value);
  const preco = parseMoedaBRLParaCentavos(el.adminSrvPreco.value);
  if (!nome) {
    ui.toast({ titulo: "Nome obrigatório", msg: "Preencha o nome.", tipo: "warn" });
    return;
  }
  if (!Number.isFinite(dur) || dur < 10) {
    ui.toast({ titulo: "Duração inválida", msg: "Mínimo 10 minutos.", tipo: "warn" });
    return;
  }
  if (preco === null) {
    ui.toast({ titulo: "Preço inválido", msg: "Ex.: 40,00", tipo: "warn" });
    return;
  }
  const novo = {
    id: storage.gerarId("srv"),
    nome,
    duracaoMinutos: Math.round(dur),
    precoCentavos: preco,
  };
  state.servicos.push(novo);
  salvarServicos();
  el.adminSrvNome.value = "";
  el.adminSrvDuracao.value = "30";
  el.adminSrvPreco.value = "";
  renderAdminServicos();
  ui.toast({ titulo: "Serviço criado", msg: novo.nome, tipo: "ok" });
}

function marcarPago(agendamentoId) {
  recarregarEstadoDoStorage();
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a) return;
  if (a.statusPagamento === "Cancelado") {
    ui.toast({ titulo: "Não permitido", msg: "Agendamento cancelado não pode ser marcado como pago.", tipo: "warn" });
    return;
  }
  a.statusPagamento = "Pago";
  a.pagoEmIso = new Date().toISOString();
  logAgendamento(a, "Pagamento confirmado pelo admin");
  salvarAgendamentos();
  ui.toast({
    titulo: "Pagamento confirmado",
    msg: `Recebimento registrado às ${new Date(a.pagoEmIso).toLocaleTimeString("pt-BR")}.`,
    tipo: "ok",
  });
  renderAdmin();
}

async function cancelarAgendamento(agendamentoId) {
  recarregarEstadoDoStorage();
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a) return;
  if (a.statusPagamento === "Cancelado") return;
  const ok = await ui.confirmar({
    titulo: "Cancelar agendamento?",
    msg: `${formatarDataYmdParaBR(a.dataYmd)} • ${scheduler.formatarHora(new Date(a.inicioIso))} • ${a.clienteNome}`,
    confirmarTexto: "Cancelar",
    cancelarTexto: "Voltar",
  });
  if (!ok) return;
  a.statusPagamento = "Cancelado";
  a.canceladoEmIso = new Date().toISOString();
  logAgendamento(a, "Cancelado pelo admin (painel)");
  salvarAgendamentos();
  ui.toast({ titulo: "Cancelado", msg: "O horário foi liberado.", tipo: "warn" });
  renderAdmin();
}

function renderShellLogado() {
  const u = obterUsuarioAtual();
  el.adminSessionChip.textContent = u ? `${u.nome} • Administrador` : "";
  ui.setHidden(el.viewAdminLogin, true);
  ui.setHidden(el.viewAdminDash, false);
  carregarSelectBarbeirosAdmin();
  configurarDefaultsAdmin();
  setAdminTab(localStorage.getItem("navalha_ui_adminTab") || "Dashboard");
}

function renderShellDeslogado() {
  ui.setHidden(el.viewAdminLogin, false);
  ui.setHidden(el.viewAdminDash, true);
}

function wireEvents() {
  const limparErros = () => {
    ui.setFieldHelp(el.admEmailHelp, "");
    ui.setFieldHelp(el.admSenhaHelp, "");
  };

  el.admEmail.addEventListener("input", limparErros);
  el.admSenha.addEventListener("input", limparErros);

  el.btnAdminDemo.addEventListener("click", () => {
    el.admEmail.value = "admin@navalha.com";
    el.admSenha.value = "1234";
    limparErros();
  });

  el.formAdminLogin.addEventListener("submit", (ev) => {
    ev.preventDefault();
    limparErros();
    const { ok, usuario } = validarLogin({ email: el.admEmail.value, senha: el.admSenha.value });
    if (!ok) {
      ui.setFieldHelp(el.admSenhaHelp, "E-mail ou senha inválidos.", true);
      ui.toast({ titulo: "Falha no login", msg: "Verifique suas credenciais.", tipo: "danger" });
      return;
    }
    if (usuario.nivelAcesso !== "Admin") {
      ui.toast({
        titulo: "Acesso restrito",
        msg: "Este painel é só para administradores. Use o login normal no site.",
        tipo: "warn",
      });
      return;
    }
    setSessao(usuario);
    ui.toast({ titulo: "Bem-vindo", msg: "Painel administrativo liberado.", tipo: "ok" });
    renderShellLogado();
  });

  el.btnAdminLogout.addEventListener("click", () => {
    setSessao(null);
    ui.toast({ titulo: "Sessão encerrada", msg: "Você saiu do painel.", tipo: "ok" });
    renderShellDeslogado();
  });

  document.querySelectorAll(".adminNavBtn[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setAdminTab(btn.dataset.adminTab));
  });

  el.adminData.addEventListener("change", () => {
    recarregarEstadoDoStorage();
    renderAdmin();
  });
  el.adminBarbeiro.addEventListener("change", () => {
    recarregarEstadoDoStorage();
    renderAdmin();
  });
  el.btnAdminHoje.addEventListener("click", () => {
    el.adminData.value = obterHojeYmd();
    recarregarEstadoDoStorage();
    renderAdmin();
  });
  el.btnAdminSrvAdicionar.addEventListener("click", () => adminAdicionarServico());

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") return;
    recarregarEstadoDoStorage();
    if (obterUsuarioAtual()?.nivelAcesso === "Admin") {
      carregarSelectBarbeirosAdmin();
      const t = localStorage.getItem("navalha_ui_adminTab") || "Dashboard";
      if (t === "Servicos") renderAdminServicos();
      else renderAdmin();
    }
  });
}

function boot() {
  wireEvents();
  el.adminData.min = obterHojeYmd();

  state.sessao = storage.lerSessao();
  const u = obterUsuarioAtual();
  if (state.sessao && u?.nivelAcesso === "Admin") {
    renderShellLogado();
  } else {
    renderShellDeslogado();
  }
}

boot();
