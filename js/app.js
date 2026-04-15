// ========== APP PRINCIPAL ==========
import { Storage } from './modules/storage.js';
import { handleLogin, handleRegister, logout } from './modules/auth.js';
import { initCalendar, renderCalendar, changeMonth, resetSelection } from './modules/calendar.js';
import { showToast, showConfirmModal, showCancelModal } from './modules/ui.js';
import { loadComponent, loadComponents } from './component-loader.js';
import {
  services, loadServices, saveServices, addService, deleteService,
  calcularValorFinal, calcularTempoEstimado, formatMoney, formatarTempo
} from './modules/services.js';
import {
  appointments, cancellations, loadAppointments, saveAppointments, saveCancellations,
  addAppointment, cancelAppointment, completeAppointment, clearUserCancellations,
  clearAllCompleted, clearAllCancellations, ordenarAgendamentos, hasConflict
} from './modules/appointments.js';
import { precosConfig, temposConfig, setPrecosConfig, setTemposConfig } from './modules/config.js';
import { isFeriadoNacional } from './modules/feriados.js';
import { initThemeToggle, refreshLogos } from './modules/theme.js';  // <-- ADICIONAR ESTA LINHA

// ========== ESTADO ==========
let currentUser = null;
let currentDate = new Date();
let selectedCalendarDate = null;
let pendingCancelId = null;

// ========== DOM ELEMENTOS ==========
const elements = {};

// ========== INICIALIZAÇÃO ==========
async function init() {
  await loadComponents([
    { path: 'components/login.html', target: 'auth-screen' },
    { path: 'components/header.html', target: 'header-container' },
    { path: 'components/modais.html', target: 'modais-container' }
  ]);
  
  cacheDOM();
  loadData();
  bindEvents();
  setupMasks();
  setupTodayDate();
  setupPasswordToggles();
  checkSavedSession();
  setupAuthTabs();
  
  initThemeToggle();  // <-- ADICIONAR ESTA LINHA
}

async function loadPainelCliente() {
  console.log('Carregando painel cliente...');

  const clienteContainer = document.getElementById('painel-cliente-container');
  const barbeiroContainer = document.getElementById('painel-barbeiro-container');

  if (barbeiroContainer) {
    barbeiroContainer.innerHTML = '';
    barbeiroContainer.classList.add('hidden');
  }
  if (clienteContainer) {
    clienteContainer.innerHTML = '';
    clienteContainer.classList.remove('hidden');
  }

  // Criar estrutura de grid do cliente
  clienteContainer.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-lg-6" id="cliente-calendario"></div>
      <div class="col-12 col-lg-6" id="cliente-formulario"></div>
      <div class="col-12" id="cliente-meus-agendamentos"></div>
      <div class="col-12" id="cliente-historico-concluidos"></div>
      <div class="col-12" id="cliente-historico-cancelados"></div>
      <div class="col-12" id="cliente-excluir-conta"></div>
    </div>
  `;

  // Carregar componentes
  await loadComponent('components/cliente/calendario.html', 'cliente-calendario');
  await loadComponent('components/cliente/formulario-agendamento.html', 'cliente-formulario');
  await loadComponent('components/cliente/meus-agendamentos.html', 'cliente-meus-agendamentos');
  await loadComponent('components/cliente/historico-concluidos.html', 'cliente-historico-concluidos');
  await loadComponent('components/cliente/historico-cancelados.html', 'cliente-historico-cancelados');
  await loadComponent('components/cliente/excluir-conta.html', 'cliente-excluir-conta');

  // Recachear elementos após carregar
  cacheDOM();
  bindEvents();
  setupEnderecoToggle();
  updateServiceSelect();
  initCalendar((formattedDate) => {
    if (elements.agData) elements.agData.value = formattedDate;
    validateData();
  });
  renderCalendar(elements.calGrade, elements.calTitulo);
  renderMeusAgendamentos();
  renderMeusConcluidos();
  renderMeusCancelados();

  // Botão excluir conta
  const btnExcluirConta = document.getElementById('btn-excluir-minha-conta');
  if (btnExcluirConta) btnExcluirConta.addEventListener('click', () => excluirMinhaConta());

  // Fix para o nome do cliente no formulário
  if (currentUser && currentUser.role === 'cliente') {
    if (elements.agNome) {
      elements.agNome.value = currentUser.nome;
      elements.agNome.disabled = true;
    }
    if (elements.agWhatsapp) elements.agWhatsapp.value = currentUser.whatsapp || '';
  }

  // Forçar a estilização dos botões de toggle de senha
  setTimeout(() => {
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
      btn.classList.add('btn-sm');
    });
  }, 100);

  refreshLogos();  // <-- ADICIONAR ESTA LINHA
}

// Adicione estas funções no app.js

function renderClientesList() {
  const tbody = document.getElementById('tbody-clientes');
  if (!tbody) {
    console.log('tbody-clientes não encontrado');
    return;
  }

  const users = Storage.getUsers();
  const clientes = users.filter(u => u.role === 'cliente');

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr class="text-center"><td colspan="5" style="color: #aaaaaa;">Nenhum cliente cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = clientes.map(cliente => {
    const totalAgendamentos = appointments.filter(a => a.cliente === cliente.nome).length;
    return `
      <tr>
        <td><strong>${escapeHtml(cliente.nome)}</strong></td>
        <td>${escapeHtml(cliente.email)}</td>
        <td>${escapeHtml(cliente.whatsapp || '-')}</td>
        <td>${totalAgendamentos}</td>
        <td>
          <button onclick="window.excluirCliente(${cliente.id}, '${escapeHtml(cliente.nome)}')" class="btn btn-sm btn-outline-danger" title="Excluir cliente">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  }).join('');

  window.excluirCliente = (id, nome) => {
    showConfirmModal(
      'Excluir Cliente',
      `Tem certeza que deseja excluir o cliente "${nome}"? Esta ação irá remover todos os seus agendamentos e não poderá ser desfeita.`,
      () => {
        excluirClientePorId(id);
      }
    );
  };
}

