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

  barbeiroSemanaOffset: Number(localStorage.getItem("navalha_ui_barberWeekOffset") || "0") || 0,

  pixModalAgendamentoId: null,
  boletoModalAgendamentoId: null,
};

function migrarAgendamento(a) {
  if (a.concluidoEmIso === undefined) a.concluidoEmIso = null;
  if (!Array.isArray(a.historicoLog)) a.historicoLog = [];
  return a;
}

state.agendamentos = state.agendamentos.map(migrarAgendamento);
storage.salvarAgendamentos(state.agendamentos);

/** Evita rolar a página durante o boot inicial (várias abas são “aplicadas” antes do primeiro paint). */
let bootNavegacaoConcluido = false;

const el = {
  mainContent: ui.qs("#mainContent"),
  viewLogin: ui.qs("#viewLogin"),
  viewCliente: ui.qs("#viewCliente"),
  viewBarbeiro: ui.qs("#viewBarbeiro"),

  appSubNav: ui.qs("#appSubNav"),
  navCrumb: ui.qs("#navCrumb"),
  navCrumbList: ui.qs("#navCrumbList"),

  sessionChip: ui.qs("#sessionChip"),
  sessionChipLabel: ui.qs("#sessionChipLabel"),
  btnLogout: ui.qs("#btnLogout"),

  formLogin: ui.qs("#formLogin"),
  loginEmail: ui.qs("#loginEmail"),
  loginSenha: ui.qs("#loginSenha"),
  loginEmailHelp: ui.qs("#loginEmailHelp"),
  loginSenhaHelp: ui.qs("#loginSenhaHelp"),
  btnPreencherDemo: ui.qs("#btnPreencherDemo"),
  btnLoginUsuario: ui.qs("#btnLoginUsuario"),
  btnLoginBarbeiro: ui.qs("#btnLoginBarbeiro"),

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

  barbeiroViewSemana: ui.qs("#barbeiroViewSemana"),
  barbeiroViewHoje: ui.qs("#barbeiroViewHoje"),
  barbeiroSemanaLabel: ui.qs("#barbeiroSemanaLabel"),
  barbeiroWeekGrid: ui.qs("#barbeiroWeekGrid"),
  barbeiroHojeList: ui.qs("#barbeiroHojeList"),
  btnBarbeiroSemanaPrev: ui.qs("#btnBarbeiroSemanaPrev"),
  btnBarbeiroSemanaNext: ui.qs("#btnBarbeiroSemanaNext"),

  modalPix: ui.qs("#modalPix"),
  pixCanvas: ui.qs("#pixCanvas"),
  pixChave: ui.qs("#pixChave"),
  pixId: ui.qs("#pixId"),
  pixPanelPagamento: ui.qs("#pixPanelPagamento"),
  pixPanelSucesso: ui.qs("#pixPanelSucesso"),
  pixValorGrande: ui.qs("#pixValorGrande"),
  pixIdResumo: ui.qs("#pixIdResumo"),
  pixCopiaPayload: ui.qs("#pixCopiaPayload"),
  pixSucessoValor: ui.qs("#pixSucessoValor"),
  btnPixFechar: ui.qs("#btnPixFechar"),
  btnPixCopiarPayload: ui.qs("#btnPixCopiarPayload"),
  btnPixCopiarChave: ui.qs("#btnPixCopiarChave"),
  btnPixSimularPago: ui.qs("#btnPixSimularPago"),
  btnPixDeixarPendente: ui.qs("#btnPixDeixarPendente"),
  btnPixSucessoOk: ui.qs("#btnPixSucessoOk"),

  modalBoleto: ui.qs("#modalBoleto"),
  boletoValorGrande: ui.qs("#boletoValorGrande"),
  boletoLinha: ui.qs("#boletoLinha"),
  btnBoletoFechar: ui.qs("#btnBoletoFechar"),
  btnBoletoCopiar: ui.qs("#btnBoletoCopiar"),
  btnBoletoSimularPago: ui.qs("#btnBoletoSimularPago"),
  btnBoletoPendente: ui.qs("#btnBoletoPendente"),

  modalClienteDetalhe: ui.qs("#modalClienteDetalhe"),
  cliDetTitulo: ui.qs("#cliDetTitulo"),
  cliDetSub: ui.qs("#cliDetSub"),
  cliDetWhatsapp: ui.qs("#cliDetWhatsapp"),
  cliDetEmail: ui.qs("#cliDetEmail"),
  cliDetTotal: ui.qs("#cliDetTotal"),
  cliDetUltima: ui.qs("#cliDetUltima"),
  cliDetHistoricoBody: ui.qs("#cliDetHistoricoBody"),

  modalEditarAgendamento: ui.qs("#modalEditarAgendamento"),
  formEditarAgendamento: ui.qs("#formEditarAgendamento"),
  editAgSub: ui.qs("#editAgSub"),
  editAgId: ui.qs("#editAgId"),
  editAgServico: ui.qs("#editAgServico"),
  editAgData: ui.qs("#editAgData"),
  editAgHora: ui.qs("#editAgHora"),
  editAgValorField: ui.qs("#editAgValorField"),
  editAgValor: ui.qs("#editAgValor"),
  editAgValorHelp: ui.qs("#editAgValorHelp"),
  btnEditAgFechar: ui.qs("#btnEditAgFechar"),
  btnEditAgCancelar: ui.qs("#btnEditAgCancelar"),
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

function obterBarbeiroIdDoUsuario(usuario) {
  if (!usuario || usuario.nivelAcesso !== "Barbeiro") return null;
  return usuario.barbeiroId || null;
}

function podeGerenciarAgendamento(usuario, ag) {
  if (!usuario || !ag) return false;
  if (usuario.nivelAcesso === "Admin") return true;
  if (usuario.nivelAcesso === "Barbeiro") return usuario.barbeiroId === ag.barbeiroId;
  return false;
}

function formatarDataYmdParaBR(ymd) {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function dataYmdDeDate(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function inicioSemanaSegunda(base = new Date()) {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

function somarDias(date, dias) {
  const x = new Date(date.getTime());
  x.setDate(x.getDate() + dias);
  return x;
}

function nomeDiaSemanaCurto(data) {
  return data.toLocaleDateString("pt-BR", { weekday: "short" });
}

function logAgendamento(ag, msg) {
  ag.historicoLog.push(`${new Date().toISOString()} — ${msg}`);
}

function gerarPixCopiaEColaDemo({ chave, agId, valorCentavos }) {
  const valorFmt = scheduler.formatarMoedaBR(valorCentavos);
  return `[Demonstração — não é código Pix real]\nReferência: ${agId}\nValor: ${valorFmt}\nChave: ${chave}\nEm produção: payload EMV gerado pelo PSP/banco.`;
}

async function copiarParaAreaDeTransferencia(texto) {
  const t = String(texto || "");
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
    ui.toast({ titulo: "Copiado", msg: "Conteúdo na área de transferência.", tipo: "ok" });
  } catch {
    ui.toast({
      titulo: "Copie manualmente",
      msg: "Seu navegador não permitiu acesso à área de transferência.",
      tipo: "warn",
    });
  }
}

function registrarPagamentoDemo(agendamentoId, msgLog) {
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a || a.statusPagamento === "Cancelado") return false;
  if (a.statusPagamento === "Pago") return true;
  a.statusPagamento = "Pago";
  a.pagoEmIso = new Date().toISOString();
  logAgendamento(a, msgLog);
  salvarAgendamentos();
  return true;
}

function refrescarAposPagamentoDemo() {
  const u = obterUsuarioAtual();
  if (u?.nivelAcesso === "Cliente") renderClienteHistorico();
}

function resetPainelPixModal() {
  state.pixModalAgendamentoId = null;
  el.pixPanelPagamento.hidden = false;
  el.pixPanelSucesso.hidden = true;
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

  ui.limpar(el.clienteServico);
  el.clienteServico.appendChild(optPadrao("Selecione..."));
  for (const s of state.servicos) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.nome} • ${s.duracaoMinutos} min • ${scheduler.formatarMoedaBR(s.precoCentavos)}`;
    el.clienteServico.appendChild(o);
  }
}

function preencherSelectServicos(targetSelect) {
  ui.limpar(targetSelect);
  for (const s of state.servicos) {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.nome} (${s.duracaoMinutos} min)`;
    targetSelect.appendChild(o);
  }
}

