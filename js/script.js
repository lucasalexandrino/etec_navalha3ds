// --- DATABASE SIMULATION (LocalStorage) ---
const STORAGE_KEYS = {
  servicos: 'barbearia_servicos',
  agendamentos: 'barbearia_agendamentos',
  sessao: 'barbearia_sessao',
  estabelecimentoAberto: 'barbearia_estabelecimento_aberto',
  horaFechamento: 'barbearia_hora_fechamento'
};

const CONFIG = {
  horaLimiteAgendamento: '18:00'
};

const LOGIN_FIXO = {
  cliente: { usuario: 'cliente', senha: '1234' },
  barbeiro: { usuario: 'barbeiro', senha: '1234' }
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function generateId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function normalizeServicoNome(item) {
  if (typeof item === 'string') return { nome: item, preco: 0 };
  if (item && typeof item === 'object') {
    const nome =
      (typeof item.nome === 'string' ? item.nome : null) ||
      (typeof item.name === 'string' ? item.name : null) ||
      (typeof item.servico === 'string' ? item.servico : null) ||
      (typeof item.serviço === 'string' ? item.serviço : null) ||
      (typeof item.titulo === 'string' ? item.titulo : null) ||
      (typeof item.title === 'string' ? item.title : null) ||
      (typeof item.descricao === 'string' ? item.descricao : null) ||
      (typeof item.descrição === 'string' ? item.descrição : null) ||
      (typeof item.label === 'string' ? item.label : null);
    const preco = Number(item.preco) || 0;
    if (typeof nome === 'string') return { nome: nome, preco: preco };
  }
  return null;
}

function normalizeAgendamento(ag) {
  if (!ag || typeof ag !== 'object') return null;

  var nome = String(ag.nome || '').trim();
  var whatsapp = String(ag.whatsapp || '').trim();
  var servico = String(ag.servico || '').trim();
  var data = String(ag.data || '').trim();
  var hora = String(ag.hora || '').trim();
  var id = String(ag.id || generateId());
  var valor = Number(ag.valor || 0);
  var concluido = Boolean(ag.concluido || false);
  var dataAgendamento;

  try {
    if (ag.dataAgendamento && typeof ag.dataAgendamento === 'string') {
      dataAgendamento = new Date(ag.dataAgendamento);
    } else {
      dataAgendamento = new Date();
    }
  } catch (e) {
    dataAgendamento = new Date();
  }

  if (!nome || !whatsapp || !servico || !data || !hora) {
    return null;
  }

  return {
    id: id,
    nome: nome,
    whatsapp: whatsapp,
    servico: servico,
    data: data,
    hora: hora,
    valor: valor,
    concluido: concluido,
    dataAgendamento: dataAgendamento.toISOString ? dataAgendamento.toISOString() : new Date().toISOString()
  };
}

const DB = {
  getServicos: () => {
    const raw = safeParse(localStorage.getItem(STORAGE_KEYS.servicos), ['Corte Social', 'Barba', 'Combo']);
    const lista = Array.isArray(raw) ? raw : ['Corte Social', 'Barba', 'Combo'];
    let changed = false;

    const normalized = lista
      .map((item) => {
        const servico = normalizeServicoNome(item);
        if (!servico || !servico.nome) return null;
        if (typeof item === 'string') changed = true;
        return { nome: servico.nome.trim(), preco: Number(servico.preco) || 0 };
      })
      .filter(Boolean);

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.servicos, JSON.stringify(normalized));
    }
    return normalized;
  },
  saveServico: (nome, preco) => {
    const s = DB.getServicos();
    s.push({ nome: nome.trim(), preco: Number(preco) || 0 });
    localStorage.setItem(STORAGE_KEYS.servicos, JSON.stringify(s));
  },
  removeServico: (index) => {
    const s = DB.getServicos();
    s.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.servicos, JSON.stringify(s));
  },
  getAgendamentos: () => {
    const agendamentos = safeParse(localStorage.getItem(STORAGE_KEYS.agendamentos), []);
    let changed = false;

    const normalized = agendamentos
      .map((ag) => {
        const normalized = normalizeAgendamento(ag);
        if (!normalized) {
          changed = true;
          return null;
        }
        if (JSON.stringify(ag) !== JSON.stringify(normalized)) {
          changed = true;
        }
        return normalized;
      })
      .filter(Boolean);

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(normalized));
    }
    return normalized;
  },
  saveAgendamento: (ag) => {
    const normalized = normalizeAgendamento(ag);
    if (!normalized) return false;

    const a = DB.getAgendamentos();
    a.push(normalized);
    localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(a));
    return true;
  },
  removeAgendamentoById: (id) => {
    const a = DB.getAgendamentos().filter((item) => item.id !== String(id));
    localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(a));
  },
  markAgendamentoAsCompleted: (id) => {
    const a = DB.getAgendamentos();
    var idx = -1;
    for (var i = 0; i < a.length; i++) {
      if (a[i].id === String(id)) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      a[idx].concluido = true;
    }
    localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(a));
  },
  getEstabelecimentoAberto: () => {
    return safeParse(localStorage.getItem(STORAGE_KEYS.estabelecimentoAberto), true);
  },
  setEstabelecimentoAberto: (aberto) => {
    localStorage.setItem(STORAGE_KEYS.estabelecimentoAberto, JSON.stringify(Boolean(aberto)));
  }
};

