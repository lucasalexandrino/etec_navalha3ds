// Navalha Barbearia - App Principal
import { storage } from './storage.js';
import { scheduler } from './scheduler.js';

// Inicializar dados
storage.garantirDadosIniciais();

// Estado Global
let state = {
  sessao: storage.getSessao(),
  usuarios: storage.getUsuarios(),
  barbeiros: storage.getBarbeiros(),
  servicos: storage.getServicos(),
  agendamentos: storage.getAgendamentos(),
  barbeiroOffset: 0,
  clienteSelecionado: {
    barbeiroId: null,
    dataYmd: null,
    servicoId: null,
    horario: null,
    pagamento: 'Pix'
  }
};

// Elementos DOM
const elements = {
  loginWrapper: document.getElementById('loginWrapper'),
  clienteWrapper: document.getElementById('clienteWrapper'),
  barbeiroWrapper: document.getElementById('barbeiroWrapper'),
  
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginSenha: document.getElementById('loginSenha'),
  
  btnLogoutCliente: document.getElementById('btnLogoutCliente'),
  btnLogoutBarbeiro: document.getElementById('btnLogoutBarbeiro'),
  
  clienteNome: document.getElementById('clienteNome'),
  barbeiroNome: document.getElementById('barbeiroNome'),
  
  clienteBarbeiro: document.getElementById('clienteBarbeiro'),
  clienteData: document.getElementById('clienteData'),
  clienteServico: document.getElementById('clienteServico'),
  
  resumoServico: document.getElementById('resumoServico'),
  resumoDuracao: document.getElementById('resumoDuracao'),
  resumoValor: document.getElementById('resumoValor'),
  
  slotsContainer: document.getElementById('slotsContainer'),
  btnConfirmar: document.getElementById('btnConfirmar'),
  historicoContainer: document.getElementById('historicoContainer'),
  
  semanaLabel: document.getElementById('semanaLabel'),
  weekGrid: document.getElementById('weekGrid'),
  todayList: document.getElementById('todayList'),
  semanaPrev: document.getElementById('semanaPrev'),
  semanaNext: document.getElementById('semanaNext'),
  
  modalPix: document.getElementById('modalPix'),
  pixValor: document.getElementById('pixValor'),
  pixCanvas: document.getElementById('pixCanvas'),
  btnSimularPix: document.getElementById('btnSimularPix')
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatarData(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

function formatarHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarMoeda(centavos) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format((centavos || 0) / 100);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getUsuarioAtual() {
  if (!state.sessao) return null;
  return state.usuarios.find(u => u.id === state.sessao.usuarioId);
}

function setSessao(usuario) {
  if (usuario) {
    state.sessao = {
      usuarioId: usuario.id,
      nivelAcesso: usuario.nivelAcesso,
      criadoEm: new Date().toISOString()
    };
    storage.setSessao(state.sessao);
  } else {
    state.sessao = null;
    storage.clearSessao();
  }
}

function recarregarDados() {
  state.usuarios = storage.getUsuarios();
  state.barbeiros = storage.getBarbeiros();
  state.servicos = storage.getServicos();
  state.agendamentos = storage.getAgendamentos();
}

function salvarAgendamentos() {
  storage.setAgendamentos(state.agendamentos);
}

// ============================================
// LOGIN
// ============================================

window.preencherLogin = (role) => {
  const credentials = {
    cliente: { email: 'cliente@navalha.com', senha: '1234' },
    barbeiro: { email: 'barbeiro@navalha.com', senha: '1234' }
  };
  
  const cred = credentials[role];
  if (cred) {
    document.getElementById('loginEmail').value = cred.email;
    document.getElementById('loginSenha').value = cred.senha;
    fazerLogin(cred.email, cred.senha);
  }
};

function fazerLogin(email, senha) {
  const usuario = state.usuarios.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
  );
  
  if (!usuario) {
    showToast('E-mail ou senha inválidos', 'error');
    return false;
  }
  
  setSessao(usuario);
  showToast(`Bem-vindo, ${usuario.nome}!`, 'success');
  
  // Esconder login e mostrar área correta
  elements.loginWrapper.style.display = 'none';
  
  if (usuario.nivelAcesso === 'Cliente') {
    elements.clienteWrapper.style.display = 'block';
    elements.barbeiroWrapper.style.display = 'none';
    iniciarCliente(usuario);
  } else if (usuario.nivelAcesso === 'Barbeiro') {
    elements.clienteWrapper.style.display = 'none';
    elements.barbeiroWrapper.style.display = 'block';
    iniciarBarbeiro(usuario);
  }
  
  return true;
}

function logout() {
  setSessao(null);
  elements.loginWrapper.style.display = 'flex';
  elements.clienteWrapper.style.display = 'none';
  elements.barbeiroWrapper.style.display = 'none';
  showToast('Logout realizado com sucesso', 'success');
}

// ============================================
// FUNÇÕES DO CLIENTE
// ============================================

function iniciarCliente(usuario) {
  elements.clienteNome.textContent = usuario.nome;
  
  // Carregar selects
  carregarSelectsCliente();
  configurarDataMinima();
  carregarSlots();
  atualizarResumo();
  carregarHistorico();
  
  // Configurar eventos
  elements.clienteBarbeiro.onchange = () => {
    state.clienteSelecionado.barbeiroId = elements.clienteBarbeiro.value;
    carregarSlots();
  };
  
  elements.clienteData.onchange = () => {
    state.clienteSelecionado.dataYmd = elements.clienteData.value;
    carregarSlots();
  };
  
  elements.clienteServico.onchange = () => {
    state.clienteSelecionado.servicoId = elements.clienteServico.value;
    atualizarResumo();
    carregarSlots();
  };
  
  // Pagamento
  document.querySelectorAll('input[name="pagamento"]').forEach(input => {
    input.onchange = () => {
      if (input.checked) {
        state.clienteSelecionado.pagamento = input.value;
      }
    };
  });
  
  elements.btnConfirmar.onclick = confirmarAgendamento;
  elements.btnLogoutCliente.onclick = logout;
  
  // Tabs
  document.querySelectorAll('.cliente-tabs .tab-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.cliente-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
      
      if (tab === 'historico') {
        carregarHistorico();
      }
    };
  });
}

