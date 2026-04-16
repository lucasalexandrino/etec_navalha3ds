import { storage } from '../js/storage.js';
import { scheduler } from '../js/scheduler.js';
import { ui } from '../js/ui.js';

// Inicializar dados
storage.garantirDadosIniciais();

// Estado da aplicação
let state = {
  sessao: storage.lerSessao(),
  usuarios: storage.lerUsuarios(),
  barbeiros: storage.lerBarbeiros(),
  servicos: storage.lerServicos(),
  agendamentos: storage.lerAgendamentos(),
  currentTab: 'dashboard'
};

// Elementos DOM
const elements = {
  adminLogin: document.getElementById('adminLogin'),
  adminDashboard: document.getElementById('adminDashboard'),
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminEmail: document.getElementById('adminEmail'),
  adminSenha: document.getElementById('adminSenha'),
  adminLoginError: document.getElementById('adminLoginError'),
  btnFillDemo: document.getElementById('btnFillDemo'),
  adminLogout: document.getElementById('adminLogout'),
  adminUserName: document.getElementById('adminUserName'),
  pageTitle: document.getElementById('pageTitle'),
  filterData: document.getElementById('filterData'),
  filterBarbeiro: document.getElementById('filterBarbeiro'),
  btnHoje: document.getElementById('btnHoje'),
  kpiTotal: document.getElementById('kpiTotal'),
  kpiPix: document.getElementById('kpiPix'),
  kpiDinheiro: document.getElementById('kpiDinheiro'),
  kpiCartao: document.getElementById('kpiCartao'),
  kpiBoleto: document.getElementById('kpiBoleto'),
  pendentesList: document.getElementById('pendentesList'),
  agendaTableBody: document.getElementById('agendaTableBody'),
  servicosTableBody: document.getElementById('servicosTableBody'),
  barbeirosTableBody: document.getElementById('barbeirosTableBody'),
  btnNovoServico: document.getElementById('btnNovoServico'),
  btnNovoBarbeiro: document.getElementById('btnNovoBarbeiro'),
  servicoForm: document.getElementById('servicoForm'),
  barbeiroForm: document.getElementById('barbeiroForm'),
  servicoNome: document.getElementById('servicoNome'),
  servicoDuracao: document.getElementById('servicoDuracao'),
  servicoPreco: document.getElementById('servicoPreco'),
  barbeiroNome: document.getElementById('barbeiroNome'),
  btnCancelarServico: document.getElementById('btnCancelarServico'),
  btnCancelarBarbeiro: document.getElementById('btnCancelarBarbeiro'),
  modalConfirm: document.getElementById('modalConfirm'),
  confirmTitle: document.getElementById('confirmTitle'),
  confirmMessage: document.getElementById('confirmMessage'),
  confirmOk: document.getElementById('confirmOk'),
  confirmCancel: document.getElementById('confirmCancel')
};

// Helper functions
function showToast(message, type = 'success') {
  const container = document.getElementById('toastsContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatCurrency(centavos) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format((centavos || 0) / 100);
}

function formatDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusPill(status) {
  const statusMap = {
    'Pago': 'pill-pago',
    'Pendente': 'pill-pendente',
    'Cancelado': 'pill-cancelado'
  };
  return `<span class="pill ${statusMap[status] || 'pill-pendente'}">${status || 'Pendente'}</span>`;
}

// Função de confirmação
function confirmAction(title, message) {
  return new Promise((resolve) => {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.modalConfirm.showModal();
    
    const handleOk = () => {
      elements.modalConfirm.removeEventListener('close', handleClose);
      elements.confirmOk.removeEventListener('click', handleOk);
      elements.confirmCancel.removeEventListener('click', handleCancel);
      resolve(true);
      elements.modalConfirm.close();
    };
    
    const handleCancel = () => {
      elements.modalConfirm.removeEventListener('close', handleClose);
      elements.confirmOk.removeEventListener('click', handleOk);
      elements.confirmCancel.removeEventListener('click', handleCancel);
      resolve(false);
      elements.modalConfirm.close();
    };
    
    const handleClose = () => {
      elements.confirmOk.removeEventListener('click', handleOk);
      elements.confirmCancel.removeEventListener('click', handleCancel);
      resolve(false);
    };
    
    elements.confirmOk.addEventListener('click', handleOk);
    elements.confirmCancel.addEventListener('click', handleCancel);
    elements.modalConfirm.addEventListener('close', handleClose, { once: true });
  });
}

// Validar login
function validarLogin(email, senha) {
  const usuario = state.usuarios.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
  );
  return usuario && usuario.nivelAcesso === 'Admin' ? usuario : null;
}