function rolagemTopoApp() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncAppSubNavActive() {
  const usuario = obterUsuarioAtual();
  if (!usuario || el.appSubNav.hidden) return;

  let key = "";
  if (usuario.nivelAcesso === "Cliente") {
    const t = localStorage.getItem("navalha_ui_clienteTab") || "Agendar";
    key = `cliente:${t === "Historico" ? "Historico" : "Agendar"}`;
  } else if (usuario.nivelAcesso === "Barbeiro") {
    const t = localStorage.getItem("navalha_ui_barberTab") || "Semana";
    key = `barbeiro:${t === "Hoje" ? "Hoje" : "Semana"}`;
  }

  el.appSubNav.querySelectorAll(".appSubNavBtn").forEach((btn) => {
    const on = btn.dataset.nav === key;
    btn.classList.toggle("isActive", on);
    btn.setAttribute("aria-current", on ? "page" : "false");
  });
}

function atualizarMigalhas() {
  const usuario = obterUsuarioAtual();
  ui.limpar(el.navCrumbList);
  if (!usuario || el.navCrumb.hidden) return;

  const push = (texto, atual = false) => {
    const li = document.createElement("li");
    li.className = "navCrumbItem";
    if (atual) {
      li.appendChild(document.createTextNode(texto));
      li.classList.add("navCrumbItemCurrent");
      li.setAttribute("aria-current", "page");
    } else {
      li.textContent = texto;
    }
    el.navCrumbList.appendChild(li);
  };

  push("Navalha");

  if (usuario.nivelAcesso === "Cliente") {
    push("Cliente");
    const t = localStorage.getItem("navalha_ui_clienteTab") || "Agendar";
    push(t === "Historico" ? "Histórico" : "Agendar", true);
  } else if (usuario.nivelAcesso === "Barbeiro") {
    push("Barbeiro");
    const t = localStorage.getItem("navalha_ui_barberTab") || "Semana";
    push(t === "Hoje" ? "Hoje" : "Semana", true);
  }
}