function carregarSelectsCliente() {
  // Barbeiros
  elements.clienteBarbeiro.innerHTML = '<option value="">Selecione um barbeiro</option>';
  state.barbeiros.forEach(b => {
    const option = document.createElement('option');
    option.value = b.id;
    option.textContent = b.nome;
    elements.clienteBarbeiro.appendChild(option);
  });
  
  // Serviços
  elements.clienteServico.innerHTML = '<option value="">Selecione um serviço</option>';
  state.servicos.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = `${s.nome} - ${s.duracaoMinutos}min - ${formatarMoeda(s.precoCentavos)}`;
    elements.clienteServico.appendChild(option);
  });
}

function configurarDataMinima() {
  const hoje = new Date().toISOString().split('T')[0];
  elements.clienteData.min = hoje;
  elements.clienteData.value = hoje;
  state.clienteSelecionado.dataYmd = hoje;
}

function atualizarResumo() {
  const servico = state.servicos.find(s => s.id === state.clienteSelecionado.servicoId);
  if (servico) {
    elements.resumoServico.textContent = servico.nome;
    elements.resumoDuracao.textContent = `${servico.duracaoMinutos} minutos`;
    elements.resumoValor.textContent = formatarMoeda(servico.precoCentavos);
  } else {
    elements.resumoServico.textContent = '—';
    elements.resumoDuracao.textContent = '—';
    elements.resumoValor.textContent = 'R$ 0,00';
  }
}