function excluirClientePorId(id) {
  console.log('Excluindo cliente ID:', id);

  let users = Storage.getUsers();
  const cliente = users.find(u => u.id === id);

  if (!cliente) {
    showToast('Cliente não encontrado', 'error');
    return;
  }

  console.log('Cliente encontrado:', cliente);

  // Remover todos os agendamentos do cliente
  const novosAppointments = appointments.filter(a => a.cliente !== cliente.nome);
  appointments.length = 0;
  appointments.push(...novosAppointments);
  saveAppointments();

  // Remover cancelamentos relacionados
  const novosCancellations = cancellations.filter(c => c.cliente !== cliente.nome);
  cancellations.length = 0;
  cancellations.push(...novosCancellations);
  saveCancellations();

  // Remover o usuário
  const novosUsers = users.filter(u => u.id !== id);
  Storage.setUsers(novosUsers);

  showToast(`Cliente "${cliente.nome}" excluído com sucesso!`, 'success');

  // Recarregar listas
  renderClientesList();
  renderTodosAgendamentos();
  renderConcluidos();
  renderHistoricoCancelamentos();

  // Se o cliente excluído era o usuário atual, fazer logout
  if (currentUser && currentUser.id === id) {
    setTimeout(() => {
      logout(() => location.reload());
    }, 1500);
  }
}

function formatarDataCadastro(userId) {
  // Como não salvamos data de cadastro original, usamos uma aproximação
  return `ID: ${userId}`;
}

// Função para cliente excluir a própria conta
function excluirMinhaConta() {
  showConfirmModal(
    'Excluir Minha Conta',
    `Tem certeza que deseja excluir sua conta "${currentUser.nome}"? Esta ação irá remover todos os seus agendamentos e não poderá ser desfeita.`,
    () => {
      console.log('Excluindo conta do cliente:', currentUser);

      // Remover todos os agendamentos do cliente
      const novosAppointments = appointments.filter(a => a.cliente !== currentUser.nome);
      appointments.length = 0;
      appointments.push(...novosAppointments);
      saveAppointments();

      // Remover cancelamentos relacionados
      const novosCancellations = cancellations.filter(c => c.cliente !== currentUser.nome);
      cancellations.length = 0;
      cancellations.push(...novosCancellations);
      saveCancellations();

      // Remover o usuário
      let users = Storage.getUsers();
      const novosUsers = users.filter(u => u.id !== currentUser.id);
      Storage.setUsers(novosUsers);

      // Fazer logout
      Storage.clearCurrentUser();
      showToast('Sua conta foi excluída com sucesso!', 'success');

      // Recarregar para tela de login
      setTimeout(() => location.reload(), 1500);
    }
  );
}

async function loadPainelBarbeiro() {
  console.log('Carregando painel barbeiro...');

  const barbeiroContainer = document.getElementById('painel-barbeiro-container');
  const clienteContainer = document.getElementById('painel-cliente-container');

  if (clienteContainer) {
    clienteContainer.innerHTML = '';
    clienteContainer.classList.add('hidden');
  }
  if (barbeiroContainer) {
    barbeiroContainer.innerHTML = '';
    barbeiroContainer.classList.remove('hidden');
  }

  // Criar estrutura de grid do barbeiro
  barbeiroContainer.innerHTML = `
    <div class="row g-4">
      <div class="col-12 col-lg-5" id="barbeiro-configuracoes"></div>
      <div class="col-12 col-lg-7" id="barbeiro-agendamentos"></div>
    </div>
  `;

  // Carregar componentes da coluna esquerda
  const configContainer = document.getElementById('barbeiro-configuracoes');
  configContainer.innerHTML = `
    <div id="barbeiro-config-servicos"></div>
    <div id="barbeiro-config-percentuais" class="mt-3"></div>
  `;

  await loadComponent('components/barbeiro/config-servicos.html', 'barbeiro-config-servicos');
  await loadComponent('components/barbeiro/config-percentuais.html', 'barbeiro-config-percentuais');

  // Carregar componentes da coluna direita
  const agendamentosContainer = document.getElementById('barbeiro-agendamentos');
  agendamentosContainer.innerHTML = `
    <div id="barbeiro-todos-agendamentos"></div>
    <div id="barbeiro-historico-concluidos" class="mt-3"></div>
    <div id="barbeiro-historico-cancelamentos" class="mt-3"></div>
    <div id="barbeiro-clientes" class="mt-3"></div>
  `;

  await loadComponent('components/barbeiro/todos-agendamentos.html', 'barbeiro-todos-agendamentos');
  await loadComponent('components/barbeiro/historico-concluidos.html', 'barbeiro-historico-concluidos');
  await loadComponent('components/barbeiro/historico-cancelamentos.html', 'barbeiro-historico-cancelamentos');
  await loadComponent('components/barbeiro/clientes.html', 'barbeiro-clientes');

  // Recachear elementos após carregar
  cacheDOM();
  bindEvents();
  carregarConfiguracoesUI();
  renderServicesList();
  renderTodosAgendamentos();
  renderConcluidos();
  renderHistoricoCancelamentos();
  renderClientesList();

  // Após carregar os componentes, chamar:
  setupPasswordToggles();

  refreshLogos();  // <-- ADICIONAR ESTA LINHA
}