function setSessao(usuario) {
  if (usuario) {
    state.sessao = {
      usuarioId: usuario.id,
      nivelAcesso: usuario.nivelAcesso,
      criadoEmIso: new Date().toISOString()
    };
    storage.salvarSessao(state.sessao);
  } else {
    state.sessao = null;
    storage.limparSessao();
  }
}

function getUsuarioAtual() {
  if (!state.sessao) return null;
  return state.usuarios.find(u => u.id === state.sessao.usuarioId);
}

function recarregarDados() {
  state.usuarios = storage.lerUsuarios();
  state.barbeiros = storage.lerBarbeiros();
  state.servicos = storage.lerServicos();
  state.agendamentos = storage.lerAgendamentos();
}

// Renderização
function renderDashboard() {
  const data = elements.filterData.value;
  const barbeiroId = elements.filterBarbeiro.value;
  
  const agendamentosFiltrados = state.agendamentos.filter(a => {
    if (a.dataYmd !== data) return false;
    if (barbeiroId !== 'todos' && a.barbeiroId !== barbeiroId) return false;
    return true;
  });
  
  const pagos = agendamentosFiltrados.filter(a => a.statusPagamento === 'Pago');
  const total = pagos.reduce((sum, a) => sum + (a.valorCentavos || 0), 0);
  
  const pixTotal = pagos.filter(a => a.metodoPagamento === 'Pix').reduce((sum, a) => sum + (a.valorCentavos || 0), 0);
  const dinheiroTotal = pagos.filter(a => a.metodoPagamento === 'Dinheiro').reduce((sum, a) => sum + (a.valorCentavos || 0), 0);
  const cartaoTotal = pagos.filter(a => ['CartaoCredito', 'CartaoDebito'].includes(a.metodoPagamento)).reduce((sum, a) => sum + (a.valorCentavos || 0), 0);
  const boletoTotal = pagos.filter(a => a.metodoPagamento === 'Boleto').reduce((sum, a) => sum + (a.valorCentavos || 0), 0);
  
  elements.kpiTotal.textContent = formatCurrency(total);
  elements.kpiPix.textContent = formatCurrency(pixTotal);
  elements.kpiDinheiro.textContent = formatCurrency(dinheiroTotal);
  elements.kpiCartao.textContent = formatCurrency(cartaoTotal);
  elements.kpiBoleto.textContent = formatCurrency(boletoTotal);
  
  // Pendentes
  const pendentes = agendamentosFiltrados.filter(a => a.statusPagamento === 'Pendente');
  if (pendentes.length === 0) {
    elements.pendentesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #8b8b96;">Nenhum pagamento pendente</div>';
  } else {
    elements.pendentesList.innerHTML = pendentes.map(ag => {
      const servico = state.servicos.find(s => s.id === ag.servicoId);
      const barbeiro = state.barbeiros.find(b => b.id === ag.barbeiroId);
      return `
        <div class="pendente-item">
          <div class="pendente-info">
            <span class="pendente-nome">${ag.clienteNome}</span>
            <span class="pendente-detalhes">${servico?.nome || '—'} • ${barbeiro?.nome || '—'} • ${formatTime(ag.inicioIso)}</span>
          </div>
          <div class="pendente-valor">${formatCurrency(ag.valorCentavos)}</div>
          <button class="btn-action" onclick="window.marcarPago('${ag.id}')">
            <i class="fas fa-check"></i> Marcar Pago
          </button>
        </div>
      `;
    }).join('');
  }
}