const header = document.querySelector('.topo');
const main = document.querySelector('main');
const navPapeis = document.querySelector('.papeis');
const grade = document.getElementById('cal-grade');
const tituloMes = document.getElementById('cal-titulo-mes');
const formAgendamento = document.getElementById('form-agendamento');
const formServico = document.getElementById('form-servico');
const listaServicos = document.getElementById('lista-servicos');
const tbodyAgendamentos = document.getElementById('tbody-agendamentos');
const botoesPapel = document.querySelectorAll('.papel');
let dataAtual = new Date();
let sessaoAtual = null;

// FIX (Bug 2): flag para evitar múltiplos registros de eventos do barbeiro
let barbeiroEventosInicializados = false;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupLoginUI();
  setupTabs();
  setupCalendarEvents();
  setupFormEvents();
  setupDeleteEvents();
  updateServicosSelect();
  renderCalendar();
  aplicarSessao();
  lucide.createIcons();
  setTimeout(() => lucide.createIcons(), 100);
});

// --- UI CONTROLS ---
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const mensagem = escapeHTML(String(msg || ''));
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${mensagem}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function showConfirmDialog(message, onConfirm, onCancel = null) {
  const dialog = document.createElement('div');
  dialog.className = 'confirm-modal';
  const escapedMsg = escapeHTML(String(message || ''));
  dialog.innerHTML = `
    <div class="confirm-content">
      <p>${escapedMsg}</p>
      <div class="confirm-buttons">
        <button class="btn-confirm" type="button">Confirmar</button>
        <button class="btn-cancel" type="button">Cancelar</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const confirmBtn = dialog.querySelector('.btn-confirm');
  const cancelBtn = dialog.querySelector('.btn-cancel');

  function cleanup() {
    dialog.remove();
  }

  confirmBtn.onclick = () => {
    cleanup();
    try {
      onConfirm?.();
    } catch (e) {
      console.error('Erro em onConfirm:', e);
      showToast('Erro ao processar ação.', 'error');
    }
  };

  cancelBtn.onclick = () => {
    cleanup();
    onCancel?.();
  };
}

function setFieldError(input, message) {
  input.classList.add('error');
  const error = input.nextElementSibling;
  if (error) {
    error.style.display = 'block';
    if (error.classList.contains('error-msg')) {
      error.textContent = message || 'Campo inválido';
      error.classList.add('show');
    }
  }
}

function clearFieldError(input) {
  input.classList.remove('error');
  const error = input.nextElementSibling;
  if (error) {
    error.style.display = 'none';
    error.classList.remove('show');
  }
}

function somenteDigitos(valor) {
  return valor.replace(/\D/g, '');
}

function getDataHoje() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getSessao() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.sessao), null);
}

function saveSessao(sessao) {
  localStorage.setItem(STORAGE_KEYS.sessao, JSON.stringify(sessao));
}

function clearSessao() {
  localStorage.removeItem(STORAGE_KEYS.sessao);
}

function setupLoginUI() {
  const loginWrap = document.createElement('section');
  loginWrap.id = 'painel-login';
  loginWrap.style.maxWidth = '460px';
  loginWrap.style.margin = '3rem auto';
  loginWrap.innerHTML = `
    <div class="card">
      <h2><i data-lucide="lock"></i> Login</h2>
      <form id="form-login" class="form" novalidate>
        <label>Usuário
          <input type="text" id="login-usuario" required />
          <span class="error-msg">Usuário obrigatório</span>
        </label>
        <label>Senha
          <input type="password" id="login-senha" required />
          <span class="error-msg">Senha obrigatória</span>
        </label>
        <button type="submit" class="btn-prim">Entrar</button>
      </form>
      <p style="color:var(--text-muted); font-size:0.75rem; margin-top:0.75rem;">
        Usuários de teste: cliente/1234 e barbeiro/1234
      </p>
    </div>
  `;

  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.id = 'btn-logout';
  logoutBtn.className = 'papel';
  logoutBtn.innerHTML = '<i data-lucide="log-out" style="width:16px"></i> Sair';
  logoutBtn.onclick = logout;
  navPapeis.appendChild(logoutBtn);

  main.insertAdjacentElement('beforebegin', loginWrap);
  loginWrap.querySelector('#form-login').addEventListener('submit', onLoginSubmit);
}

function onLoginSubmit(event) {
  event.preventDefault();
  const usuarioInput = document.getElementById('login-usuario');
  const senhaInput = document.getElementById('login-senha');
  const usuario = usuarioInput.value.trim().toLowerCase();
  const senha = senhaInput.value.trim();
  clearFieldError(usuarioInput);
  clearFieldError(senhaInput);

  if (!usuario) setFieldError(usuarioInput, 'Usuário obrigatório');
  if (!senha) setFieldError(senhaInput, 'Senha obrigatória');
  if (!usuario || !senha) return;

  const papelValido = Object.keys(LOGIN_FIXO).find((papel) => {
    const cred = LOGIN_FIXO[papel];
    return cred.usuario === usuario && cred.senha === senha;
  });

  if (!papelValido) {
    showToast('Usuário ou senha inválidos.', 'error');
    setFieldError(senhaInput, 'Credenciais inválidas');
    return;
  }

  const sessao = { papel: papelValido, usuario, loginEm: new Date().toISOString() };
  saveSessao(sessao);
  sessaoAtual = sessao;
  aplicarSessao();
  showToast(`Login realizado como ${papelValido}.`);
}

function aplicarSessao() {
  sessaoAtual = getSessao();
  const loginPanel = document.getElementById('painel-login');
  const logoutBtn = document.getElementById('btn-logout');
  const autenticado = !!(sessaoAtual && sessaoAtual.papel);
  if (!autenticado) {
    if (loginPanel) loginPanel.style.display = 'block';
    header.style.display = 'none';
    main.style.display = 'none';
    return;
  }

  if (loginPanel) loginPanel.style.display = 'none';
  header.style.display = 'flex';
  main.style.display = 'block';
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';
  applyRoleAccess(sessaoAtual.papel);
}

function applyRoleAccess(papel) {
  const papelPermitido = papel === 'barbeiro' ? 'barbeiro' : 'cliente';
  botoesPapel.forEach((btn) => {
    const isCurrent = btn.dataset.papel === papelPermitido;
    btn.classList.toggle('ativo', isCurrent);
    btn.style.display = isCurrent ? 'inline-flex' : 'none';
    btn.disabled = !isCurrent;
  });

  document.querySelectorAll('.painel').forEach((p) => p.classList.remove('ativo'));
  document.getElementById(`painel-${papelPermitido}`).classList.add('ativo');
  if (papelPermitido === 'barbeiro') {
    updateBarbeiroView();
    setupBarbeiroEvents(); // protegida pela flag interna
  }
}

function logout() {
  clearSessao();
  sessaoAtual = null;
  // FIX (Bug 2): resetar flag ao fazer logout para permitir novo setup se necessário
  barbeiroEventosInicializados = false;
  aplicarSessao();
  showToast('Sessão encerrada.');
}

function setupTabs() {
  botoesPapel.forEach((btn) => {
    btn.onclick = () => {
      if (!sessaoAtual || sessaoAtual.papel !== btn.dataset.papel) return;
      applyRoleAccess(btn.dataset.papel);
    };
  });
}

// --- CLIENT LOGIC ---
function updateServicosSelect() {
  const select = document.getElementById('ag-servico');
  const servicos = DB.getServicos();

  try {
    select.innerHTML = '<option value="" style="background-color: #2a2a2a; color: #ffffff;">Selecione...</option>' +
      servicos.map((s) => {
        const nome = String(s.nome || '');
        const preco = Number(s.preco) || 0;
        const descricao = `${escapeHTML(nome)} - R$ ${preco.toFixed(2)}`;
        return `<option value="${escapeHTML(nome)}" data-preco="${preco}" style="background-color: #2a2a2a; color: #ffffff;">${escapeHTML(descricao)}</option>`;
      }).join('');
  } catch (e) {
    console.error('Erro ao atualizar serviços select:', e);
    showToast('Erro ao carregar serviços. Recarregue a página.', 'error');
    select.innerHTML = '<option value="">Nenhum serviço disponível</option>';
  }
}

// Calendar
function renderCalendar() {
  grade.innerHTML = '';
  const mes = dataAtual.getMonth();
  const ano = dataAtual.getFullYear();
  const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  tituloMes.textContent = `${meses[mes]} ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i += 1) {
    var emptyDiv = document.createElement('div');
    emptyDiv.className = 'dia vazio';
    grade.appendChild(emptyDiv);
  }

  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    const div = document.createElement('div');
    div.className = 'dia';
    div.textContent = dia;
    const fullDate = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (fullDate === getDataHoje()) div.classList.add('hoje');
    div.onclick = () => {
      document.querySelectorAll('.dia').forEach((d) => d.classList.remove('selecionado'));
      div.classList.add('selecionado');
      document.getElementById('ag-data').value = fullDate;
      clearFieldError(document.getElementById('ag-data'));
      renderHorariosOcupados(fullDate);
    };
    grade.appendChild(div);
  }
}