function cacheDOM() {
  // Login/Register
  elements.loginForm = document.getElementById('login-form');
  elements.loginEmail = document.getElementById('login-email');
  elements.loginPassword = document.getElementById('login-password');
  elements.registerForm = document.getElementById('register-form');
  elements.loginPanel = document.getElementById('login-panel');
  elements.registerPanel = document.getElementById('register-panel');
  elements.showRegister = document.getElementById('show-register');
  elements.showLogin = document.getElementById('show-login');
  elements.regNome = document.getElementById('reg-nome');
  elements.regEmail = document.getElementById('reg-email');
  elements.regWhatsapp = document.getElementById('reg-whatsapp');
  elements.regPassword = document.getElementById('reg-password');
  elements.regConfirmPassword = document.getElementById('reg-confirm-password');

  // App
  elements.authScreen = document.getElementById('auth-screen');
  elements.appScreen = document.getElementById('app');
  elements.userDisplay = document.getElementById('user-display');
  elements.btnLogout = document.getElementById('btn-logout');

  // Calendário
  elements.calGrade = document.getElementById('cal-grade');
  elements.calTitulo = document.getElementById('cal-titulo-mes');
  elements.calPrev = document.getElementById('cal-prev');
  elements.calNext = document.getElementById('cal-next');

  // Formulário Agendamento
  elements.formAgendamento = document.getElementById('form-agendamento');
  elements.agNome = document.getElementById('ag-nome');
  elements.agWhatsapp = document.getElementById('ag-whatsapp');
  elements.agServico = document.getElementById('ag-servico');
  elements.agCondicao = document.getElementById('ag-condicao');
  elements.agDomicilio = document.getElementById('ag-domicilio');
  elements.agEndereco = document.getElementById('ag-endereco');
  elements.agObservacao = document.getElementById('ag-observacao');
  elements.agData = document.getElementById('ag-data');
  elements.agHora = document.getElementById('ag-hora');
  elements.agValor = document.getElementById('ag-valor');
  elements.agTempo = document.getElementById('ag-tempo');
  elements.agDesconto = document.getElementById('ag-desconto');
  elements.agAcrescimo = document.getElementById('ag-acrescimo');
  elements.agValorFinal = document.getElementById('ag-valor-final');

  // Admin
  elements.formServico = document.getElementById('form-servico');
  elements.svNome = document.getElementById('sv-nome');
  elements.svPreco = document.getElementById('sv-preco');
  elements.svTempo = document.getElementById('sv-tempo');
  elements.listaServicos = document.getElementById('lista-servicos');
  elements.tbodyAgendamentos = document.getElementById('tbody-agendamentos');
  elements.tbodyConcluidos = document.getElementById('tbody-concluidos');
  elements.tbodyCancelamentos = document.getElementById('tbody-cancelamentos');

  // Cliente
  elements.tbodyMeusAgendamentos = document.getElementById('tbody-meus-agendamentos');
  elements.tbodyMeusConcluidos = document.getElementById('tbody-meus-concluidos');
  elements.tbodyMeusCancelados = document.getElementById('tbody-meus-cancelados');
  elements.todayDate = document.getElementById('today-date');
}

function loadData() {
  loadServices();
  loadAppointments();
  loadConfiguracoes();
}

function loadConfiguracoes() {
  const storedPrecos = Storage.getPrecosConfig();
  const storedTempos = Storage.getTemposConfig();
  if (storedPrecos) setPrecosConfig(storedPrecos);
  if (storedTempos) setTemposConfig(storedTempos);
}

function carregarConfiguracoesUI() {
  const campos = [
    'perc-domicilio', 'tempo-domicilio',
    'perc-autista', 'tempo-autista',
    'perc-cadeirante', 'tempo-cadeirante',
    'perc-deficiente', 'tempo-deficiente',
    'perc-idoso', 'tempo-idoso',
    'perc-crianca', 'tempo-crianca'
  ];
  campos.forEach(campo => {
    const el = document.getElementById(campo);
    if (el) {
      if (campo.startsWith('perc')) {
        const key = campo.replace('perc-', '');
        el.value = precosConfig[key] || 0;
      } else if (campo.startsWith('tempo')) {
        const key = campo.replace('tempo-', '');
        el.value = temposConfig[key] || 0;
      }
    }
  });
}

function salvarConfiguracoes() {
  const novaPrecos = {
    domicilio: parseFloat(document.getElementById('perc-domicilio')?.value) || 0,
    autista: parseFloat(document.getElementById('perc-autista')?.value) || 0,
    cadeirante: parseFloat(document.getElementById('perc-cadeirante')?.value) || 0,
    deficiente: parseFloat(document.getElementById('perc-deficiente')?.value) || 0,
    idoso: parseFloat(document.getElementById('perc-idoso')?.value) || 0,
    crianca: parseFloat(document.getElementById('perc-crianca')?.value) || 0
  };
  const novaTempos = {
    domicilio: parseFloat(document.getElementById('tempo-domicilio')?.value) || 0,
    autista: parseFloat(document.getElementById('tempo-autista')?.value) || 0,
    cadeirante: parseFloat(document.getElementById('tempo-cadeirante')?.value) || 0,
    deficiente: parseFloat(document.getElementById('tempo-deficiente')?.value) || 0,
    idoso: parseFloat(document.getElementById('tempo-idoso')?.value) || 0,
    crianca: parseFloat(document.getElementById('tempo-crianca')?.value) || 0
  };
  setPrecosConfig(novaPrecos);
  setTemposConfig(novaTempos);
  Storage.setPrecosConfig(novaPrecos);
  Storage.setTemposConfig(novaTempos);
  showToast('Configurações salvas com sucesso!', 'success');
  atualizarValores();
}