function renderAgenda() {
  const data = elements.filterData.value;
  const barbeiroId = elements.filterBarbeiro.value;
  
  const agendamentos = state.agendamentos.filter(a => {
    if (a.dataYmd !== data) return false;
    if (barbeiroId !== 'todos' && a.barbeiroId !== barbeiroId) return false;
    return true;
  }).sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));
  
  if (agendamentos.length === 0) {
    elements.agendaTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #8b8b96;">Nenhum agendamento encontrado</td></tr>';
    return;
  }
  
  elements.agendaTableBody.innerHTML = agendamentos.map(ag => {
    const servico = state.servicos.find(s => s.id === ag.servicoId);
    const barbeiro = state.barbeiros.find(b => b.id === ag.barbeiroId);
    return `
      <tr>
        <td>${formatTime(ag.inicioIso)}</td>
        <td>${ag.clienteNome}</td>
        <td>${servico?.nome || '—'}</td>
        <td>${barbeiro?.nome || '—'}</td>
        <td>${formatCurrency(ag.valorCentavos)}</td>
        <td>${ag.metodoPagamento === 'CartaoCredito' ? 'Cartão Crédito' : ag.metodoPagamento === 'CartaoDebito' ? 'Cartão Débito' : ag.metodoPagamento}</td>
        <td>${getStatusPill(ag.statusPagamento)}</td>
        <td>
          ${ag.statusPagamento !== 'Cancelado' ? `<button class="btn-action" onclick="window.cancelarAgendamento('${ag.id}')"><i class="fas fa-times"></i> Cancelar</button>` : ''}
          ${ag.statusPagamento === 'Pendente' ? `<button class="btn-action" onclick="window.marcarPago('${ag.id}')"><i class="fas fa-check"></i> Pago</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function renderServicos() {
  if (state.servicos.length === 0) {
    elements.servicosTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #8b8b96;">Nenhum serviço cadastrado</td></tr>';
    return;
  }
  
  elements.servicosTableBody.innerHTML = state.servicos.map(s => `
    <tr>
      <td>${s.nome}</td>
      <td>${s.duracaoMinutos} min</td>
      <td>${formatCurrency(s.precoCentavos)}</td>
      <td>
        <button class="btn-action" onclick="window.editarServico('${s.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn-action btn-danger" onclick="window.excluirServico('${s.id}')">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </td>
    </tr>
  `).join('');
}

function renderBarbeiros() {
  if (state.barbeiros.length === 0) {
    elements.barbeirosTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #8b8b96;">Nenhum barbeiro cadastrado</td></tr>';
    return;
  }
  
  elements.barbeirosTableBody.innerHTML = state.barbeiros.map(b => `
    <tr>
      <td>${b.nome}</td>
      <td><code>${b.id}</code></td>
      <td>
        <button class="btn-action" onclick="window.editarBarbeiro('${b.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn-action btn-danger" onclick="window.excluirBarbeiro('${b.id}')">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </td>
    </tr>
  `).join('');
}

function carregarFiltros() {
  // Data
  const hoje = new Date().toISOString().split('T')[0];
  elements.filterData.value = hoje;
  
  // Barbeiros
  elements.filterBarbeiro.innerHTML = '<option value="todos">Todos</option>';
  state.barbeiros.forEach(b => {
    const option = document.createElement('option');
    option.value = b.id;
    option.textContent = b.name || b.nome;
    elements.filterBarbeiro.appendChild(option);
  });
}

function mudarTab(tab) {
  state.currentTab = tab;
  
  // Atualizar navegação
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) btn.classList.add('active');
  });
  
  // Esconder todos os tabs
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Mostrar tab selecionado
  const tabMap = {
    dashboard: 'tabDashboard',
    agenda: 'tabAgenda',
    servicos: 'tabServicos',
    barbeiros: 'tabBarbeiros'
  };
  
  document.getElementById(tabMap[tab]).style.display = 'block';
  
  // Atualizar título
  const titles = {
    dashboard: 'Dashboard',
    agenda: 'Agenda',
    servicos: 'Serviços',
    barbeiros: 'Barbeiros'
  };
  elements.pageTitle.textContent = titles[tab];
  
  // Renderizar conteúdo
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'agenda') renderAgenda();
  else if (tab === 'servicos') renderServicos();
  else if (tab === 'barbeiros') renderBarbeiros();
}