function refreshNavegacaoContexto() {
  syncAppSubNavActive();
  atualizarMigalhas();
  if (bootNavegacaoConcluido) rolagemTopoApp();
}

function renderAppNavigation() {
  const usuario = obterUsuarioAtual();
  if (!usuario) {
    document.documentElement.classList.remove("hasAppSubNav");
    el.appSubNav.hidden = true;
    el.navCrumb.hidden = true;
    el.appSubNav.replaceChildren();
    ui.limpar(el.navCrumbList);
    return;
  }

  document.documentElement.classList.add("hasAppSubNav");
  el.appSubNav.hidden = false;
  el.navCrumb.hidden = false;

  const track = document.createElement("div");
  track.className = "appSubNavTrack";

  const mk = (dataNav, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "appSubNavBtn";
    b.dataset.nav = dataNav;
    b.textContent = label;
    track.appendChild(b);
  };

  if (usuario.nivelAcesso === "Cliente") {
    mk("cliente:Agendar", "Agendar");
    mk("cliente:Historico", "Histórico");
  } else if (usuario.nivelAcesso === "Barbeiro") {
    mk("barbeiro:Semana", "Semana");
    mk("barbeiro:Hoje", "Hoje");
  }

  el.appSubNav.replaceChildren(track);
  syncAppSubNavActive();
  atualizarMigalhas();
}

function setClienteTab(tab) {
  const t = tab === "Historico" ? "Historico" : "Agendar";
  localStorage.setItem("navalha_ui_clienteTab", t);
  const isAgendar = t === "Agendar";
  ui.setHidden(el.clienteViewAgendar, !isAgendar);
  ui.setHidden(el.clienteViewHistorico, isAgendar);
  if (isAgendar) {
    renderSlotsCliente();
  } else {
    renderClienteHistorico();
  }
  refreshNavegacaoContexto();
}

function setBarbeiroTab(tab) {
  const t = tab === "Hoje" ? "Hoje" : "Semana";
  localStorage.setItem("navalha_ui_barberTab", t);
  const semana = t === "Semana";
  ui.setHidden(el.barbeiroViewSemana, !semana);
  ui.setHidden(el.barbeiroViewHoje, semana);
  if (semana) renderBarbeiroSemana();
  else renderBarbeiroHoje();
  refreshNavegacaoContexto();
}

function renderSessaoTopBar() {
  const usuario = obterUsuarioAtual();
  if (!usuario) {
    ui.setHidden(el.sessionChip, true);
    return;
  }
  ui.setHidden(el.sessionChip, false);
  const extra = usuario.nivelAcesso === "Barbeiro" ? ` • ${obterBarbeiroPorId(usuario.barbeiroId)?.nome ?? ""}` : "";
  el.sessionChipLabel.textContent = `${usuario.nome} • ${usuario.nivelAcesso}${extra}`;
}

function renderViews() {
  const usuario = obterUsuarioAtual();
  if (usuario?.nivelAcesso === "Admin") {
    window.location.href = new URL("admin/index.html", window.location.href).href;
    return;
  }

  const logado = Boolean(usuario);

  ui.setHidden(el.viewLogin, logado);
  ui.setHidden(el.viewCliente, !logado || usuario.nivelAcesso !== "Cliente");
  ui.setHidden(el.viewBarbeiro, !logado || usuario.nivelAcesso !== "Barbeiro");

  renderSessaoTopBar();
  renderAppNavigation();
  if (!usuario) return;

  if (usuario.nivelAcesso === "Cliente") {
    renderClienteHistorico();
    configurarDefaultsCliente();
    inicializarEstadoClienteInputs();
    atualizarResumoCliente();
    renderSlotsCliente();
  } else if (usuario.nivelAcesso === "Barbeiro") {
    renderBarbeiroSemana();
    renderBarbeiroHoje();
  }
}

function configurarDefaultsCliente() {
  if (!el.clienteData.value) el.clienteData.value = obterHojeYmd();
  if (!el.clienteBarbeiro.value && state.barbeiros.length > 0) el.clienteBarbeiro.value = state.barbeiros[0].id;
  if (!el.clienteServico.value && state.servicos.length > 0) el.clienteServico.value = state.servicos[0].id;
}