function atualizarValores() {
  const servicoId = parseInt(elements.agServico?.value);
  const servico = services.find(s => s.id === servicoId);
  const condicao = elements.agCondicao?.value || 'nenhuma';
  const domicilio = elements.agDomicilio?.checked || false;

  if (servico && servico.preco) {
    const calculo = calcularValorFinal(servico.preco, condicao, domicilio);
    const tempo = calcularTempoEstimado(servico.tempo || 30, condicao, domicilio);
    if (elements.agValor) elements.agValor.value = formatMoney(calculo.precoOriginal);
    if (elements.agTempo) elements.agTempo.value = formatarTempo(tempo);
    if (elements.agDesconto) elements.agDesconto.value = formatMoney(calculo.desconto);
    if (elements.agAcrescimo) elements.agAcrescimo.value = formatMoney(calculo.acrescimo);
    if (elements.agValorFinal) elements.agValorFinal.value = formatMoney(calculo.valorFinal);
  }
}

function bindEvents() {
  // Login/Register
  if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLoginSubmit);
  if (elements.btnLogout) elements.btnLogout.addEventListener('click', () => logout(() => location.reload()));
  if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegisterSubmit);

  // Calendário
  if (elements.calPrev) elements.calPrev.addEventListener('click', () => changeMonth(-1, elements.calGrade, elements.calTitulo));
  if (elements.calNext) elements.calNext.addEventListener('click', () => changeMonth(1, elements.calGrade, elements.calTitulo));

  // Formulário Agendamento
  if (elements.formAgendamento) elements.formAgendamento.addEventListener('submit', handleAppointmentSubmit);
  if (elements.agServico) elements.agServico.addEventListener('change', () => atualizarValores());
  if (elements.agCondicao) elements.agCondicao.addEventListener('change', () => atualizarValores());
  if (elements.agDomicilio) elements.agDomicilio.addEventListener('change', () => atualizarValores());

  // Validações
  if (elements.agNome) elements.agNome.addEventListener('input', () => validateNome());
  if (elements.agWhatsapp) elements.agWhatsapp.addEventListener('input', () => validateWhatsapp());
  if (elements.agData) elements.agData.addEventListener('change', () => validateData());
  if (elements.agHora) elements.agHora.addEventListener('change', () => validateHora());

  // Admin
  if (elements.formServico) elements.formServico.addEventListener('submit', handleAddServiceSubmit);

  // Botões de configuração
  const btnSalvarConfig = document.getElementById('btn-salvar-configuracoes');
  if (btnSalvarConfig) btnSalvarConfig.addEventListener('click', () => salvarConfiguracoes());

  // Botões do cliente
  const btnLimparMeusConcluidos = document.getElementById('btn-limpar-meus-concluidos');
  if (btnLimparMeusConcluidos) btnLimparMeusConcluidos.addEventListener('click', () => limparMeusConcluidos());

  const btnLimparMeusCancelados = document.getElementById('btn-limpar-meus-cancelados');
  if (btnLimparMeusCancelados) btnLimparMeusCancelados.addEventListener('click', () => limparMeusCancelados());

  // Botões do admin
  const btnLimparConcluidos = document.getElementById('btn-limpar-concluidos');
  if (btnLimparConcluidos) btnLimparConcluidos.addEventListener('click', () => limparConcluidos());

  const btnLimparHistorico = document.getElementById('btn-limpar-historico');
  if (btnLimparHistorico) btnLimparHistorico.addEventListener('click', () => limparHistorico());
}

function setupEnderecoToggle() {
  if (elements.agDomicilio) {
    elements.agDomicilio.addEventListener('change', () => {
      const divEndereco = document.getElementById('div-endereco');
      if (divEndereco) divEndereco.style.display = elements.agDomicilio.checked ? 'block' : 'none';
      atualizarValores();
    });
  }
}

function setupAuthTabs() {
  if (elements.showRegister) {
    elements.showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.loginPanel) elements.loginPanel.style.display = 'none';
      if (elements.registerPanel) elements.registerPanel.style.display = 'block';
    });
  }
  if (elements.showLogin) {
    elements.showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.registerPanel) elements.registerPanel.style.display = 'none';
      if (elements.loginPanel) elements.loginPanel.style.display = 'block';
    });
  }
}

function setupMasks() {
  if (elements.agWhatsapp) {
    elements.agWhatsapp.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 0) value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      if (value.length > 10) value = value.replace(/(\d{5})(\d{4})$/, '$1-$2');
      e.target.value = value;
    });
  }
  if (elements.regWhatsapp) {
    elements.regWhatsapp.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 0) value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      if (value.length > 10) value = value.replace(/(\d{5})(\d{4})$/, '$1-$2');
      e.target.value = value;
    });
  }
}

function setupTodayDate() {
  if (elements.todayDate) elements.todayDate.textContent = new Date().toLocaleDateString('pt-BR');
}