function setupCalendarEvents() {
  document.getElementById('cal-mes-ant').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById('cal-prox-mes').onclick = () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderCalendar();
  };
}

function hasConflitoHorario(data, hora) {
  return DB.getAgendamentos().some((ag) => ag.data === data && ag.hora === hora);
}

function renderHorariosOcupados(dataISO) {
  const wrap = document.getElementById('ag-horarios-ocupados');
  if (!wrap) return;
  if (!dataISO) {
    wrap.innerHTML = '';
    return;
  }

  const horas = DB.getAgendamentos()
    .filter((ag) => ag.data === dataISO && !ag.concluido)
    .map((ag) => String(ag.hora || ''))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (horas.length === 0) {
    wrap.innerHTML = '<small style="color:var(--text-muted)">Nenhum horário agendado para esta data.</small>';
    return;
  }

  wrap.innerHTML = `
    <small style="color:var(--text-muted); display:block; margin-bottom:0.35rem;">Horários já agendados:</small>
    <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
      ${horas.map((h) => `<span class="badge">${escapeHTML(h)}</span>`).join('')}
    </div>
  `;
}

function validarAgendamento() {
  const nomeInput = document.getElementById('ag-nome');
  const whatsappInput = document.getElementById('ag-whatsapp');
  const servicoInput = document.getElementById('ag-servico');
  const dataInput = document.getElementById('ag-data');
  const horaInput = document.getElementById('ag-hora');

  [nomeInput, whatsappInput, servicoInput, dataInput, horaInput].forEach(clearFieldError);
  let valid = true;

  const nome = nomeInput.value.trim();
  const whatsapp = somenteDigitos(whatsappInput.value);
  const servico = servicoInput.value.trim();
  const data = dataInput.value;
  const hora = horaInput.value;

  if (!nome || nome.length < 3 || nome.length > 80) {
    setFieldError(nomeInput, 'Informe um nome entre 3 e 80 caracteres.');
    valid = false;
  }
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    setFieldError(whatsappInput, 'Use um WhatsApp valido com DDD.');
    valid = false;
  }
  if (!servico) {
    setFieldError(servicoInput, 'Escolha um servico.');
    valid = false;
  }
  if (!data) {
    setFieldError(dataInput, 'Selecione uma data no calendario.');
    valid = false;
  } else if (data < getDataHoje()) {
    setFieldError(dataInput, 'Nao e permitido agendar no passado.');
    valid = false;
  }
  if (!hora) {
    setFieldError(horaInput, 'Informe um horario.');
    valid = false;
  } else if (hora >= CONFIG.horaLimiteAgendamento) {
    setFieldError(horaInput, `Nao e permitido agendar depois de ${CONFIG.horaLimiteAgendamento}.`);
    valid = false;
  }
  if (valid && hasConflitoHorario(data, hora)) {
    setFieldError(horaInput, 'Esse horario ja esta ocupado.');
    valid = false;
  }
  if (valid && !DB.getEstabelecimentoAberto()) {
    setFieldError(horaInput, 'Estabelecimento fechado. Nao e permitido agendar no momento.');
    valid = false;
  }

  return {
    valid,
    agendamento: {
      nome,
      whatsapp,
      servico,
      data,
      hora,
      valor: (() => {
        const servicoObj = DB.getServicos().find((s) => s.nome === servico);
        return servicoObj ? Number(servicoObj.preco) || 0 : 0;
      })(),
      concluido: false
    }
  };
}