function obterHojeYmd() {
  return dataYmdDeDate(new Date());
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

function listarAgendamentosDoBarbeiro(barbeiroId) {
  return state.agendamentos.filter((a) => a.barbeiroId === barbeiroId);
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

  if (!scheduler.ehDiaUtil(dataYmd)) {
    ui.setFieldHelp(
      el.slotsHelp,
      "Agendamentos só são permitidos de segunda a sexta. Escolha outra data.",
      true
    );
    return;
  }

  const existentes = listarAgendamentosPorBarbeiroDia({ barbeiroId, dataYmd });
  const slots = scheduler.gerarSlotsDia({ dataYmd, duracaoMinutos: servico.duracaoMinutos });

  let primeiroLivreBtn = null;
  for (const s of slots) {
    const hora = scheduler.formatarHora(s.inicio);
    const okAntecedencia = scheduler.antecedenciaRespeitada({ inicio: s.inicio });
    const conflita = scheduler.verificarConflito({
      novoInicio: s.inicio,
      novoFimSemLimpeza: s.fimSemLimpeza,
      agendamentosExistentes: existentes,
    });
    const desabilitado = s.noPassado || conflita || !okAntecedencia;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `slot${desabilitado ? " isDisabled" : ""}`;
    btn.setAttribute("role", "listitem");
    btn.dataset.hora = hora;
    btn.disabled = desabilitado;

    let meta = "Livre";
    if (conflita) meta = "Ocupado";
    else if (s.noPassado) meta = "Passado";
    else if (!okAntecedencia) meta = "< 1h";

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

  if (primeiroLivreBtn) {
    ui.setFieldHelp(el.slotsHelp, "Dica: o primeiro horário livre está pronto para seleção.");
    window.setTimeout(() => {
      el.clienteHorariosField?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  } else {
    ui.setFieldHelp(el.slotsHelp, "Sem horários livres para este filtro. Tente outra data/serviço.", true);
  }
}

function pillAtendimento(ag) {
  if (ag.statusPagamento === "Cancelado") return `<span class="pill pillDanger">Cancelado</span>`;
  if (ag.concluidoEmIso)
    return `<span class="pill pillOk">Concluído</span><div class="slotMeta" style="margin-top:4px">${new Date(
      ag.concluidoEmIso
    ).toLocaleString("pt-BR")}</div>`;
  return `<span class="pill pillMuted">Agendado</span>`;
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
      <td>${pillAtendimento(a)}</td>
    `;
    el.clienteHistoricoBody.appendChild(tr);
  }
  if (meus.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" style="color:var(--muted)">Nenhum agendamento ainda.</td>`;
    el.clienteHistoricoBody.appendChild(tr);
  }
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

  if (!scheduler.ehDiaUtil(dataYmd)) {
    ui.toast({ titulo: "Data inválida", msg: "Use um dia útil (segunda a sexta).", tipo: "danger" });
    renderSlotsCliente();
    return;
  }

  const inicio = scheduler.criarDataLocalPorDiaHora(dataYmd, hora);
  if (!scheduler.antecedenciaRespeitada({ inicio })) {
    ui.toast({
      titulo: "Antecedência mínima",
      msg: `É necessário agendar com pelo menos ${scheduler.antecedenciaAgendamentoMinutos} minutos de antecedência.`,
      tipo: "danger",
    });
    renderSlotsCliente();
    return;
  }

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
    concluidoEmIso: null,
    historicoLog: [],
  };

  logAgendamento(agendamento, "Criado pelo cliente");

  state.agendamentos.push(agendamento);
  salvarAgendamentos();

  ui.toast({ titulo: "Agendamento criado", msg: "Horário reservado com sucesso.", tipo: "ok" });

  if (metodoPagamento === "Pix") abrirModalPix(agendamento);
  if (metodoPagamento === "Boleto") abrirModalBoleto(agendamento);

  renderClienteHistorico();
  renderSlotsCliente();
}

function abrirModalPix(agendamento) {
  state.pixModalAgendamentoId = agendamento.id;
  el.pixPanelPagamento.hidden = false;
  el.pixPanelSucesso.hidden = true;

  const chave = "navalha@demo-pix.com.br";
  const id = agendamento.id;
  el.pixChave.textContent = chave;
  el.pixValorGrande.textContent = scheduler.formatarMoedaBR(agendamento.valorCentavos);
  el.pixId.textContent = id;
  el.pixIdResumo.textContent = `Pedido · ${id.length > 12 ? "…" + id.slice(-10) : id}`;
  el.pixCopiaPayload.value = gerarPixCopiaEColaDemo({
    chave,
    agId: id,
    valorCentavos: agendamento.valorCentavos,
  });
  desenharQrFicticio(el.pixCanvas, `${chave}|${id}|${agendamento.valorCentavos}`);
  el.modalPix.showModal();
}

function abrirModalBoleto(ag) {
  state.boletoModalAgendamentoId = ag.id;
  el.boletoValorGrande.textContent = scheduler.formatarMoedaBR(ag.valorCentavos);
  const base = ag.id.replace(/\D/g, "").slice(-14).padStart(14, "0");
  el.boletoLinha.textContent = `23793.38128 ${base.slice(0, 5)}.${base.slice(5)} ${base}1 8 ${String(
    ag.valorCentavos
  ).padStart(10, "0")}12`;
  el.modalBoleto.showModal();
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
      const inFinder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (inFinder) continue;

      const on = rand() > 0.55;
      if (!on) continue;
      ctx.fillRect(startX + x * cell, startY + y * cell, cell, cell);
    }
  }
}