// Ações
async function marcarPago(agendamentoId) {
  const ag = state.agendamentos.find(a => a.id === agendamentoId);
  if (!ag) return;
  
  const confirmado = await confirmAction('Confirmar pagamento', `Marcar pagamento de ${ag.clienteNome} como PAGO?`);
  if (!confirmado) return;
  
  ag.statusPagamento = 'Pago';
  ag.pagoEmIso = new Date().toISOString();
  storage.salvarAgendamentos(state.agendamentos);
  
  showToast(`Pagamento de ${ag.clienteNome} confirmado!`, 'success');
  recarregarDados();
  if (state.currentTab === 'dashboard') renderDashboard();
  if (state.currentTab === 'agenda') renderAgenda();
}

async function cancelarAgendamento(agendamentoId) {
  const ag = state.agendamentos.find(a => a.id === agendamentoId);
  if (!ag) return;
  
  const confirmado = await confirmAction('Cancelar agendamento', `Cancelar agendamento de ${ag.clienteNome}? Esta ação não pode ser desfeita.`);
  if (!confirmado) return;
  
  ag.statusPagamento = 'Cancelado';
  ag.canceladoEmIso = new Date().toISOString();
  storage.salvarAgendamentos(state.agendamentos);
  
  showToast(`Agendamento de ${ag.clienteNome} cancelado!`, 'warning');
  recarregarDados();
  if (state.currentTab === 'dashboard') renderDashboard();
  if (state.currentTab === 'agenda') renderAgenda();
}

async function excluirServico(servicoId) {
  const servico = state.servicos.find(s => s.id === servicoId);
  if (!servico) return;
  
  const confirmado = await confirmAction('Excluir serviço', `Excluir "${servico.nome}"? Esta ação não pode ser desfeita.`);
  if (!confirmado) return;
  
  state.servicos = state.servicos.filter(s => s.id !== servicoId);
  storage.salvarServicos(state.servicos);
  
  showToast(`Serviço "${servico.nome}" excluído!`, 'success');
  recarregarDados();
  renderServicos();
}

async function excluirBarbeiro(barbeiroId) {
  const barbeiro = state.barbeiros.find(b => b.id === barbeiroId);
  if (!barbeiro) return;
  
  const confirmado = await confirmAction('Excluir barbeiro', `Excluir "${barbeiro.nome}"? Esta ação não pode ser desfeita.`);
  if (!confirmado) return;
  
  state.barbeiros = state.barbeiros.filter(b => b.id !== barbeiroId);
  storage.salvarBarbeiros(state.barbeiros);
  
  showToast(`Barbeiro "${barbeiro.nome}" excluído!`, 'success');
  recarregarDados();
  renderBarbeiros();
  carregarFiltros();
}