function checkSavedSession() {
  const savedUser = Storage.getCurrentUser();
  if (savedUser) {
    currentUser = savedUser;
    showApp();
    return true;
  }
  return false;
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value;
  const users = Storage.getUsers();
  handleLogin(email, password, users, async (user) => {
    currentUser = user;
    await showApp();
  });
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const userData = {
    nome: elements.regNome.value.trim(),
    email: elements.regEmail.value.trim().toLowerCase(),
    whatsapp: elements.regWhatsapp.value.trim(),
    senha: elements.regPassword.value,
    confirmSenha: elements.regConfirmPassword.value
  };
  const users = Storage.getUsers();
  const result = handleRegister(userData, users, () => {
    if (elements.registerForm) elements.registerForm.reset();
    if (elements.registerPanel) elements.registerPanel.style.display = 'none';
    if (elements.loginPanel) elements.loginPanel.style.display = 'block';
  });
  if (!result.success) {
    if (result.error.includes('Nome')) document.getElementById('error-reg-nome').textContent = result.error;
    else if (result.error.includes('Email')) document.getElementById('error-reg-email').textContent = result.error;
    else if (result.error.includes('WhatsApp')) document.getElementById('error-reg-whatsapp').textContent = result.error;
    else if (result.error.includes('Senha')) document.getElementById('error-reg-password').textContent = result.error;
    else if (result.error.includes('coincidem')) document.getElementById('error-reg-confirm').textContent = result.error;
  }
}

async function showApp() {
  console.log('showApp chamado, usuário:', currentUser);

  if (elements.authScreen) elements.authScreen.classList.add('hidden');
  if (elements.appScreen) elements.appScreen.classList.remove('hidden');
  if (elements.userDisplay) elements.userDisplay.innerHTML = `<i class="bi bi-person-circle me-1"></i>${currentUser.displayName || currentUser.nome}`;

  if (currentUser.role === 'barbeiro') {
    await loadPainelBarbeiro();
  } else {
    await loadPainelCliente();
  }
  
  refreshLogos();  // <-- ADICIONAR ESTA LINHA
}

function updateServiceSelect() {
  if (!elements.agServico) return;
  if (services.length === 0) {
    elements.agServico.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    return;
  }
  elements.agServico.innerHTML = '<option value="">Selecione um serviço</option>' +
    services.map(s => `<option value="${s.id}">${s.name} - ${formatMoney(s.preco || 0)} (${formatarTempo(s.tempo || 30)})</option>`).join('');
}

function renderServicesList() {
  if (!elements.listaServicos) return;
  if (services.length === 0) {
    elements.listaServicos.innerHTML = '<div class="text-center py-3" style="color: #aaaaaa;">Nenhum serviço cadastrado</div>';
    return;
  }
  elements.listaServicos.innerHTML = services.map(service => `
    <div class="service-item">
      <div class="flex-grow-1">
        <span><i class="bi bi-scissors me-2"></i>${escapeHtml(service.name)}</span>
        <span class="badge bg-light text-dark ms-2">${formatMoney(service.preco || 0)}</span>
        <span class="badge bg-secondary ms-1">${formatarTempo(service.tempo || 30)}</span>
      </div>
      <div class="d-flex gap-2">
        <button onclick="window.openEditServiceModal(${service.id})" class="btn btn-sm btn-outline-light" title="Editar"><i class="bi bi-pencil"></i></button>
        <button onclick="window.confirmDeleteService(${service.id}, '${escapeHtml(service.name)}')" class="btn-delete"><i class="bi bi-trash"></i></button>
      </div>
    </div>
  `).join('');

  window.openEditServiceModal = (id) => {
    const service = services.find(s => s.id === id);
    if (!service) return;

    const modalElement = document.getElementById('editServiceModal');
    const nomeInput = document.getElementById('edit-service-nome');
    const precoInput = document.getElementById('edit-service-preco');
    const tempoInput = document.getElementById('edit-service-tempo');
    const confirmBtn = document.getElementById('editServiceConfirmBtn');

    nomeInput.value = service.name;
    precoInput.value = service.preco;
    tempoInput.value = service.tempo || 30;

    const modal = new bootstrap.Modal(modalElement);

    // Remove eventos anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
      const novoPreco = parseFloat(precoInput.value);
      const novoTempo = parseInt(tempoInput.value);

      if (isNaN(novoPreco) || novoPreco <= 0) {
        showToast('Digite um preço válido', 'error');
        return;
      }

      if (isNaN(novoTempo) || novoTempo < 5) {
        showToast('Digite um tempo válido (mínimo 5 minutos)', 'error');
        return;
      }

      service.preco = novoPreco;
      service.tempo = novoTempo;
      saveServices();
      renderServicesList();
      updateServiceSelect();
      modal.hide();
      showToast(`Serviço "${service.name}" atualizado!`, 'success');
    });

    modal.show();
  };

  window.confirmDeleteService = (id, name) => {
    showConfirmModal('Remover serviço', `Tem certeza que deseja remover o serviço "${name}"?`, () => {
      deleteService(id);
      renderServicesList();
      updateServiceSelect();
      showToast('Serviço removido com sucesso', 'success');
    });
  };
}

function setupPasswordToggles() {
  // Usar event delegation para capturar cliques em botões que podem ser adicionados dinamicamente
  document.body.addEventListener('click', function (e) {
    const button = e.target.closest('.toggle-password');
    if (!button) return;

    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');

    if (input && icon) {
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      } else {
        input.type = 'password';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      }
    }
  });
}

function handleAddServiceSubmit(e) {
  e.preventDefault();
  const serviceName = elements.svNome.value.trim();
  const servicePreco = parseFloat(elements.svPreco?.value);
  const serviceTempo = parseInt(elements.svTempo?.value) || 30;

  const result = addService(serviceName, servicePreco, serviceTempo);
  if (!result.success) {
    showToast(result.error, 'error');
    return;
  }
  renderServicesList();
  updateServiceSelect();
  elements.svNome.value = '';
  if (elements.svPreco) elements.svPreco.value = '';
  if (elements.svTempo) elements.svTempo.value = '30';
  showToast(`Serviço "${serviceName}" adicionado!`, 'success');
}

