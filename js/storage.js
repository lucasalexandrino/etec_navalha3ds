// Storage Service - Navalha Barbearia

const PREFIX = 'navalha_';

function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const DADOS_INICIAIS = {
  usuarios: [
    {
      id: 'usr_cliente',
      nome: 'João Silva',
      email: 'cliente@navalha.com',
      senha: '1234',
      nivelAcesso: 'Cliente',
      whatsapp: '11999999999',
      criadoEm: new Date().toISOString()
    },
    {
      id: 'usr_barbeiro',
      nome: 'Rafael Souza',
      email: 'barbeiro@navalha.com',
      senha: '1234',
      nivelAcesso: 'Barbeiro',
      barbeiroId: 'barb_1',
      whatsapp: '11988888888',
      criadoEm: new Date().toISOString()
    },
    {
      id: 'usr_admin',
      nome: 'Administrador',
      email: 'admin@navalha.com',
      senha: '1234',
      nivelAcesso: 'Admin',
      whatsapp: '',
      criadoEm: new Date().toISOString()
    }
  ],
  barbeiros: [
    { id: 'barb_1', nome: 'Rafael Souza' },
    { id: 'barb_2', nome: 'Diego Santos' },
    { id: 'barb_3', nome: 'Beatriz Lima' }
  ],
  servicos: [
    { id: 'srv_1', nome: 'Corte Premium', duracaoMinutos: 40, precoCentavos: 5000 },
    { id: 'srv_2', nome: 'Barba', duracaoMinutos: 25, precoCentavos: 3500 },
    { id: 'srv_3', nome: 'Combo Completo', duracaoMinutos: 60, precoCentavos: 8000 },
    { id: 'srv_4', nome: 'Platinado', duracaoMinutos: 90, precoCentavos: 12000 }
  ]
};

export const storage = {
  getSessao: () => getItem('sessao'),
  setSessao: (sessao) => setItem('sessao', sessao),
  clearSessao: () => localStorage.removeItem(PREFIX + 'sessao'),
  
  getUsuarios: () => getItem('usuarios', DADOS_INICIAIS.usuarios),
  setUsuarios: (usuarios) => setItem('usuarios', usuarios),
  
  getBarbeiros: () => getItem('barbeiros', DADOS_INICIAIS.barbeiros),
  setBarbeiros: (barbeiros) => setItem('barbeiros', barbeiros),
  
  getServicos: () => getItem('servicos', DADOS_INICIAIS.servicos),
  setServicos: (servicos) => setItem('servicos', servicos),
  
  getAgendamentos: () => getItem('agendamentos', []),
  setAgendamentos: (agendamentos) => setItem('agendamentos', agendamentos),
  
  generateId,
  
  garantirDadosIniciais() {
    if (!getItem('usuarios')) setItem('usuarios', DADOS_INICIAIS.usuarios);
    if (!getItem('barbeiros')) setItem('barbeiros', DADOS_INICIAIS.barbeiros);
    if (!getItem('servicos')) setItem('servicos', DADOS_INICIAIS.servicos);
    if (!getItem('agendamentos')) setItem('agendamentos', []);
  }
};