function editarServico(servicoId) {
  const servico = state.servicos.find(s => s.id === servicoId);
  if (!servico) return;
  
  elements.servicoNome.value = servico.nome;
  elements.servicoDuracao.value = servico.duracaoMinutos;
  elements.servicoPreco.value = (servico.precoCentavos / 100).toFixed(2).replace('.', ',');
  elements.servicoForm.style.display = 'block';
  
  // Remove form submit handler and add edit mode
  const form = elements.servicoForm;
  const oldSubmit = form.onsubmit;
  form.onsubmit = (e) => {
    e.preventDefault();
    const nome = elements.servicoNome.value.trim();
    const duracao = parseInt(elements.servicoDuracao.value);
    const precoStr = elements.servicoPreco.value.replace(',', '.');
    const preco = parseFloat(precoStr);
    
    if (!nome) {
      showToast('Digite o nome do serviço', 'error');
      return;
    }
    if (isNaN(duracao) || duracao < 10) {
      showToast('Duração mínima de 10 minutos', 'error');
      return;
    }
    if (isNaN(preco) || preco <= 0) {
      showToast('Digite um preço válido', 'error');
      return;
    }
    
    servico.nome = nome;
    servico.duracaoMinutos = duracao;
    servico.precoCentavos = Math.round(preco * 100);
    storage.salvarServicos(state.servicos);
    
    showToast('Serviço atualizado!', 'success');
    elements.servicoForm.style.display = 'none';
    elements.servicoNome.value = '';
    elements.servicoDuracao.value = '30';
    elements.servicoPreco.value = '';
    form.onsubmit = oldSubmit;
    recarregarDados();
    renderServicos();
  };
}

function editarBarbeiro(barbeiroId) {
  const barbeiro = state.barbeiros.find(b => b.id === barbeiroId);
  if (!barbeiro) return;
  
  elements.barbeiroNome.value = barbeiro.nome;
  elements.barbeiroForm.style.display = 'block';
  
  const form = elements.barbeiroForm;
  const oldSubmit = form.onsubmit;
  form.onsubmit = (e) => {
    e.preventDefault();
    const nome = elements.barbeiroNome.value.trim();
    if (!nome) {
      showToast('Digite o nome do barbeiro', 'error');
      return;
    }
    
    barbeiro.nome = nome;
    storage.salvarBarbeiros(state.barbeiros);
    
    showToast('Barbeiro atualizado!', 'success');
    elements.barbeiroForm.style.display = 'none';
    elements.barbeiroNome.value = '';
    form.onsubmit = oldSubmit;
    recarregarDados();
    renderBarbeiros();
    carregarFiltros();
  };
}

function adicionarServico(e) {
  e.preventDefault();
  const nome = elements.servicoNome.value.trim();
  const duracao = parseInt(elements.servicoDuracao.value);
  const precoStr = elements.servicoPreco.value.replace(',', '.');
  const preco = parseFloat(precoStr);
  
  if (!nome) {
    showToast('Digite o nome do serviço', 'error');
    return;
  }
  if (isNaN(duracao) || duracao < 10) {
    showToast('Duração mínima de 10 minutos', 'error');
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    showToast('Digite um preço válido', 'error');
    return;
  }
  
  const novoServico = {
    id: storage.gerarId('srv'),
    nome: nome,
    duracaoMinutos: duracao,
    precoCentavos: Math.round(preco * 100)
  };
  
  state.servicos.push(novoServico);
  storage.salvarServicos(state.servicos);
  
  showToast(`Serviço "${nome}" adicionado!`, 'success');
  elements.servicoForm.style.display = 'none';
  elements.servicoNome.value = '';
  elements.servicoDuracao.value = '30';
  elements.servicoPreco.value = '';
  recarregarDados();
  renderServicos();
}

function adicionarBarbeiro(e) {
  e.preventDefault();
  const nome = elements.barbeiroNome.value.trim();
  if (!nome) {
    showToast('Digite o nome do barbeiro', 'error');
    return;
  }
  
  const novoBarbeiro = {
    id: storage.gerarId('barb'),
    nome: nome
  };
  
  state.barbeiros.push(novoBarbeiro);
  storage.salvarBarbeiros(state.barbeiros);
  
  showToast(`Barbeiro "${nome}" adicionado!`, 'success');
  elements.barbeiroForm.style.display = 'none';
  elements.barbeiroNome.value = '';
  recarregarDados();
  renderBarbeiros();
  carregarFiltros();
}