function obterSegundaDaSemanaCorrente() {
  const base = inicioSemanaSegunda(new Date());
  return somarDias(base, state.barbeiroSemanaOffset * 7);
}

function atualizarLabelSemanaBarbeiro() {
  const mon = obterSegundaDaSemanaCorrente();
  const fri = somarDias(mon, 4);
  el.barbeiroSemanaLabel.textContent = `${formatarDataYmdParaBR(dataYmdDeDate(mon))} — ${formatarDataYmdParaBR(
    dataYmdDeDate(fri)
  )}`;
}

function renderBarbeiroSemana() {
  const usuario = obterUsuarioAtual();
  const bid = obterBarbeiroIdDoUsuario(usuario);
  if (!bid) return;

  atualizarLabelSemanaBarbeiro();
  ui.limpar(el.barbeiroWeekGrid);

  const mon = obterSegundaDaSemanaCorrente();
  for (let i = 0; i < 5; i++) {
    const dia = somarDias(mon, i);
    const ymd = dataYmdDeDate(dia);

    const col = document.createElement("div");
    col.className = "weekDay";
    col.innerHTML = `
      <div class="weekDayTitle">${nomeDiaSemanaCurto(dia)}</div>
      <div class="weekDayDate">${formatarDataYmdParaBR(ymd)}</div>
    `;

    const lista = listarAgendamentosPorBarbeiroDia({ barbeiroId: bid, dataYmd: ymd })
      .filter((a) => a.statusPagamento !== "Cancelado")
      .slice()
      .sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));

    if (lista.length === 0) {
      const empty = document.createElement("div");
      empty.className = "slotMeta";
      empty.textContent = "Sem horários";
      col.appendChild(empty);
    } else {
      for (const a of lista) {
        const servico = obterServicoPorId(a.servicoId);
        const inicio = new Date(a.inicioIso);
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "apptChip";
        chip.innerHTML = `${scheduler.formatarHora(inicio)} • ${a.clienteNome}<span class="apptChipMeta">${servico?.nome ?? "—"} • ${formatarMetodoPagamentoLabel(
          a.metodoPagamento
        )}</span>`;
        chip.addEventListener("click", () => abrirMenuBarbeiroAgendamento(a));
        col.appendChild(chip);
      }
    }

    el.barbeiroWeekGrid.appendChild(col);
  }
}

function renderBarbeiroHoje() {
  const usuario = obterUsuarioAtual();
  const bid = obterBarbeiroIdDoUsuario(usuario);
  if (!bid) return;

  const hoje = obterHojeYmd();
  const lista = listarAgendamentosPorBarbeiroDia({ barbeiroId: bid, dataYmd: hoje })
    .filter((a) => a.statusPagamento !== "Cancelado")
    .slice()
    .sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));

  ui.limpar(el.barbeiroHojeList);
  if (lista.length === 0) {
    el.barbeiroHojeList.innerHTML = `<div class="hint">Nenhum agendamento para hoje.</div>`;
    return;
  }

  for (const a of lista) {
    const servico = obterServicoPorId(a.servicoId);
    const inicio = new Date(a.inicioIso);
    const item = document.createElement("div");
    item.className = "listItem";

    const main = document.createElement("div");
    main.className = "listItemMain";
    main.innerHTML = `
      <div class="listItemTitle">${scheduler.formatarHora(inicio)} • ${a.clienteNome}</div>
      <div class="listItemMeta">${servico?.nome ?? "—"} • ${scheduler.formatarMoedaBR(a.valorCentavos)} • ${formatarMetodoPagamentoLabel(
      a.metodoPagamento
    )} • ${a.concluidoEmIso ? "Concluído" : "Aberto"}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "row";

    const btnDet = document.createElement("button");
    btnDet.type = "button";
    btnDet.className = "btn btnGhost btnSm";
    btnDet.textContent = "Cliente";
    btnDet.addEventListener("click", () => abrirDetalheCliente(a.clienteUsuarioId));

    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "btn btnGhost btnSm";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", () => abrirModalEditarAgendamento(a));

    const btnOk = document.createElement("button");
    btnOk.type = "button";
    btnOk.className = "btn btnPrimary btnSm";
    btnOk.textContent = a.concluidoEmIso ? "Concluído" : "Concluir";
    btnOk.disabled = Boolean(a.concluidoEmIso);
    btnOk.addEventListener("click", () => marcarConcluidoBarbeiro(a.id));

    const btnCan = document.createElement("button");
    btnCan.type = "button";
    btnCan.className = "btn btnDanger btnSm";
    btnCan.textContent = "Cancelar";
    btnCan.addEventListener("click", () => cancelarAgendamento(a.id));

    actions.appendChild(btnDet);
    actions.appendChild(btnEdit);
    actions.appendChild(btnOk);
    actions.appendChild(btnCan);

    item.appendChild(main);
    item.appendChild(actions);
    el.barbeiroHojeList.appendChild(item);
  }
}

function abrirMenuBarbeiroAgendamento(ag) {
  void (async () => {
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML = `
      <form method="dialog" class="modalCard">
        <div class="modalHeader">
          <div>
            <div class="modalTitle">Agendamento</div>
            <div class="modalSubtitle">${formatarDataYmdParaBR(ag.dataYmd)} • ${scheduler.formatarHora(
              new Date(ag.inicioIso)
            )} • ${ag.clienteNome}</div>
          </div>
          <button type="submit" class="btn btnGhost btnSm" value="fechar">Fechar</button>
        </div>
        <div class="modalBody">
          <div class="row" style="flex-wrap:wrap; justify-content:flex-end">
            <button type="submit" class="btn btnGhost btnSm" value="cli">Cliente</button>
            <button type="submit" class="btn btnGhost btnSm" value="edit">Editar</button>
            <button type="submit" class="btn btnPrimary btnSm" value="done">Concluir</button>
            <button type="submit" class="btn btnDanger btnSm" value="cancel">Cancelar</button>
          </div>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("close", async () => {
      const v = dlg.returnValue;
      dlg.remove();
      if (v === "cli") abrirDetalheCliente(ag.clienteUsuarioId);
      if (v === "edit") abrirModalEditarAgendamento(ag);
      if (v === "done") marcarConcluidoBarbeiro(ag.id);
      if (v === "cancel") await cancelarAgendamento(ag.id);
    });
    dlg.showModal();
  })();
}