function renderTodosAgendamentos() {
  if (!elements.tbodyAgendamentos) return;
  const ativos = appointments.filter(a => a.status === 'agendado');
  if (ativos.length === 0) {
    elements.tbodyAgendamentos.innerHTML = `<tr class="text-center"><td colspan="8" style="color: #aaaaaa;">Nenhum agendamento ativo</td></tr>`;
    return;
  }
  const sortedApps = ordenarAgendamentos(ativos);
  elements.tbodyAgendamentos.innerHTML = sortedApps.map(app => {
    const dataFormatada = formatDateToBR(app.data);
    const domicilioIcon = app.domicilio ? '<i class="bi bi-house-heart text-success"></i>' : '<i class="bi bi-shop"></i>';
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${escapeHtml(app.hora)}</td>
        <td>${escapeHtml(app.cliente)}</td>
        <td>${escapeHtml(app.servicoNome)}</td>
        <td>${escapeHtml(app.whatsapp)}</td>
        <td>${formatMoney(app.valorFinal)}</td>
        <td>${domicilioIcon}</td>
        <td>
          <button onclick="window.marcarConcluido(${app.id})" class="btn btn-sm btn-outline-info me-1" title="Marcar como concluído"><i class="bi bi-check-lg"></i></button>
          <button onclick="window.prepareCancelAppointmentAdmin(${app.id})" class="btn-cancel"><i class="bi bi-x-circle"></i> Cancelar</button>
        </td>
      </tr>
    `;
  }).join('');

  window.marcarConcluido = (id) => {
    if (completeAppointment(id)) {
      renderTodosAgendamentos();
      renderConcluidos();
      renderMeusConcluidos();
      showToast('Agendamento marcado como concluído!', 'success');
    }
  };
  window.prepareCancelAppointmentAdmin = (id) => { pendingCancelId = id; showCancelModal((motivo) => confirmCancelWithReason(motivo)); };
}

function renderConcluidos() {
  if (!elements.tbodyConcluidos) return;
  const concluidos = appointments.filter(a => a.status === 'concluido');
  if (concluidos.length === 0) {
    elements.tbodyConcluidos.innerHTML = `<tr class="text-center"><td colspan="6" style="color: #aaaaaa;">Nenhum serviço concluído</td></tr>`;
    return;
  }
  const sorted = ordenarAgendamentos(concluidos);
  elements.tbodyConcluidos.innerHTML = sorted.map(app => {
    const dataFormatada = formatDateToBR(app.data);
    const atendidoEm = app.concluidoEm ? formatDateToBR(app.concluidoEm.split('T')[0]) : '-';
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${escapeHtml(app.hora)}</td>
        <td>${escapeHtml(app.cliente)}</td>
        <td>${escapeHtml(app.servicoNome)}</td>
        <td>${formatMoney(app.valorFinal)}</td>
        <td>${atendidoEm}</td>
      </tr>
    `;
  }).join('');
}

function renderHistoricoCancelamentos() {
  if (!elements.tbodyCancelamentos) return;
  if (cancellations.length === 0) {
    elements.tbodyCancelamentos.innerHTML = `<tr class="text-center"><td colspan="6" style="color: #aaaaaa;">Nenhum cancelamento registrado</td></tr>`;
    return;
  }
  const sorted = [...cancellations].reverse();
  elements.tbodyCancelamentos.innerHTML = sorted.map(cancel => `
    <tr>
      <td>${formatDateToBR(cancel.canceladoEm.split('T')[0])} ${cancel.canceladoEm.split('T')[1].slice(0, 5)}</td>
      <td>${escapeHtml(cancel.cliente)}</td>
      <td>${formatDateToBR(cancel.dataAgendamento)}</td>
      <td>${escapeHtml(cancel.horaAgendamento)}</td>
      <td><small>${escapeHtml(cancel.motivo)}</small></td>
      <td>${escapeHtml(cancel.canceladoPor)}</td>
    </tr>
  `).join('');
}

function renderMeusAgendamentos() {
  if (!elements.tbodyMeusAgendamentos) return;
  const meusAtivos = appointments.filter(a => a.cliente === currentUser.nome && a.status === 'agendado');
  if (meusAtivos.length === 0) {
    elements.tbodyMeusAgendamentos.innerHTML = `<tr class="text-center"><td colspan="7" style="color: #aaaaaa;">Nenhum agendamento ativo</td></tr>`;
    return;
  }
  const sorted = ordenarAgendamentos(meusAtivos);
  elements.tbodyMeusAgendamentos.innerHTML = sorted.map(app => {
    const dataFormatada = formatDateToBR(app.data);
    const domicilioIcon = app.domicilio ? '<i class="bi bi-house-heart text-success"></i> Sim' : '<i class="bi bi-shop"></i> Não';
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${escapeHtml(app.hora)}</td>
        <td>${escapeHtml(app.servicoNome)}</td>
        <td>${formatMoney(app.valorFinal)}</td>
        <td>${formatarTempo(app.tempoEstimado)}</td>
        <td>${domicilioIcon}</td>
        <td><button onclick="window.prepareCancelAppointment(${app.id})" class="btn-cancel"><i class="bi bi-x-circle"></i> Cancelar</button></td>
      </tr>
    `;
  }).join('');
  window.prepareCancelAppointment = (id) => { pendingCancelId = id; showCancelModal((motivo) => confirmCancelWithReason(motivo)); };
}

function renderMeusConcluidos() {
  if (!elements.tbodyMeusConcluidos) return;
  const meusConcluidos = appointments.filter(a => a.cliente === currentUser.nome && a.status === 'concluido');
  if (meusConcluidos.length === 0) {
    elements.tbodyMeusConcluidos.innerHTML = `<tr class="text-center"><td colspan="5" style="color: #aaaaaa;">Nenhum serviço concluído</td></tr>`;
    return;
  }
  const sorted = ordenarAgendamentos(meusConcluidos);
  elements.tbodyMeusConcluidos.innerHTML = sorted.map(app => {
    const dataFormatada = formatDateToBR(app.data);
    const atendidoEm = app.concluidoEm ? formatDateToBR(app.concluidoEm.split('T')[0]) : '-';
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${escapeHtml(app.hora)}</td>
        <td>${escapeHtml(app.servicoNome)}</td>
        <td>${formatMoney(app.valorFinal)}</td>
        <td>${atendidoEm}</td>
      </tr>
    `;
  }).join('');
}