function setupFormEvents() {
  formAgendamento.onsubmit = function (e) {
    e.preventDefault();
    const { valid, agendamento } = validarAgendamento();
    if (!valid) {
      showToast('Preencha todos os campos corretamente.', 'error');
      return;
    }

    if (DB.saveAgendamento(agendamento)) {
      showToast(`✓ Agendamento confirmado para ${String(agendamento.nome).toUpperCase()}!`);
      this.reset();
      document.querySelectorAll('.dia').forEach((d) => d.classList.remove('selecionado'));
      renderHorariosOcupados('');
    } else {
      showToast('Erro ao salvar agendamento. Tente novamente.', 'error');
    }
  };

  formServico.onsubmit = function (e) {
    e.preventDefault();
    const inputNome = document.getElementById('sv-nome');
    const inputPreco = document.getElementById('sv-preco');
    const nomeServico = String(inputNome.value || '').trim();
    const precoServico = Number(inputPreco.value) || 0;

    clearFieldError(inputNome);
    clearFieldError(inputPreco);

    if (!nomeServico || nomeServico.length < 2) {
      setFieldError(inputNome, 'Nome deve ter pelo menos 2 caracteres');
      return;
    }
    if (precoServico < 0) {
      setFieldError(inputPreco, 'O preço não pode ser negativo');
      return;
    }

    const jaExiste = DB.getServicos().some((item) => {
      var nome = String(item.nome || '').toLowerCase();
      return nome === nomeServico.toLowerCase();
    });

    if (jaExiste) {
      setFieldError(inputNome, 'Serviço já cadastrado');
      return;
    }

    DB.saveServico(nomeServico, precoServico);
    inputNome.value = '';
    inputPreco.value = '';
    updateBarbeiroView();
    updateServicosSelect();
    showToast(`✓ Serviço "${nomeServico}" cadastrado com sucesso!`);
  };
}

