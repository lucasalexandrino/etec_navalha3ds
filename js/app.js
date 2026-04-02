import { storage } from "./storage.js";
import { scheduler } from "./scheduler.js";
import { ui } from "./ui.js";

storage.garantirDadosIniciais();

const state = {
  sessao: storage.lerSessao(),
  usuarios: storage.lerUsuarios(),
  barbeiros: storage.lerBarbeiros(),
  servicos: storage.lerServicos(),
  agendamentos: storage.lerAgendamentos(),

  clienteSelecionado: {
    barbeiroId: null,
    dataYmd: null,
    servicoId: null,
    horarioInicio: null,
    metodoPagamento: "Pix",
  },
};

const el = {
  // Views
  viewLogin: ui.qs("#viewLogin"),
  viewCliente: ui.qs("#viewCliente"),
  viewAdmin: ui.qs("#viewAdmin"),

  sessionChip: ui.qs("#sessionChip"),
  sessionChipLabel: ui.qs("#sessionChipLabel"),
  btnLogout: ui.qs("#btnLogout"),

  // Login
  formLogin: ui.qs("#formLogin"),
  loginEmail: ui.qs("#loginEmail"),
  loginSenha: ui.qs("#loginSenha"),
  loginEmailHelp: ui.qs("#loginEmailHelp"),
  loginSenhaHelp: ui.qs("#loginSenhaHelp"),
  btnPreencherDemo: ui.qs("#btnPreencherDemo"),
  btnLoginAdmin: ui.qs("#btnLoginAdmin"),
  btnLoginUsuario: ui.qs("#btnLoginUsuario"),

  // Cliente
  tabClienteAgendar: ui.qs("#tabClienteAgendar"),
  tabClienteHistorico: ui.qs("#tabClienteHistorico"),
  clienteViewAgendar: ui.qs("#clienteViewAgendar"),
  clienteViewHistorico: ui.qs("#clienteViewHistorico"),
  clienteHorariosField: ui.qs("#clienteHorariosField"),
  clienteBarbeiro: ui.qs("#clienteBarbeiro"),
  clienteData: ui.qs("#clienteData"),
  clienteServico: ui.qs("#clienteServico"),
  slotsContainer: ui.qs("#slotsContainer"),
  slotsHelp: ui.qs("#slotsHelp"),
  clientePagamento: ui.qs("#clientePagamento"),
  resumoDuracao: ui.qs("#resumoDuracao"),
  resumoValor: ui.qs("#resumoValor"),
  btnAgendar: ui.qs("#btnAgendar"),
  agendamentoHint: ui.qs("#agendamentoHint"),
  clienteHistoricoBody: ui.qs("#clienteHistoricoBody"),

  // Admin
  tabAdminDashboard: ui.qs("#tabAdminDashboard"),
  tabAdminAgenda: ui.qs("#tabAdminAgenda"),
  adminViewDashboard: ui.qs("#adminViewDashboard"),
  adminViewAgenda: ui.qs("#adminViewAgenda"),
  adminData: ui.qs("#adminData"),
  adminBarbeiro: ui.qs("#adminBarbeiro"),
  btnAdminHoje: ui.qs("#btnAdminHoje"),
  kpiTotal: ui.qs("#kpiTotal"),
  kpiPix: ui.qs("#kpiPix"),
  kpiDinheiro: ui.qs("#kpiDinheiro"),
  kpiCartao: ui.qs("#kpiCartao"),
  adminPendentes: ui.qs("#adminPendentes"),
  adminAgendamentosBody: ui.qs("#adminAgendamentosBody"),

  // Pix
  modalPix: ui.qs("#modalPix"),
  pixCanvas: ui.qs("#pixCanvas"),
  pixChave: ui.qs("#pixChave"),
  pixValor: ui.qs("#pixValor"),
  pixId: ui.qs("#pixId"),
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

function formatarDataYmdParaBR(ymd) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function carregarSelects() {
  const optPadrao = (texto) => {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = texto;
    return o;
  };

  ui.limpar(el.clienteBarbeiro);
  el.clienteBarbeiro.appendChild(optPadrao("Selecione..."));
  for (const b of state.barbeiros) {
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = b.nome;
    el.clienteBarbeiro.appendChild(o);
  }

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

  ui.limpar(el.clienteServico);
  el.clienteServico.appendChild(optPadrao("Selecione..."));
  for (const s of state.servicos) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.nome} • ${s.duracaoMinutos} min • ${scheduler.formatarMoedaBR(
      s.precoCentavos
    )}`;
    el.clienteServico.appendChild(o);
  }
}

function setTabActive(btnOn, btnOff) {
  btnOn.classList.add("isActive");
  btnOff.classList.remove("isActive");
  btnOn.setAttribute("aria-selected", "true");
  btnOff.setAttribute("aria-selected", "false");
}

function setClienteTab(tab) {
  const t = tab === "Historico" ? "Historico" : "Agendar";
  localStorage.setItem("navalha_ui_clienteTab", t);
  const isAgendar = t === "Agendar";
  ui.setHidden(el.clienteViewAgendar, !isAgendar);
  ui.setHidden(el.clienteViewHistorico, isAgendar);
  if (isAgendar) setTabActive(el.tabClienteAgendar, el.tabClienteHistorico);
  else setTabActive(el.tabClienteHistorico, el.tabClienteAgendar);
}

function setAdminTab(tab) {
  const t = tab === "Agenda" ? "Agenda" : "Dashboard";
  localStorage.setItem("navalha_ui_adminTab", t);
  const isDash = t === "Dashboard";
  ui.setHidden(el.adminViewDashboard, !isDash);
  ui.setHidden(el.adminViewAgenda, isDash);
  if (isDash) setTabActive(el.tabAdminDashboard, el.tabAdminAgenda);
  else setTabActive(el.tabAdminAgenda, el.tabAdminDashboard);
}

function renderSessaoTopBar() {
  const usuario = obterUsuarioAtual();
  if (!usuario) {
    ui.setHidden(el.sessionChip, true);
    return;
  }
  ui.setHidden(el.sessionChip, false);
  el.sessionChipLabel.textContent = `${usuario.nome} • ${usuario.nivelAcesso}`;
}

function renderViews() {
  const usuario = obterUsuarioAtual();
  const logado = Boolean(usuario);

  ui.setHidden(el.viewLogin, logado);
  ui.setHidden(el.viewCliente, !logado || usuario.nivelAcesso !== "Cliente");
  ui.setHidden(el.viewAdmin, !logado || usuario.nivelAcesso !== "Admin");

  renderSessaoTopBar();
  if (!usuario) return;

  if (usuario.nivelAcesso === "Cliente") {
    renderClienteHistorico();
    configurarDefaultsCliente();
    inicializarEstadoClienteInputs();
    atualizarResumoCliente();
    renderSlotsCliente();
  } else {
    configurarDefaultsAdmin();
    renderAdmin();
  }
}

function configurarDefaultsCliente() {
  if (!el.clienteData.value) el.clienteData.value = obterHojeYmd();
  // Defaults “inteligentes” para reduzir cliques
  if (!el.clienteBarbeiro.value && state.barbeiros.length > 0) el.clienteBarbeiro.value = state.barbeiros[0].id;
  if (!el.clienteServico.value && state.servicos.length > 0) el.clienteServico.value = state.servicos[0].id;
}

function obterHojeYmd() {
  const a = new Date();
  const y = a.getFullYear();
  const m = String(a.getMonth() + 1).padStart(2, "0");
  const d = String(a.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function obterServicoPorId(id) {
  return state.servicos.find((s) => s.id === id) || null;
}

function obterBarbeiroPorId(id) {
  return state.barbeiros.find((b) => b.id === id) || null;
}

function listarAgendamentosPorBarbeiroDia({ barbeiroId, dataYmd }) {
  return state.agendamentos.filter((a) => {
    if (a.barbeiroId !== barbeiroId) return false;
    if (a.dataYmd !== dataYmd) return false;
    return true;
  });
}

function atualizarResumoCliente() {
  const servico = obterServicoPorId(state.clienteSelecionado.servicoId);
  if (!servico) {
    el.resumoDuracao.textContent = "—";
    el.resumoValor.textContent = "—";
    return;
  }
  el.resumoDuracao.textContent = `${servico.duracaoMinutos} min`;
  el.resumoValor.textContent = scheduler.formatarMoedaBR(servico.precoCentavos);
}

function renderSlotsCliente() {
  ui.limpar(el.slotsContainer);
  ui.setFieldHelp(el.slotsHelp, "");

  const barbeiroId = state.clienteSelecionado.barbeiroId;
  const dataYmd = state.clienteSelecionado.dataYmd;
  const servico = obterServicoPorId(state.clienteSelecionado.servicoId);

  state.clienteSelecionado.horarioInicio = null;
  el.btnAgendar.disabled = true;

  if (!barbeiroId || !dataYmd || !servico) {
    ui.setFieldHelp(el.slotsHelp, "Selecione barbeiro, data e serviço para ver os horários.");
    return;
  }

  const existentes = listarAgendamentosPorBarbeiroDia({ barbeiroId, dataYmd });
  const slots = scheduler.gerarSlotsDia({ dataYmd, duracaoMinutos: servico.duracaoMinutos });

  let primeiroLivreBtn = null;
  for (const s of slots) {
    const hora = scheduler.formatarHora(s.inicio);
    const conflita = scheduler.verificarConflito({
      novoInicio: s.inicio,
      novoFimSemLimpeza: s.fimSemLimpeza,
      agendamentosExistentes: existentes,
    });
    const desabilitado = s.noPassado || conflita;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `slot${desabilitado ? " isDisabled" : ""}`;
    btn.setAttribute("role", "listitem");
    btn.dataset.hora = hora;
    btn.disabled = desabilitado;

    const meta = conflita ? "Ocupado" : s.noPassado ? "Passado" : "Livre";
    btn.innerHTML = `${hora}<span class="slotMeta">${meta}</span>`;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      state.clienteSelecionado.horarioInicio = hora;
      ui.qsa(".slot", el.slotsContainer).forEach((x) => x.classList.remove("isSelected"));
      btn.classList.add("isSelected");
      el.btnAgendar.disabled = false;
      ui.setFieldHelp(el.slotsHelp, "");
    });

    if (!desabilitado && !primeiroLivreBtn) primeiroLivreBtn = btn;
    el.slotsContainer.appendChild(btn);
  }

  // Sugestão UX: guia para o próximo horário livre
  if (primeiroLivreBtn) {
    ui.setFieldHelp(el.slotsHelp, "Dica: o primeiro horário livre está pronto para seleção.");
    // Micro interação: scroll suave até a lista de horários
    window.setTimeout(() => {
      el.clienteHorariosField?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  } else {
    ui.setFieldHelp(el.slotsHelp, "Sem horários livres para este filtro. Tente outra data/serviço.", true);
  }
}

function renderClienteHistorico() {
  const usuario = obterUsuarioAtual();
  if (!usuario) return;

  const meus = state.agendamentos
    .filter((a) => a.clienteUsuarioId === usuario.id)
    .slice()
    .sort((a, b) => new Date(b.inicioIso) - new Date(a.inicioIso));

  ui.limpar(el.clienteHistoricoBody);
  for (const a of meus) {
    const servico = obterServicoPorId(a.servicoId);
    const barbeiro = obterBarbeiroPorId(a.barbeiroId);
    const inicio = new Date(a.inicioIso);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatarDataYmdParaBR(a.dataYmd)}</td>
      <td>${scheduler.formatarHora(inicio)}</td>
      <td>${servico?.nome ?? "—"}</td>
      <td>${barbeiro?.nome ?? "—"}</td>
      <td>${formatarMetodoPagamentoLabel(a.metodoPagamento)}</td>
      <td>${renderPillStatus(a.statusPagamento)}</td>
    `;
    el.clienteHistoricoBody.appendChild(tr);
  }
  if (meus.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" style="color:var(--muted)">Nenhum agendamento ainda.</td>`;
    el.clienteHistoricoBody.appendChild(tr);
  }
}