function abrirDetalheCliente(clienteUsuarioId) {
  const u = state.usuarios.find((x) => x.id === clienteUsuarioId);
  const ags = state.agendamentos
    .filter((a) => a.clienteUsuarioId === clienteUsuarioId)
    .slice()
    .sort((a, b) => new Date(b.inicioIso) - new Date(a.inicioIso));

  el.cliDetTitulo.textContent = u?.nome || "Cliente";
  el.cliDetSub.textContent = u ? `Perfil local (demo) — ID ${u.id}` : "Cliente não encontrado no cadastro local.";
  el.cliDetWhatsapp.textContent = u?.whatsapp || ags[0]?.clienteWhatsapp || "—";
  el.cliDetEmail.textContent = u?.email || "—";
  el.cliDetTotal.textContent = String(ags.length);
  el.cliDetUltima.textContent = ags.length ? formatarDataYmdParaBR(ags[0].dataYmd) : "—";

  ui.limpar(el.cliDetHistoricoBody);
  for (const a of ags.slice(0, 8)) {
    const servico = obterServicoPorId(a.servicoId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatarDataYmdParaBR(a.dataYmd)}</td>
      <td>${servico?.nome ?? "—"}</td>
      <td>${renderPillStatus(a.statusPagamento)}</td>
    `;
    el.cliDetHistoricoBody.appendChild(tr);
  }
  if (ags.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" style="color:var(--muted)">Sem histórico.</td>`;
    el.cliDetHistoricoBody.appendChild(tr);
  }

  el.modalClienteDetalhe.showModal();
}

function abrirModalEditarAgendamento(ag) {
  const usuario = obterUsuarioAtual();
  if (!podeGerenciarAgendamento(usuario, ag)) {
    ui.toast({ titulo: "Sem permissão", msg: "Você não pode editar este agendamento.", tipo: "danger" });
    return;
  }
  if (ag.statusPagamento === "Cancelado") {
    ui.toast({ titulo: "Cancelado", msg: "Não é possível editar um agendamento cancelado.", tipo: "warn" });
    return;
  }

  preencherSelectServicos(el.editAgServico);
  el.editAgId.value = ag.id;
  el.editAgServico.value = ag.servicoId;
  el.editAgData.value = ag.dataYmd;
  el.editAgHora.value = scheduler.formatarHora(new Date(ag.inicioIso));
  el.editAgValor.value = formatarCentavosInputBR(ag.valorCentavos);
  ui.setFieldHelp(el.editAgValorHelp, "");

  const ehDinheiro = ag.metodoPagamento === "Dinheiro";
  el.editAgValorField.hidden = !ehDinheiro;
  el.editAgSub.textContent = ehDinheiro
    ? "Você pode ajustar o valor cobrado em dinheiro após o atendimento."
    : "Altere serviço, data ou hora. Conflitos são validados automaticamente.";

  el.modalEditarAgendamento.showModal();
}

function fecharModalEditar() {
  el.modalEditarAgendamento.close();
}