// Login
function fazerLogin(e) {
  e.preventDefault();
  const email = elements.adminEmail.value;
  const senha = elements.adminSenha.value;
  
  const usuario = validarLogin(email, senha);
  if (!usuario) {
    elements.adminLoginError.textContent = 'E-mail ou senha inválidos';
    return;
  }
  
  setSessao(usuario);
  elements.adminLogin.style.display = 'none';
  elements.adminDashboard.style.display = 'flex';
  elements.adminUserName.textContent = usuario.nome;
  
  recarregarDados();
  carregarFiltros();
  mudarTab('dashboard');
  showToast(`Bem-vindo, ${usuario.nome}!`, 'success');
}

function logout() {
  setSessao(null);
  elements.adminLogin.style.display = 'flex';
  elements.adminDashboard.style.display = 'none';
  elements.adminEmail.value = '';
  elements.adminSenha.value = '';
  showToast('Logout realizado com sucesso', 'success');
}

// Eventos
function setupEventListeners() {
  elements.adminLoginForm.addEventListener('submit', fazerLogin);
  elements.btnFillDemo.addEventListener('click', () => {
    elements.adminEmail.value = 'admin@navalha.com';
    elements.adminSenha.value = '1234';
  });
  elements.adminLogout.addEventListener('click', logout);
  elements.btnHoje.addEventListener('click', () => {
    const hoje = new Date().toISOString().split('T')[0];
    elements.filterData.value = hoje;
    if (state.currentTab === 'dashboard') renderDashboard();
    if (state.currentTab === 'agenda') renderAgenda();
  });
  elements.filterData.addEventListener('change', () => {
    if (state.currentTab === 'dashboard') renderDashboard();
    if (state.currentTab === 'agenda') renderAgenda();
  });
  elements.filterBarbeiro.addEventListener('change', () => {
    if (state.currentTab === 'dashboard') renderDashboard();
    if (state.currentTab === 'agenda') renderAgenda();
  });
  
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => mudarTab(btn.dataset.tab));
  });
  
  elements.btnNovoServico.addEventListener('click', () => {
    elements.servicoForm.style.display = 'block';
    elements.servicoNome.value = '';
    elements.servicoDuracao.value = '30';
    elements.servicoPreco.value = '';
    elements.servicoForm.onsubmit = adicionarServico;
  });
  
  elements.btnNovoBarbeiro.addEventListener('click', () => {
    elements.barbeiroForm.style.display = 'block';
    elements.barbeiroNome.value = '';
    elements.barbeiroForm.onsubmit = adicionarBarbeiro;
  });
  
  elements.btnCancelarServico.addEventListener('click', () => {
    elements.servicoForm.style.display = 'none';
  });
  
  elements.btnCancelarBarbeiro.addEventListener('click', () => {
    elements.barbeiroForm.style.display = 'none';
  });
}

// Expor funções globalmente
window.marcarPago = marcarPago;
window.cancelarAgendamento = cancelarAgendamento;
window.excluirServico = excluirServico;
window.excluirBarbeiro = excluirBarbeiro;
window.editarServico = editarServico;
window.editarBarbeiro = editarBarbeiro;

// Inicializar
function init() {
  setupEventListeners();
  
  const usuario = getUsuarioAtual();
  if (usuario && usuario.nivelAcesso === 'Admin') {
    elements.adminLogin.style.display = 'none';
    elements.adminDashboard.style.display = 'flex';
    elements.adminUserName.textContent = usuario.nome;
    recarregarDados();
    carregarFiltros();
    mudarTab('dashboard');
  } else {
    elements.adminLogin.style.display = 'flex';
    elements.adminDashboard.style.display = 'none';
  }
}

init();