function formatarMetodoPagamentoLabel(metodo) {
  if (metodo === "CartaoCredito") return "Cartão (Crédito)";
  if (metodo === "CartaoDebito") return "Cartão (Débito)";
  return metodo;
}

function renderPillStatus(status) {
  const s = status || "Pendente";
  if (s === "Pago") return `<span class="pill pillOk">Pago</span>`;
  if (s === "Cancelado") return `<span class="pill pillDanger">Cancelado</span>`;
  return `<span class="pill pillWarn">Pendente</span>`;
}

function salvarAgendamentos() {
  storage.salvarAgendamentos(state.agendamentos);
}

function agendarHorario() {
  const usuario = obterUsuarioAtual();
  if (!usuario) return;
  if (usuario.nivelAcesso !== "Cliente") return;

  const barbeiroId = state.clienteSelecionado.barbeiroId;
  const dataYmd = state.clienteSelecionado.dataYmd;
  const servico = obterServicoPorId(state.clienteSelecionado.servicoId);
  const hora = state.clienteSelecionado.horarioInicio;
  const metodoPagamento = state.clienteSelecionado.metodoPagamento;

  if (!barbeiroId || !dataYmd || !servico || !hora) {
    ui.toast({ titulo: "Faltam dados", msg: "Selecione barbeiro, data, serviço e horário.", tipo: "warn" });
    return;
  }

  const inicio = scheduler.criarDataLocalPorDiaHora(dataYmd, hora);
  const fimSemLimpeza = scheduler.somarMinutos(inicio, servico.duracaoMinutos);
  const existentes = listarAgendamentosPorBarbeiroDia({ barbeiroId, dataYmd });
  const conflita = scheduler.verificarConflito({
    novoInicio: inicio,
    novoFimSemLimpeza: fimSemLimpeza,
    agendamentosExistentes: existentes,
  });

  if (conflita) {
    ui.toast({
      titulo: "Conflito detectado",
      msg: "Esse intervalo já está ocupado para o barbeiro selecionado.",
      tipo: "danger",
    });
    renderSlotsCliente();
    return;
  }

  const agendamento = {
    id: storage.gerarId("ag"),
    criadoEmIso: new Date().toISOString(),

    clienteUsuarioId: usuario.id,
    clienteNome: usuario.nome,
    clienteWhatsapp: usuario.whatsapp,

    barbeiroId,
    servicoId: servico.id,
    dataYmd,
    inicioIso: inicio.toISOString(),
    fimIso: fimSemLimpeza.toISOString(),
    duracaoMinutos: servico.duracaoMinutos,
    intervaloLimpezaMinutos: scheduler.intervaloLimpezaMinutos,

    valorCentavos: servico.precoCentavos,
    metodoPagamento,
    statusPagamento: "Pendente",
    pagoEmIso: null,
    canceladoEmIso: null,
  };

  state.agendamentos.push(agendamento);
  salvarAgendamentos();

  ui.toast({ titulo: "Agendamento criado", msg: "Horário reservado com sucesso.", tipo: "ok" });

  if (metodoPagamento === "Pix") {
    abrirModalPix(agendamento);
  }

  renderClienteHistorico();
  renderSlotsCliente();
}