function aplicarEdicaoAgendamento(ev) {
  ev.preventDefault();
  const usuario = obterUsuarioAtual();
  const id = el.editAgId.value;
  const ag = state.agendamentos.find((x) => x.id === id);
  if (!ag || !podeGerenciarAgendamento(usuario, ag)) {
    ui.toast({ titulo: "Erro", msg: "Agendamento inválido.", tipo: "danger" });
    return;
  }
  if (ag.statusPagamento === "Cancelado") return;

  const servico = obterServicoPorId(el.editAgServico.value);
  const dataYmd = el.editAgData.value;
  const hora = el.editAgHora.value;
  if (!servico || !dataYmd || !hora) return;

  if (!scheduler.ehDiaUtil(dataYmd)) {
    ui.toast({ titulo: "Data inválida", msg: "Use um dia útil (segunda a sexta).", tipo: "danger" });
    return;
  }

  const inicio = scheduler.criarDataLocalPorDiaHora(dataYmd, hora);
  const fimSemLimpeza = scheduler.somarMinutos(inicio, servico.duracaoMinutos);

  const existentes = listarAgendamentosPorBarbeiroDia({ barbeiroId: ag.barbeiroId, dataYmd }).filter(
    (x) => x.id !== ag.id && x.statusPagamento !== "Cancelado"
  );

  const conflita = scheduler.verificarConflito({
    novoInicio: inicio,
    novoFimSemLimpeza: fimSemLimpeza,
    agendamentosExistentes: existentes,
  });

  if (conflita) {
    ui.toast({ titulo: "Conflito", msg: "O novo horário conflita com outro agendamento.", tipo: "danger" });
    return;
  }

  let valorNovo = ag.valorCentavos;
  if (ag.metodoPagamento === "Dinheiro") {
    const parsed = parseMoedaBRLParaCentavos(el.editAgValor.value);
    if (parsed === null) {
      ui.setFieldHelp(el.editAgValorHelp, "Informe um valor válido (ex.: 45,00).", true);
      return;
    }
    valorNovo = parsed;
    ui.setFieldHelp(el.editAgValorHelp, "");
  } else {
    valorNovo = servico.precoCentavos;
  }

  const mudancas = [];
  if (ag.servicoId !== servico.id) mudancas.push("serviço");
  if (ag.dataYmd !== dataYmd || new Date(ag.inicioIso).getTime() !== inicio.getTime()) mudancas.push("horário");
  if (ag.valorCentavos !== valorNovo) mudancas.push("valor");

  ag.servicoId = servico.id;
  ag.dataYmd = dataYmd;
  ag.inicioIso = inicio.toISOString();
  ag.fimIso = fimSemLimpeza.toISOString();
  ag.duracaoMinutos = servico.duracaoMinutos;
  ag.valorCentavos = valorNovo;

  logAgendamento(ag, `Editado por ${usuario?.nome || "usuário"} (${mudancas.join(", ") || "sem mudança"})`);
  salvarAgendamentos();
  fecharModalEditar();

  ui.toast({ titulo: "Salvo", msg: "Agendamento atualizado.", tipo: "ok" });
  renderBarbeiroSemana();
  renderBarbeiroHoje();
  if (obterUsuarioAtual()?.nivelAcesso === "Cliente") {
    renderClienteHistorico();
    renderSlotsCliente();
  }
}

function marcarConcluidoBarbeiro(agendamentoId) {
  const usuario = obterUsuarioAtual();
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a || !podeGerenciarAgendamento(usuario, a)) return;
  if (a.statusPagamento === "Cancelado") {
    ui.toast({ titulo: "Cancelado", msg: "Agendamento já cancelado.", tipo: "warn" });
    return;
  }
  if (a.concluidoEmIso) {
    ui.toast({ titulo: "Já concluído", msg: "Este atendimento já foi finalizado.", tipo: "warn" });
    return;
  }

  a.concluidoEmIso = new Date().toISOString();
  logAgendamento(a, `Concluído por ${usuario?.nome || "barbeiro"} às ${new Date(a.concluidoEmIso).toLocaleTimeString("pt-BR")}`);
  salvarAgendamentos();
  ui.toast({ titulo: "Concluído", msg: "Atendimento marcado como finalizado.", tipo: "ok" });
  renderBarbeiroSemana();
  renderBarbeiroHoje();
  if (obterUsuarioAtual()?.nivelAcesso === "Cliente") renderClienteHistorico();
}

async function cancelarAgendamento(agendamentoId) {
  const usuario = obterUsuarioAtual();
  const a = state.agendamentos.find((x) => x.id === agendamentoId);
  if (!a) return;
  if (!podeGerenciarAgendamento(usuario, a)) {
    ui.toast({ titulo: "Sem permissão", msg: "Você não pode cancelar este agendamento.", tipo: "danger" });
    return;
  }
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
  logAgendamento(a, `Cancelado por ${usuario?.nome || "usuário"}`);
  salvarAgendamentos();
  ui.toast({ titulo: "Cancelado", msg: "O horário foi liberado.", tipo: "warn" });

  renderBarbeiroSemana();
  renderBarbeiroHoje();
  if (obterUsuarioAtual()?.nivelAcesso === "Cliente") {
    renderSlotsCliente();
    renderClienteHistorico();
  }
}