// --- BARBEIRO LOGIC ---
function formatarDataCurta(dataISO) {
  return dataISO.split('-').reverse().slice(0, 2).join('/');
}

function getDashboardEstatisticas() {
  const hoje = getDataHoje();
  const agendamentos = DB.getAgendamentos();

  const agendadosHoje = agendamentos.filter(ag => ag.data === hoje && !ag.concluido).length;
  const concluidosHoje = agendamentos.filter(ag => ag.data === hoje && ag.concluido).length;
  const receitaHoje = agendamentos
    .filter(ag => ag.concluido)
    .reduce((sum, ag) => sum + (Number(ag.valor) || 0), 0);

  return {
    agendadosHoje,
    concluidosHoje,
    receitaHoje
  };
}

function renderDashboardBarbeiro() {
  const { agendadosHoje, concluidosHoje, receitaHoje } = getDashboardEstatisticas();
  const container = document.getElementById('dashboard-stats');

  if (!container) return;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon"><i data-lucide="calendar"></i></div>
      <div class="stat-info">
        <div class="stat-value">${agendadosHoje}</div>
        <div class="stat-label">Agendados hoje</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i data-lucide="check-circle"></i></div>
      <div class="stat-info">
        <div class="stat-value">${concluidosHoje}</div>
        <div class="stat-label">Concluídos hoje</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon"><i data-lucide="dollar-sign"></i></div>
      <div class="stat-info">
        <div class="stat-value">R$ ${receitaHoje.toFixed(2)}</div>
        <div class="stat-label">Receita Total</div>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function updateBarbeiroView() {
  // Lista de Servicos
  listaServicos.innerHTML = DB.getServicos().map((s, i) => `
    <li>
      <div>
        <div>${escapeHTML(s.nome)}</div>
        <small style="color: var(--text-muted); font-size: 0.75rem;">R$ ${Number(s.preco || 0).toFixed(2)}</small>
      </div>
      <button class="btn-icon btn-delete-servico" data-servico-index="${i}" type="button" title="Excluir serviço">
        <i data-lucide="trash-2" style="width:16px"></i>
      </button>
    </li>
  `).join('');

  // Tabela Agendamentos
  const ags = DB.getAgendamentos()
    .slice()
    .filter(ag => ag.data >= getDataHoje() && !ag.concluido)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  tbodyAgendamentos.innerHTML = ags.map((ag) => `
    <tr>
      <td><strong>${escapeHTML(ag.hora)}</strong><br><small>${escapeHTML(formatarDataCurta(ag.data))}</small></td>
      <td>${escapeHTML(ag.nome)}<br><small>${escapeHTML(ag.whatsapp)}</small></td>
      <td><span class="badge">${escapeHTML(ag.servico)}</span></td>
      <td>
        <button class="btn-icon btn-complete-agendamento" data-agendamento-id="${escapeHTML(ag.id)}" type="button" style="color:var(--success)" title="Concluir atendimento">
          <i data-lucide="check-circle" style="width:18px"></i>
        </button>
        <button class="btn-icon btn-cancel-agendamento" data-agendamento-id="${escapeHTML(ag.id)}" type="button" style="color:var(--error)" title="Cancelar agendamento">
          <i data-lucide="x-circle" style="width:18px"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (ags.length === 0) {
    tbodyAgendamentos.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Nenhum agendamento para hoje.</td></tr>';
  }

  renderDashboardBarbeiro();
  lucide.createIcons();
}

function renderHistorico(dataSelecionada = null) {
  const tbody = document.getElementById('tbody-historico');
  let agendamentos = DB.getAgendamentos();

  if (dataSelecionada) {
    agendamentos = agendamentos.filter(ag => ag.data === dataSelecionada);
  }

  agendamentos = agendamentos
    .slice()
    .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));

  if (agendamentos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = agendamentos.map((ag) => `
    <tr>
      <td><strong>${escapeHTML(ag.hora)}</strong></td>
      <td>${escapeHTML(formatarDataCurta(ag.data))}</td>
      <td>${escapeHTML(ag.nome)}<br><small>${escapeHTML(ag.whatsapp)}</small></td>
      <td><span class="badge">${escapeHTML(ag.servico)}</span></td>
      <td><span class="badge" style="background: ${ag.concluido ? 'rgba(34, 197, 94, 0.1); color: var(--success)' : 'rgba(239, 68, 68, 0.1); color: var(--error)'};">${ag.concluido ? 'Concluído' : 'Pendente'}</span></td>
    </tr>
  `).join('');
}

function setupBarbeiroEvents() {
  // FIX (Bug 2): garantir que os eventos são registrados apenas uma vez
  if (barbeiroEventosInicializados) return;
  barbeiroEventosInicializados = true;

  const btnEstabelecimento = document.getElementById('btn-estabelecimento');
  const btnHistorico = document.getElementById('btn-historico');
  const modalHistorico = document.getElementById('modal-historico');
  const btnFecharHistorico = document.getElementById('btn-fechar-historico');
  const filtroDataHistorico = document.getElementById('filtro-data-historico');

  // Botão para abrir/fechar estabelecimento
  if (btnEstabelecimento) {
    const atualizarBotao = () => {
      const aberto = DB.getEstabelecimentoAberto();
      btnEstabelecimento.innerHTML = aberto ?
        '<i data-lucide="power" style="width:16px"></i> Estabelecimento Aberto' :
        '<i data-lucide="power-off" style="width:16px"></i> Estabelecimento Fechado';
      btnEstabelecimento.style.background = aberto ? 'var(--success)' : 'var(--error)';
      lucide.createIcons();
    };

    atualizarBotao();

    btnEstabelecimento.onclick = () => {
      const aberto = DB.getEstabelecimentoAberto();
      showConfirmDialog(
        aberto ?
          'Tem certeza que deseja fechar o estabelecimento? Novos agendamentos não serão permitidos.' :
          'Tem certeza que deseja abrir o estabelecimento?',
        () => {
          DB.setEstabelecimentoAberto(!aberto);
          atualizarBotao();
          showToast(aberto ? 'Estabelecimento fechado.' : 'Estabelecimento aberto.');
        }
      );
    };
  }

  // Botão para abrir histórico
  if (btnHistorico) {
    btnHistorico.onclick = () => {
      filtroDataHistorico.value = getDataHoje();
      renderHistorico(getDataHoje());
      modalHistorico.style.display = 'flex';
      setTimeout(() => lucide.createIcons(), 50);
    };
  }

  // Botão para fechar histórico
  if (btnFecharHistorico) {
    btnFecharHistorico.onclick = () => {
      modalHistorico.style.display = 'none';
    };
  }

  // Filtro de data do histórico
  if (filtroDataHistorico) {
    filtroDataHistorico.onchange = () => {
      const dataSelecionada = filtroDataHistorico.value || null;
      renderHistorico(dataSelecionada);
    };
  }

  // Fechar modal ao clicar fora
  if (modalHistorico) {
    modalHistorico.onclick = (e) => {
      if (e.target === modalHistorico) {
        modalHistorico.style.display = 'none';
      }
    };
  }
}

function setupDeleteEvents() {
  listaServicos.addEventListener('click', (event) => {
    const button = event.target.closest('[data-servico-index]');
    if (!button) return;
    const index = Number(button.dataset.servicoIndex);
    const servicoObj = DB.getServicos()[index];
    if (!servicoObj) {
      showToast('Serviço não encontrado.', 'error');
      return;
    }
    const nomeServico = String(servicoObj.nome || '');

    showConfirmDialog(
      `Tem certeza que deseja excluir o serviço "${escapeHTML(nomeServico)}"?`,
      () => {
        DB.removeServico(index);
        updateBarbeiroView();
        updateServicosSelect();
        showToast('Serviço removido com sucesso.');
      }
    );
  });

  tbodyAgendamentos.addEventListener('click', (event) => {
    const button = event.target.closest('[data-agendamento-id]');
    if (!button) return;
    const agId = button.dataset.agendamentoId;
    const ag = DB.getAgendamentos().find(a => a.id === agId);

    if (!ag) {
      showToast('Agendamento não encontrado.', 'error');
      return;
    }

    if (button.classList.contains('btn-cancel-agendamento')) {
      showConfirmDialog(
        `Tem certeza que deseja cancelar o agendamento de ${escapeHTML(String(ag.nome))}?`,
        () => {
          DB.removeAgendamentoById(agId);
          updateBarbeiroView();
          renderDashboardBarbeiro();
          showToast('Agendamento cancelado.');
        }
      );
    } else if (button.classList.contains('btn-complete-agendamento')) {
      // FIX (Bug 1): checagem restaurada — impede concluir agendamento já concluído
      if (ag.concluido) {
        showToast('Este agendamento já foi concluído.', 'error');
        return;
      }
      showConfirmDialog(
        `Marcar agendamento de ${escapeHTML(String(ag.nome))} como concluído?`,
        () => {
          DB.markAgendamentoAsCompleted(agId);
          updateBarbeiroView();
          renderDashboardBarbeiro();
          const precoFormatado = Number(ag.valor || 0).toFixed(2);
          showToast(`Atendimento concluído! +R$ ${precoFormatado} na receita.`);
        }
      );
    }
  });
}