function abrirModalPix(agendamento) {
  const chave = "navalha-pix-chave-ficticia";
  const id = agendamento.id;
  el.pixChave.textContent = chave;
  el.pixValor.textContent = scheduler.formatarMoedaBR(agendamento.valorCentavos);
  el.pixId.textContent = id;
  desenharQrFicticio(el.pixCanvas, `${chave}|${id}|${agendamento.valorCentavos}`);
  el.modalPix.showModal();
}

function desenharQrFicticio(canvas, payload) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const n = 29;
  const pad = 10;
  const size = Math.min(canvas.width, canvas.height);
  const cell = Math.floor((size - pad * 2) / n);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 0;
  for (let i = 0; i < payload.length; i++) seed = (seed * 31 + payload.charCodeAt(i)) >>> 0;

  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const desenharFinder = (x, y) => {
    ctx.fillStyle = "#111827";
    ctx.fillRect(x, y, cell * 7, cell * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + cell, y + cell, cell * 5, cell * 5);
    ctx.fillStyle = "#111827";
    ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
  };

  const startX = pad;
  const startY = pad;
  desenharFinder(startX, startY);
  desenharFinder(startX + cell * (n - 7), startY);
  desenharFinder(startX, startY + cell * (n - 7));

  ctx.fillStyle = "#111827";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= n - 7 && y < 7) ||
        (x < 7 && y >= n - 7);
      if (inFinder) continue;

      const on = rand() > 0.55;
      if (!on) continue;
      ctx.fillRect(startX + x * cell, startY + y * cell, cell, cell);
    }
  }
}