function wireEvents() {
  document.querySelector(".skipLink")?.addEventListener("click", () => {
    window.requestAnimationFrame(() => {
      el.mainContent?.focus({ preventScroll: true });
    });
  });

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

  el.btnLoginUsuario.addEventListener("click", () => {
    el.loginEmail.value = "usuario@navalha.com";
    el.loginSenha.value = "1234";
    el.formLogin.requestSubmit();
  });
  el.btnLoginBarbeiro.addEventListener("click", () => {
    el.loginEmail.value = "barbeiro@navalha.com";
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
    if (usuario.nivelAcesso === "Admin") {
      ui.toast({ titulo: "Redirecionando", msg: "Abrindo o painel administrativo…", tipo: "ok" });
      window.location.href = new URL("admin/index.html", window.location.href).href;
      return;
    }
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

  el.appSubNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".appSubNavBtn");
    if (!btn?.dataset.nav) return;
    const [area, destino] = btn.dataset.nav.split(":");
    if (area === "cliente") {
      if (destino === "Historico") setClienteTab("Historico");
      else setClienteTab("Agendar");
    } else if (area === "barbeiro") {
      if (destino === "Hoje") setBarbeiroTab("Hoje");
      else setBarbeiroTab("Semana");
    }
  });

  el.btnBarbeiroSemanaPrev.addEventListener("click", () => {
    state.barbeiroSemanaOffset -= 1;
    localStorage.setItem("navalha_ui_barberWeekOffset", String(state.barbeiroSemanaOffset));
    renderBarbeiroSemana();
  });
  el.btnBarbeiroSemanaNext.addEventListener("click", () => {
    state.barbeiroSemanaOffset += 1;
    localStorage.setItem("navalha_ui_barberWeekOffset", String(state.barbeiroSemanaOffset));
    renderBarbeiroSemana();
  });

  el.modalPix.addEventListener("close", () => resetPainelPixModal());
  el.modalBoleto.addEventListener("close", () => {
    state.boletoModalAgendamentoId = null;
  });

  el.btnPixFechar.addEventListener("click", () => el.modalPix.close());
  el.btnPixDeixarPendente.addEventListener("click", () => el.modalPix.close());
  el.btnPixSucessoOk.addEventListener("click", () => el.modalPix.close());

  el.btnPixCopiarPayload.addEventListener("click", () => copiarParaAreaDeTransferencia(el.pixCopiaPayload.value));
  el.btnPixCopiarChave.addEventListener("click", () =>
    copiarParaAreaDeTransferencia(el.pixChave.textContent)
  );

  el.btnPixSimularPago.addEventListener("click", () => {
    const id = state.pixModalAgendamentoId;
    if (!id) return;
    const ok = registrarPagamentoDemo(id, "Pix — pagamento simulado no site (demo)");
    if (!ok) {
      ui.toast({
        titulo: "Não disponível",
        msg: "Não foi possível confirmar (cancelado ou inválido).",
        tipo: "warn",
      });
      return;
    }
    const a = state.agendamentos.find((x) => x.id === id);
    refrescarAposPagamentoDemo();
    el.pixPanelPagamento.hidden = true;
    el.pixPanelSucesso.hidden = false;
    el.pixSucessoValor.textContent = a ? scheduler.formatarMoedaBR(a.valorCentavos) : "";
    ui.toast({ titulo: "Pix simulado", msg: "Status atualizado para Pago neste aparelho.", tipo: "ok" });
  });

  el.btnBoletoFechar.addEventListener("click", () => {
    state.boletoModalAgendamentoId = null;
    el.modalBoleto.close();
  });
  el.btnBoletoPendente.addEventListener("click", () => {
    state.boletoModalAgendamentoId = null;
    el.modalBoleto.close();
  });
  el.btnBoletoCopiar.addEventListener("click", () =>
    copiarParaAreaDeTransferencia(el.boletoLinha.textContent)
  );
  el.btnBoletoSimularPago.addEventListener("click", () => {
    const id = state.boletoModalAgendamentoId;
    if (!id) return;
    const ok = registrarPagamentoDemo(id, "Boleto — compensação simulada no site (demo)");
    if (!ok) {
      ui.toast({ titulo: "Não disponível", msg: "Agendamento cancelado ou inválido.", tipo: "warn" });
      return;
    }
    refrescarAposPagamentoDemo();
    state.boletoModalAgendamentoId = null;
    el.modalBoleto.close();
    ui.toast({ titulo: "Boleto simulado", msg: "Marcado como Pago (demo).", tipo: "ok" });
  });

  el.formEditarAgendamento.addEventListener("submit", aplicarEdicaoAgendamento);
  el.btnEditAgFechar.addEventListener("click", () => fecharModalEditar());
  el.btnEditAgCancelar.addEventListener("click", () => fecharModalEditar());
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
  el.editAgData.min = obterHojeYmd();

  setClienteTab(localStorage.getItem("navalha_ui_clienteTab") || "Agendar");
  setBarbeiroTab(localStorage.getItem("navalha_ui_barberTab") || "Semana");

  inicializarEstadoClienteInputs();
  renderViews();
  bootNavegacaoConcluido = true;
}

boot();