function carregarSlots() {
  const { barbeiroId, dataYmd, servicoId } = state.clienteSelecionado;
  
  if (!barbeiroId || !dataYmd || !servicoId) {
    elements.slotsContainer.innerHTML = `
      <div class="slots-empty">
        <i class="fas fa-calendar-day"></i>
        <p>Selecione barbeiro, data e serviço</p>
      </div>
    `;
    elements.btnConfirmar.disabled = true;
    return;
  }
  
  const servico = state.servicos.find(s => s.id === servicoId);
  if (!servico) return;
  
  const data = new Date(dataYmd);
  if (!scheduler.isDiaUtil(data)) {
    elements.slotsContainer.innerHTML = `
      <div class="slots-empty">
        <i class="fas fa-calendar-times"></i>
        <p>Apenas dias úteis (segunda a sexta)</p>
      </div>
    `;
    elements.btnConfirmar.disabled = true;
    return;
  }
  
  const agendamentosDia = state.agendamentos.filter(a =>
    a.barbeiroId === barbeiroId &&
    a.dataYmd === dataYmd &&
    a.statusPagamento !== 'Cancelado'
  );
  
  const slots = scheduler.gerarSlots(dataYmd, servico.duracaoMinutos, agendamentosDia);
  
  if (slots.length === 0) {
    elements.slotsContainer.innerHTML = `
      <div class="slots-empty">
        <i class="fas fa-clock"></i>
        <p>Nenhum horário disponível</p>
      </div>
    `;
    elements.btnConfirmar.disabled = true;
    return;
  }
  
  elements.slotsContainer.innerHTML = '<div class="slots-grid"></div>';
  const grid = elements.slotsContainer.querySelector('.slots-grid');
  
  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.className = `slot ${slot.disponivel ? '' : 'disabled'}`;
    btn.textContent = slot.hora;
    
    if (slot.disponivel) {
      btn.onclick = () => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
        state.clienteSelecionado.horario = slot.hora;
        elements.btnConfirmar.disabled = false;
      };
    }
    
    grid.appendChild(btn);
  });
}

async function confirmarAgendamento() {
  const usuario = getUsuarioAtual();
  if (!usuario || usuario.nivelAcesso !== 'Cliente') return;
  
  const { barbeiroId, dataYmd, servicoId, horario, pagamento } = state.clienteSelecionado;
  
  if (!barbeiroId || !dataYmd || !servicoId || !horario) {
    showToast('Preencha todos os campos', 'error');
    return;
  }
  
  const servico = state.servicos.find(s => s.id === servicoId);
  const barbeiro = state.barbeiros.find(b => b.id === barbeiroId);
  
  if (!servico || !barbeiro) return;
  
  const inicio = scheduler.criarData(dataYmd, horario);
  const fim = scheduler.addMinutes(inicio, servico.duracaoMinutos);
  
  // Verificar conflito
  const agendamentosDia = state.agendamentos.filter(a =>
    a.barbeiroId === barbeiroId &&
    a.dataYmd === dataYmd &&
    a.statusPagamento !== 'Cancelado'
  );
  
  if (scheduler.hasConflito(inicio, fim, agendamentosDia)) {
    showToast('Este horário não está mais disponível', 'error');
    carregarSlots();
    return;
  }
  
  const novoAgendamento = {
    id: storage.generateId('ag'),
    criadoEm: new Date().toISOString(),
    clienteUsuarioId: usuario.id,
    clienteNome: usuario.nome,
    barbeiroId,
    barbeiroNome: barbeiro.nome,
    servicoId,
    servicoNome: servico.nome,
    dataYmd,
    inicioIso: inicio.toISOString(),
    fimIso: fim.toISOString(),
    duracaoMinutos: servico.duracaoMinutos,
    valorCentavos: servico.precoCentavos,
    metodoPagamento: pagamento,
    statusPagamento: 'Pendente',
    concluido: false
  };
  
  state.agendamentos.push(novoAgendamento);
  salvarAgendamentos();
  
  showToast('Agendamento realizado com sucesso!', 'success');
  
  // Limpar seleção
  state.clienteSelecionado.horario = null;
  elements.btnConfirmar.disabled = true;
  carregarSlots();
  
  // Se for Pix, abrir modal
  if (pagamento === 'Pix') {
    abrirModalPix(novoAgendamento);
  }
}

function abrirModalPix(agendamento) {
  elements.pixValor.textContent = formatarMoeda(agendamento.valorCentavos);
  desenharQRCode();
  elements.modalPix.showModal();
  
  elements.btnSimularPix.onclick = () => {
    const ag = state.agendamentos.find(a => a.id === agendamento.id);
    if (ag) {
      ag.statusPagamento = 'Pago';
      salvarAgendamentos();
      showToast('Pagamento simulado com sucesso!', 'success');
      elements.modalPix.close();
      carregarHistorico();
    }
  };
}

