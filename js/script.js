// --- DATABASE SIMULATION (LocalStorage) ---
const STORAGE_KEYS = {
  servicos: 'barbearia_servicos',
  agendamentos: 'barbearia_agendamentos',
  sessao: 'barbearia_sessao'
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

const DB = {
  getServicos: () => safeParse(localStorage.getItem(STORAGE_KEYS.servicos), ['Corte Social', 'Barba', 'Combo']),
  saveServico: (nome) => {
    const s = DB.getServicos();
    s.push(nome);
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
    const normalized = agendamentos.map((ag) => {
      if (ag.id) return ag;
      changed = true;
      return { ...ag, id: generateId() };
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(normalized));
    }
    return normalized;
  },
  saveAgendamento: (ag) => {
    const a = DB.getAgendamentos();
    a.push({ ...ag, id: ag.id || generateId() });
    localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(a));
  },
  removeAgendamentoById: (id) => {
    const a = DB.getAgendamentos().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.agendamentos, JSON.stringify(a));
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
});

// --- UI CONTROLS ---
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${escapeHTML(msg)}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function setFieldError(input, message) {
  const error = input.nextElementSibling;
  input.classList.add('error');
  if (error) {
    error.style.display = 'block';
    if (message) error.textContent = message;
  }
}

function clearFieldError(input) {
  const error = input.nextElementSibling;
  input.classList.remove('error');
  if (error) error.style.display = 'none';
}

function somenteDigitos(valor) {
  return valor.replace(/\D/g, '');
}

function getDataHoje() {
  return new Date().toISOString().split('T')[0];
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
  if (papelPermitido === 'barbeiro') updateBarbeiroView();
}

function logout() {
  clearSessao();
  sessaoAtual = null;
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
  select.innerHTML = '<option value="">Selecione...</option>' +
    servicos.map((s) => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
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
    grade.appendChild(Object.assign(document.createElement('div'), { className: 'dia vazio' }));
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
  }
  if (valid && hasConflitoHorario(data, hora)) {
    setFieldError(horaInput, 'Esse horario ja esta ocupado.');
    valid = false;
  }

  return {
    valid,
    agendamento: {
      nome,
      whatsapp,
      servico,
      data,
      hora
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

    DB.saveAgendamento(agendamento);
    showToast('Agendamento realizado com sucesso!');
    this.reset();
    document.querySelectorAll('.dia').forEach((d) => d.classList.remove('selecionado'));
  };

  formServico.onsubmit = function (e) {
    e.preventDefault();
    const input = document.getElementById('sv-nome');
    const nomeServico = input.value.trim();
    clearFieldError(input);
    if (!nomeServico) {
      setFieldError(input, 'O nome do servico e obrigatorio');
      return;
    }
    if (DB.getServicos().some((item) => item.toLowerCase() === nomeServico.toLowerCase())) {
      setFieldError(input, 'Esse servico ja existe.');
      return;
    }
    DB.saveServico(nomeServico);
    input.value = '';
    updateBarbeiroView();
    updateServicosSelect();
    showToast('Novo servico cadastrado!');
  };
}

// --- BARBEIRO LOGIC ---
function formatarDataCurta(dataISO) {
  return dataISO.split('-').reverse().slice(0, 2).join('/');
}

function updateBarbeiroView() {
  // Lista de Servicos
  listaServicos.innerHTML = DB.getServicos().map((s, i) => `
    <li>
      ${escapeHTML(s)}
      <button class="btn-icon" data-servico-index="${i}" type="button">
        <i data-lucide="trash-2" style="width:16px"></i>
      </button>
    </li>
  `).join('');

  // Tabela Agendamentos
  const ags = DB.getAgendamentos()
    .slice()
    .map((ag) => ({ ...ag, id: ag.id || generateId() }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  tbodyAgendamentos.innerHTML = ags.map((ag) => `
    <tr>
      <td><strong>${escapeHTML(ag.hora)}</strong><br><small>${escapeHTML(formatarDataCurta(ag.data))}</small></td>
      <td>${escapeHTML(ag.nome)}<br><small>${escapeHTML(ag.whatsapp)}</small></td>
      <td><span class="badge">${escapeHTML(ag.servico)}</span></td>
      <td>
        <button class="btn-icon" data-agendamento-id="${escapeHTML(ag.id)}" type="button" style="color:var(--success)">
          <i data-lucide="check-circle" style="width:18px"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (ags.length === 0) {
    tbodyAgendamentos.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Nenhum agendamento.</td></tr>';
  }
  lucide.createIcons();
}

function setupDeleteEvents() {
  listaServicos.addEventListener('click', (event) => {
    const button = event.target.closest('[data-servico-index]');
    if (!button) return;
    const index = Number(button.dataset.servicoIndex);
    DB.removeServico(index);
    updateBarbeiroView();
    updateServicosSelect();
    showToast('Servico removido.');
  });

  tbodyAgendamentos.addEventListener('click', (event) => {
    const button = event.target.closest('[data-agendamento-id]');
    if (!button) return;
    DB.removeAgendamentoById(button.dataset.agendamentoId);
    updateBarbeiroView();
    showToast('Atendimento concluido!');
  });
}
