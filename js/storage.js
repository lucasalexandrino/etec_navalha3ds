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
      email: 'usuario@navalha',
      senha: '1234',
      nivelAcesso: 'Cliente',
      whatsapp: '11999999999',
      criadoEm: new Date().toISOString()
    },
    {
      id: 'usr_barbeiro',
      nome: 'Rafael Souza',
      email: 'barbeiro@navalha',
      senha: '1234',
      nivelAcesso: 'Barbeiro',
      barbeiroId: 'barb_1',
      whatsapp: '11988888888',
      criadoEm: new Date().toISOString()
    },
    {
      id: 'usr_admin',
      nome: 'Administrador',
      email: 'admin@navalha',
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
    const usuariosAtuais = getItem('usuarios');
    if (!usuariosAtuais) {
      setItem('usuarios', DADOS_INICIAIS.usuarios);
    } else {
      // Migração: garantir que os logins demo estejam atualizados
      let mudou = false;
      const novosUsuarios = usuariosAtuais.map(u => {
        if (u.id === 'usr_cliente' && u.email === 'cliente@navalha.com') {
          u.email = 'usuario@navalha';
          mudou = true;
        }
        if (u.id === 'usr_admin' && u.email === 'admin@navalha.com') {
          u.email = 'admin@navalha';
          mudou = true;
        }
        if (u.id === 'usr_barbeiro' && u.email === 'barbeiro@navalha.com') {
          u.email = 'barbeiro@navalha';
          mudou = true;
        }
        return u;
      });
      if (mudou) setItem('usuarios', novosUsuarios);
    }
    
    if (!getItem('barbeiros')) setItem('barbeiros', DADOS_INICIAIS.barbeiros);
    if (!getItem('servicos')) setItem('servicos', DADOS_INICIAIS.servicos);
    if (!getItem('agendamentos')) setItem('agendamentos', []);
  }
};