function desenharQRCode() {
  const canvas = elements.pixCanvas;
  const ctx = canvas.getContext('2d');
  const size = 200;
  canvas.width = size;
  canvas.height = size;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  const cellSize = size / 25;
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      } else if (Math.random() > 0.7) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
}

function carregarHistorico() {
  const usuario = getUsuarioAtual();
  if (!usuario) return;
  
  const meusAgendamentos = state.agendamentos
    .filter(a => a.clienteUsuarioId === usuario.id)
    .sort((a, b) => new Date(b.inicioIso) - new Date(a.inicioIso));
  
  if (meusAgendamentos.length === 0) {
    elements.historicoContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <p>Você ainda não tem nenhum agendamento</p>
      </div>
    `;
    return;
  }
  
  elements.historicoContainer.innerHTML = meusAgendamentos.map(ag => `
    <div class="historico-card">
      <div class="historico-info">
        <div class="historico-data">
          <span><i class="fas fa-calendar"></i> ${formatarData(ag.dataYmd)}</span>
          <span><i class="fas fa-clock"></i> ${formatarHora(ag.inicioIso)}</span>
        </div>
        <div class="historico-servico">${ag.servicoNome}</div>
        <div class="historico-detalhes">
          ${ag.barbeiroNome} • ${formatarMoeda(ag.valorCentavos)} • ${ag.metodoPagamento}
        </div>
      </div>
      <div class="status-pill ${ag.statusPagamento === 'Pago' ? 'status-pago' : ag.statusPagamento === 'Cancelado' ? 'status-cancelado' : 'status-pendente'}">
        ${ag.statusPagamento || 'Pendente'}
      </div>
    </div>
  `).join('');
}

// ============================================
// FUNÇÕES DO BARBEIRO
// ============================================

function iniciarBarbeiro(usuario) {
  elements.barbeiroNome.textContent = usuario.nome;
  
  carregarSemanaBarbeiro();
  carregarHojeBarbeiro();
  
  elements.semanaPrev.onclick = () => {
    state.barbeiroOffset--;
    carregarSemanaBarbeiro();
  };
  
  elements.semanaNext.onclick = () => {
    state.barbeiroOffset++;
    carregarSemanaBarbeiro();
  };
  
  elements.btnLogoutBarbeiro.onclick = logout;
  
  // Tabs
  document.querySelectorAll('.barbeiro-tabs .tab-btn').forEach(btn => {
    btn.onclick = () => {
      const view = btn.dataset.barber;
      document.querySelectorAll('.barbeiro-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.barber-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(`barber${view.charAt(0).toUpperCase() + view.slice(1)}`).classList.add('active');
      
      if (view === 'hoje') {
        carregarHojeBarbeiro();
      }
    };
  });
}

function getSemana() {
  const hoje = new Date();
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - hoje.getDay() + 1 + (state.barbeiroOffset * 7));
  
  const dias = [];
  for (let i = 0; i < 5; i++) {
    const dia = new Date(segunda);
    dia.setDate(segunda.getDate() + i);
    dias.push(dia);
  }
  return dias;
}

function carregarSemanaBarbeiro() {
  const usuario = getUsuarioAtual();
  if (!usuario || usuario.nivelAcesso !== 'Barbeiro') return;
  
  const barbeiroId = usuario.barbeiroId;
  const dias = getSemana();
  
  const inicio = dias[0];
  const fim = dias[4];
  elements.semanaLabel.textContent = `${formatarData(inicio.toISOString().split('T')[0])} - ${formatarData(fim.toISOString().split('T')[0])}`;
  
  elements.weekGrid.innerHTML = '';
  
  for (const dia of dias) {
    const dataYmd = dia.toISOString().split('T')[0];
    const agendamentosDia = state.agendamentos
      .filter(a => a.barbeiroId === barbeiroId && a.dataYmd === dataYmd && a.statusPagamento !== 'Cancelado')
      .sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));
    
    const weekCard = document.createElement('div');
    weekCard.className = 'week-card';
    weekCard.innerHTML = `
      <div class="week-header">
        <div class="week-day">${dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
        <div class="week-date">${formatarData(dataYmd)}</div>
      </div>
      <div class="week-body">
        ${agendamentosDia.length === 0 ? '<div style="text-align:center;padding:1rem;color:#71717a;">Sem agendamentos</div>' : ''}
        ${agendamentosDia.map(ag => `
          <div class="appointment-item">
            <div class="appointment-time">${formatarHora(ag.inicioIso)}</div>
            <div class="appointment-client">${ag.clienteNome}</div>
            <div class="appointment-service">${ag.servicoNome}</div>
          </div>
        `).join('')}
      </div>
    `;
    elements.weekGrid.appendChild(weekCard);
  }
}

function carregarHojeBarbeiro() {
  const usuario = getUsuarioAtual();
  if (!usuario || usuario.nivelAcesso !== 'Barbeiro') return;
  
  const hoje = new Date().toISOString().split('T')[0];
  const barbeiroId = usuario.barbeiroId;
  
  const agendamentosHoje = state.agendamentos
    .filter(a => a.barbeiroId === barbeiroId && a.dataYmd === hoje && a.statusPagamento !== 'Cancelado')
    .sort((a, b) => new Date(a.inicioIso) - new Date(b.inicioIso));
  
  if (agendamentosHoje.length === 0) {
    elements.todayList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-day"></i>
        <p>Nenhum atendimento para hoje</p>
      </div>
    `;
    return;
  }
  
  elements.todayList.innerHTML = agendamentosHoje.map(ag => `
    <div class="today-card">
      <div>
        <div class="today-time">${formatarHora(ag.inicioIso)}</div>
        <div class="today-client">${ag.clienteNome}</div>
        <div class="today-service">${ag.servicoNome} • ${formatarMoeda(ag.valorCentavos)}</div>
      </div>
      <div class="today-actions">
        ${!ag.concluido ? `<button class="btn-action success" onclick="window.concluirAtendimento('${ag.id}')"><i class="fas fa-check"></i> Concluir</button>` : ''}
        <button class="btn-action danger" onclick="window.cancelarAtendimento('${ag.id}')"><i class="fas fa-times"></i> Cancelar</button>
      </div>
    </div>
  `).join('');
}

// Ações globais para barbeiro
window.concluirAtendimento = (id) => {
  const ag = state.agendamentos.find(a => a.id === id);
  if (ag) {
    ag.concluido = true;
    salvarAgendamentos();
    showToast(`Atendimento de ${ag.clienteNome} concluído!`, 'success');
    carregarHojeBarbeiro();
    carregarSemanaBarbeiro();
  }
};

window.cancelarAtendimento = (id) => {
  const ag = state.agendamentos.find(a => a.id === id);
  if (ag) {
    ag.statusPagamento = 'Cancelado';
    salvarAgendamentos();
    showToast(`Agendamento de ${ag.clienteNome} cancelado!`, 'warning');
    carregarHojeBarbeiro();
    carregarSemanaBarbeiro();
  }
};

// ============================================
// EVENTOS E INICIALIZAÇÃO
// ============================================

elements.loginForm.onsubmit = (e) => {
  e.preventDefault();
  fazerLogin(elements.loginEmail.value, elements.loginSenha.value);
};

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.onclick = () => {
    elements.modalPix.close();
  };
});

// Verificar sessão existente
const sessao = storage.getSessao();
if (sessao) {
  const usuario = state.usuarios.find(u => u.id === sessao.usuarioId);
  if (usuario) {
    state.sessao = sessao;
    elements.loginWrapper.style.display = 'none';
    if (usuario.nivelAcesso === 'Cliente') {
      elements.clienteWrapper.style.display = 'block';
      iniciarCliente(usuario);
    } else if (usuario.nivelAcesso === 'Barbeiro') {
      elements.barbeiroWrapper.style.display = 'block';
      iniciarBarbeiro(usuario);
    }
  } else {
    storage.clearSessao();
  }
}