function configurarDefaultsAdmin() {
  if (!el.adminData.value) el.adminData.value = obterHojeYmd();
  if (!el.adminBarbeiro.value) el.adminBarbeiro.value = "Todos";
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

  el.kpiTotal.textContent = scheduler.formatarMoedaBR(somaTotal);
  el.kpiPix.textContent = scheduler.formatarMoedaBR(somaPix);
  el.kpiDinheiro.textContent = scheduler.formatarMoedaBR(somaDinheiro);
  el.kpiCartao.textContent = scheduler.formatarMoedaBR(somaCartao);
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
    tr.innerHTML = `<td colspan="8" style="color:var(--muted)">Nenhum agendamento no filtro atual.</td>`;
    el.adminAgendamentosBody.appendChild(tr);
  }
}

function marcarPago(agendamentoId) {
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a) return;
  if (a.statusPagamento === "Cancelado") {
    ui.toast({ titulo: "Não permitido", msg: "Agendamento cancelado não pode ser marcado como pago.", tipo: "warn" });
    return;
  }

  a.statusPagamento = "Pago";
  a.pagoEmIso = new Date().toISOString();
  salvarAgendamentos();
  ui.toast({ titulo: "Pagamento confirmado", msg: `Recebimento registrado às ${new Date(a.pagoEmIso).toLocaleTimeString("pt-BR")}.`, tipo: "ok" });
  renderAdmin();
}