function renderMeusCancelados() {
  if (!elements.tbodyMeusCancelados) return;
  const meusCancelados = appointments.filter(a => a.cliente === currentUser.nome && a.status === 'cancelado');
  if (meusCancelados.length === 0) {
    elements.tbodyMeusCancelados.innerHTML = `<tr class="text-center"><td colspan="5" style="color: #aaaaaa;">Nenhum cancelamento</td></tr>`;
    return;
  }
  const sorted = ordenarAgendamentos(meusCancelados);
  elements.tbodyMeusCancelados.innerHTML = sorted.map(app => {
    const dataFormatada = formatDateToBR(app.data);
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${escapeHtml(app.hora)}</td>
        <td>${escapeHtml(app.servicoNome)}</td>
        <td>${formatMoney(app.valorFinal)}</td>
        <td><small>${escapeHtml(app.motivoCancelamento || 'Não informado')}</small></td>
      </tr>
    `;
  }).join('');
}

function handleAppointmentSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    showToast('Preencha todos os campos corretamente', 'error');
    return;
  }

  const data = elements.agData.value;
  const hora = elements.agHora.value;
  const servicoId = parseInt(elements.agServico.value);
  const servico = services.find(s => s.id === servicoId);

  if (hasConflict(data, hora)) {
    showToast('❌ Este horário já está ocupado!', 'error');
    return;
  }

  let nomeCliente = elements.agNome.value.trim();
  let whatsappCliente = elements.agWhatsapp.value.trim();
  if (currentUser.role === 'cliente') {
    nomeCliente = currentUser.nome;
    whatsappCliente = currentUser.whatsapp || whatsappCliente;
  }

  const condicao = elements.agCondicao?.value || 'nenhuma';
  const domicilio = elements.agDomicilio?.checked || false;
  const calculo = calcularValorFinal(servico.preco, condicao, domicilio);
  const tempo = calcularTempoEstimado(servico.tempo || 30, condicao, domicilio);

  const newAppointment = {
    cliente: nomeCliente,
    whatsapp: whatsappCliente,
    servicoId: servicoId,
    servicoNome: servico.name,
    servicoPreco: servico.preco,
    servicoTempo: servico.tempo || 30,
    condicao: condicao,
    domicilio: domicilio,
    endereco: domicilio ? (elements.agEndereco?.value.trim() || '') : '',
    valorFinal: calculo.valorFinal,
    desconto: calculo.desconto,
    acrescimo: calculo.acrescimo,
    tempoEstimado: tempo,
    observacao: elements.agObservacao?.value.trim() || '',
    data: data,
    hora: hora
  };

  addAppointment(newAppointment);
  showToast(`✅ Agendamento confirmado para ${formatDateToBR(data)} às ${hora} - ${formatMoney(calculo.valorFinal)}`, 'success');

  elements.formAgendamento.reset();
  if (elements.agDomicilio) elements.agDomicilio.checked = false;
  const divEndereco = document.getElementById('div-endereco');
  if (divEndereco) divEndereco.style.display = 'none';
  resetSelection();
  renderCalendar(elements.calGrade, elements.calTitulo);
  if (elements.calGrade) {
    document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
  }

  if (currentUser.role === 'cliente') {
    if (elements.agNome) {
      elements.agNome.value = currentUser.nome;
      elements.agNome.disabled = true;
    }
    if (elements.agWhatsapp) elements.agWhatsapp.value = currentUser.whatsapp || '';
  }
  renderMeusAgendamentos();
  if (currentUser.role === 'barbeiro') renderTodosAgendamentos();
}

function confirmCancelWithReason(motivo) {
  if (cancelAppointment(pendingCancelId, motivo, currentUser?.displayName || currentUser?.nome || 'Sistema')) {
    showToast('✅ Agendamento cancelado com sucesso!', 'success');
    pendingCancelId = null;
    if (currentUser?.role === 'barbeiro') {
      renderTodosAgendamentos();
      renderHistoricoCancelamentos();
    } else {
      renderMeusAgendamentos();
      renderMeusCancelados();
    }
  } else {
    showToast('Agendamento não encontrado', 'error');
  }
}

function limparMeusConcluidos() {
  const meusConcluidos = appointments.filter(a => a.cliente === currentUser.nome && a.status === 'concluido');
  if (meusConcluidos.length === 0) {
    showToast('Você não tem serviços concluídos para limpar', 'info');
    return;
  }
  showConfirmModal('Limpar Concluídos', `Tem certeza que deseja remover ${meusConcluidos.length} serviço(s) concluído(s) do seu histórico?`, () => {
    appointments = appointments.filter(a => !(a.cliente === currentUser.nome && a.status === 'concluido'));
    saveAppointments();
    renderMeusConcluidos();
    showToast(`${meusConcluidos.length} serviço(s) concluído(s) removido(s)!`, 'success');
  });
}

function limparMeusCancelados() {
  const meusCancelados = appointments.filter(a => a.cliente === currentUser.nome && a.status === 'cancelado');
  if (meusCancelados.length === 0) {
    showToast('Você não tem agendamentos cancelados para limpar', 'info');
    return;
  }
  showConfirmModal('Limpar Cancelados', `Tem certeza que deseja remover ${meusCancelados.length} agendamento(s) cancelado(s) do seu histórico?`, () => {
    clearUserCancellations(currentUser.nome);
    renderMeusCancelados();
    showToast(`${meusCancelados.length} agendamento(s) cancelado(s) removido(s)!`, 'success');
  });
}

function limparConcluidos() {
  const concluidos = appointments.filter(a => a.status === 'concluido');
  if (concluidos.length === 0) {
    showToast('Não há serviços concluídos para limpar', 'info');
    return;
  }
  showConfirmModal('Limpar Concluídos', `Tem certeza que deseja remover ${concluidos.length} serviço(s) concluído(s) do histórico?`, () => {
    clearAllCompleted();
    renderConcluidos();
    renderMeusConcluidos();
    showToast(`${concluidos.length} serviço(s) concluído(s) removido(s)!`, 'success');
  });
}

function limparHistorico() {
  if (cancellations.length === 0) {
    showToast('Não há cancelamentos para limpar', 'info');
    return;
  }
  showConfirmModal('Limpar Histórico', 'Tem certeza que deseja limpar TODO o histórico de cancelamentos?', () => {
    clearAllCancellations();
    renderHistoricoCancelamentos();
    showToast('Histórico de cancelamentos limpo!', 'success');
  });
}

function validateNome() {
  const nome = elements.agNome.value.trim();
  if (nome.length < 3) {
    elements.agNome.classList.add('is-invalid');
    document.getElementById('error-nome').textContent = 'Nome deve ter pelo menos 3 caracteres';
    return false;
  }
  elements.agNome.classList.remove('is-invalid');
  document.getElementById('error-nome').textContent = '';
  return true;
}

function validateWhatsapp() {
  let whatsapp = elements.agWhatsapp.value.replace(/\D/g, '');
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    elements.agWhatsapp.classList.add('is-invalid');
    document.getElementById('error-whatsapp').textContent = 'WhatsApp inválido (ex: 11999999999)';
    return false;
  }
  elements.agWhatsapp.classList.remove('is-invalid');
  document.getElementById('error-whatsapp').textContent = '';
  return true;
}

function validateData() {
  const data = elements.agData.value;
  if (!data) {
    elements.agData.classList.add('is-invalid');
    document.getElementById('error-data').textContent = 'Selecione uma data';
    return false;
  }
  
  const partes = data.split('-');
  const ano = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1;
  const dia = parseInt(partes[2]);
  
  const hoje = new Date();
  const hojePadronizada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0);
  const dataSelecionada = new Date(ano, mes, dia, 12, 0, 0);
  
  if (dataSelecionada < hojePadronizada) {
    elements.agData.classList.add('is-invalid');
    document.getElementById('error-data').textContent = 'Não é permitido agendar em datas passadas';
    return false;
  }
  
  if (isFeriadoNacional(dataSelecionada)) {
    elements.agData.classList.add('is-invalid');
    document.getElementById('error-data').textContent = 'Não é permitido agendar em feriados nacionais';
    return false;
  }
  
  // Verifica se é domingo
  if (dataSelecionada.getDay() === 0) {
    elements.agData.classList.add('is-invalid');
    document.getElementById('error-data').textContent = 'Não é permitido agendar aos domingos';
    return false;
  }
  
  elements.agData.classList.remove('is-invalid');
  document.getElementById('error-data').textContent = '';
  return true;
}

function validateHora() {
  const hora = elements.agHora.value;
  if (!hora) {
    elements.agHora.classList.add('is-invalid');
    document.getElementById('error-hora').textContent = 'Selecione um horário';
    return false;
  }
  const hour = parseInt(hora.split(':')[0]);
  if (hour < 9 || hour > 20) {
    elements.agHora.classList.add('is-invalid');
    document.getElementById('error-hora').textContent = 'Horário comercial: 09:00 às 20:00';
    return false;
  }
  elements.agHora.classList.remove('is-invalid');
  document.getElementById('error-hora').textContent = '';
  return true;
}

function validateServico() {
  const servicoId = elements.agServico.value;
  if (!servicoId) {
    elements.agServico.classList.add('is-invalid');
    document.getElementById('error-servico').textContent = 'Selecione um serviço';
    return false;
  }
  elements.agServico.classList.remove('is-invalid');
  document.getElementById('error-servico').textContent = '';
  return true;
}

function validateEndereco() {
  const domicilio = elements.agDomicilio?.checked || false;
  if (domicilio) {
    const endereco = elements.agEndereco?.value.trim();
    if (!endereco) {
      elements.agEndereco.classList.add('is-invalid');
      document.getElementById('error-endereco').textContent = 'Endereço é obrigatório para atendimento domiciliar';
      return false;
    }
    elements.agEndereco.classList.remove('is-invalid');
    document.getElementById('error-endereco').textContent = '';
  }
  return true;
}

function validateForm() {
  return validateNome() && validateWhatsapp() && validateData() && validateHora() && validateServico() && validateEndereco();
}

function formatDateToBR(dateString) {
  if (!dateString) return '';
  const partes = dateString.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return dateString;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Iniciar aplicação
init();