async function cancelarAgendamento(agendamentoId) {
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
  salvarAgendamentos();
  ui.toast({ titulo: "Cancelado", msg: "O horário foi liberado.", tipo: "warn" });

  renderAdmin();
  if (obterUsuarioAtual()?.nivelAcesso === "Cliente") {
    renderSlotsCliente();
    renderClienteHistorico();
  }
}

function wireEvents() {
  el.btnLogout.addEventListener("click", () => {
    setSessao(null);
    ui.toast({ titulo: "Sessão encerrada", msg: "Você saiu do sistema.", tipo: "ok" });
    renderViews();
  });

  const limparErrosLogin = () => {
    ui.setFieldHelp(el.loginEmailHelp, "");
    ui.setFieldHelp(el.loginSenhaHelp, "");
  };
  el.loginEmail.addEventListener("input", limparErrosLogin);
  el.loginSenha.addEventListener("input", limparErrosLogin);

  el.btnPreencherDemo.addEventListener("click", () => {
    el.loginEmail.value = "usuario@navalha.com";
    el.loginSenha.value = "1234";
    limparErrosLogin();
  });

  el.btnLoginAdmin.addEventListener("click", () => {
    el.loginEmail.value = "admin@navalha.com";
    el.loginSenha.value = "1234";
    el.formLogin.requestSubmit();
  });
  el.btnLoginUsuario.addEventListener("click", () => {
    el.loginEmail.value = "usuario@navalha.com";
    el.loginSenha.value = "1234";
    el.formLogin.requestSubmit();
  });

  el.formLogin.addEventListener("submit", (ev) => {
    ev.preventDefault();
    limparErrosLogin();

    const email = el.loginEmail.value;
    const senha = el.loginSenha.value;
    const { ok, usuario } = validarLogin({ email, senha });

    if (!ok) {
      ui.setFieldHelp(el.loginSenhaHelp, "E-mail ou senha inválidos.", true);
      ui.toast({ titulo: "Falha no login", msg: "Verifique suas credenciais.", tipo: "danger" });
      return;
    }

    setSessao(usuario);
    ui.toast({ titulo: "Bem-vindo", msg: `Acesso liberado como ${usuario.nivelAcesso}.`, tipo: "ok" });
    renderViews();
  });

  el.clienteBarbeiro.addEventListener("change", () => {
    state.clienteSelecionado.barbeiroId = el.clienteBarbeiro.value || null;
    renderSlotsCliente();
  });
  el.clienteData.addEventListener("change", () => {
    state.clienteSelecionado.dataYmd = el.clienteData.value || null;
    renderSlotsCliente();
  });
  el.clienteServico.addEventListener("change", () => {
    state.clienteSelecionado.servicoId = el.clienteServico.value || null;
    atualizarResumoCliente();
    renderSlotsCliente();
  });
  el.clientePagamento.addEventListener("change", () => {
    state.clienteSelecionado.metodoPagamento = el.clientePagamento.value;
  });
  el.btnAgendar.addEventListener("click", () => agendarHorario());

  // Tabs Cliente
  el.tabClienteAgendar.addEventListener("click", () => setClienteTab("Agendar"));
  el.tabClienteHistorico.addEventListener("click", () => {
    setClienteTab("Historico");
    renderClienteHistorico();
  });

  // Tabs Admin
  el.tabAdminDashboard.addEventListener("click", () => setAdminTab("Dashboard"));
  el.tabAdminAgenda.addEventListener("click", () => {
    setAdminTab("Agenda");
    renderAdmin();
  });

  el.adminData.addEventListener("change", () => renderAdmin());
  el.adminBarbeiro.addEventListener("change", () => renderAdmin());
  el.btnAdminHoje.addEventListener("click", () => {
    el.adminData.value = obterHojeYmd();
    renderAdmin();
  });
}

function inicializarEstadoClienteInputs() {
  state.clienteSelecionado.barbeiroId = el.clienteBarbeiro.value || null;
  state.clienteSelecionado.dataYmd = el.clienteData.value || null;
  state.clienteSelecionado.servicoId = el.clienteServico.value || null;
  state.clienteSelecionado.metodoPagamento = el.clientePagamento.value || "Pix";
}

function boot() {
  carregarSelects();
  wireEvents();

  if (state.sessao) {
    const usuario = obterUsuarioAtual();
    if (!usuario) setSessao(null);
  }

  el.clienteData.min = obterHojeYmd();
  el.adminData.value = obterHojeYmd();

  // Restaurar abas
  setClienteTab(localStorage.getItem("navalha_ui_clienteTab") || "Agendar");
  setAdminTab(localStorage.getItem("navalha_ui_adminTab") || "Dashboard");

  inicializarEstadoClienteInputs();
  renderViews();
}

boot();

