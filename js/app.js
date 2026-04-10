"use strict";

import { Storage } from './modules/storage.js';
import { Auth } from './modules/auth.js';
import { Calendar } from './modules/calendar.js';
import { UI } from './modules/ui.js';

// Aplicação Principal
const App = {
  state: {
    user: null,
    services: [],
    appointments: []
  },

  elements: {},

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadData();
    
    // Auto login como cliente para iniciar direto
    const autoUser = Auth.autoLoginAsClient();
    this.state.user = autoUser;
    this.renderView();
    
    this.setupMasks();
    this.setupTodayDate();
  },

  cacheDOM() {
    this.elements = {
      authScreen: document.getElementById('auth-screen'),
      appScreen: document.getElementById('app'),
      loginForm: document.getElementById('login-form'),
      loginUser: document.getElementById('login-user'),
      loginPass: document.getElementById('login-pass'),
      panelCliente: document.getElementById('painel-cliente'),
      panelBarbeiro: document.getElementById('painel-barbeiro'),
      userDisplay: document.getElementById('user-display'),
      btnLogout: document.getElementById('btn-logout'),
      
      calGrade: document.getElementById('cal-grade'),
      calTitulo: document.getElementById('cal-titulo-mes'),
      calPrev: document.getElementById('cal-prev'),
      calNext: document.getElementById('cal-next'),
      
      formAgendamento: document.getElementById('form-agendamento'),
      agNome: document.getElementById('ag-nome'),
      agWhatsapp: document.getElementById('ag-whatsapp'),
      agServico: document.getElementById('ag-servico'),
      agData: document.getElementById('ag-data'),
      agHora: document.getElementById('ag-hora'),
      
      formServico: document.getElementById('form-servico'),
      svNome: document.getElementById('sv-nome'),
      listaServicos: document.getElementById('lista-servicos'),
      tbodyAgendamentos: document.getElementById('tbody-agendamentos'),
      todayDate: document.getElementById('today-date')
    };
  },

  loadData() {
    this.state.services = Storage.getServices();
    this.state.appointments = Storage.getAppointments();
    console.log('Dados carregados:', { 
      services: this.state.services, 
      appointments: this.state.appointments 
    });
  },

  bindEvents() {
    // Login (opcional, para trocar de perfil)
    if (this.elements.loginForm) {
      this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Logout
    if (this.elements.btnLogout) {
      this.elements.btnLogout.addEventListener('click', () => this.handleLogout());
    }
    
    // Calendário
    if (this.elements.calPrev) {
      this.elements.calPrev.addEventListener('click', () => this.changeMonth(-1));
      this.elements.calNext.addEventListener('click', () => this.changeMonth(1));
    }
    
    // Agendamento
    if (this.elements.formAgendamento) {
      this.elements.formAgendamento.addEventListener('submit', (e) => this.handleAppointment(e));
    }
    
    // Serviços (barbeiro)
    if (this.elements.formServico) {
      this.elements.formServico.addEventListener('submit', (e) => this.handleAddService(e));
    }
    
    // Validação em tempo real
    if (this.elements.agNome) {
      this.elements.agNome.addEventListener('input', () => this.validateNome());
      this.elements.agWhatsapp.addEventListener('input', () => this.validateWhatsapp());
      this.elements.agData.addEventListener('change', () => this.validateData());
      this.elements.agHora.addEventListener('change', () => this.validateHora());
    }
  },

  setupMasks() {
    if (this.elements.agWhatsapp) {
      this.elements.agWhatsapp.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
          if (value.length > 2) {
            value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
          }
          if (value.length > 10) {
            value = `${value.substring(0, 11)}-${value.substring(11)}`;
          }
          if (value.length > 15) {
            value = value.substring(0, 16);
          }
        }
        e.target.value = value;
      });
    }
  },

  setupTodayDate() {
    if (this.elements.todayDate) {
      const today = new Date();
      const formatted = today.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      this.elements.todayDate.textContent = formatted;
    }
  },

  handleLogin(e) {
    e.preventDefault();
    const username = this.elements.loginUser.value.trim();
    const password = this.elements.loginPass.value;
    
    if (!username) {
      UI.showToast('Digite um usuário', 'error');
      return;
    }
    
    const result = Auth.login(username, password);
    
    if (result.success) {
      this.state.user = result.user;
      this.renderView();
      UI.showToast(`Bem-vindo, ${result.user.displayName}!`, 'success');
    } else {
      UI.showToast(result.error, 'error');
    }
  },

  handleLogout() {
    Auth.logout();
    // Auto login como cliente novamente
    const autoUser = Auth.autoLoginAsClient();
    this.state.user = autoUser;
    this.renderView();
    UI.showToast('Voltando ao modo cliente', 'success');
  },

  renderView() {
    this.elements.authScreen.classList.add('hidden');
    this.elements.appScreen.classList.remove('hidden');
    this.elements.userDisplay.innerHTML = `<i class="bi bi-person-circle me-1"></i>${this.state.user.displayName}`;

    if (this.state.user.role === 'barbeiro') {
      this.elements.panelCliente.classList.add('hidden');
      this.elements.panelBarbeiro.classList.remove('hidden');
      this.renderBarbeiroPanel();
    } else {
      this.elements.panelBarbeiro.classList.add('hidden');
      this.elements.panelCliente.classList.remove('hidden');
      this.renderClientePanel();
    }
  },

  renderClientePanel() {
    this.updateServiceSelect();
    this.initCalendar();
  },

  initCalendar() {
    Calendar.init((formattedDate) => {
      this.elements.agData.value = formattedDate;
      this.validateData();
    });
    Calendar.render(this.elements.calGrade, this.elements.calTitulo);
  },

  changeMonth(diff) {
    Calendar.changeMonth(diff, this.elements.calGrade, this.elements.calTitulo);
  },

  updateServiceSelect() {
    this.state.services = Storage.getServices();
    
    if (!this.elements.agServico) return;
    
    if (this.state.services.length === 0) {
      this.elements.agServico.innerHTML = '<option value="">Nenhum serviço disponível</option>';
      return;
    }
    
    this.elements.agServico.innerHTML = '<option value="">Selecione um serviço</option>' +
      this.state.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  },

  validateNome() {
    const nome = this.elements.agNome.value.trim();
    if (nome.length < 3) {
      UI.showFieldError('nome', 'Nome deve ter pelo menos 3 caracteres');
      return false;
    }
    if (nome.length > 50) {
      UI.showFieldError('nome', 'Nome muito longo (máx. 50 caracteres)');
      return false;
    }
    UI.showFieldError('nome', '');
    return true;
  },

  validateWhatsapp() {
    let whatsapp = this.elements.agWhatsapp.value.replace(/\D/g, '');
    if (whatsapp.length < 10 || whatsapp.length > 11) {
      UI.showFieldError('whatsapp', 'WhatsApp inválido (ex: 11999999999)');
      return false;
    }
    UI.showFieldError('whatsapp', '');
    return true;
  },

  validateData() {
    const data = this.elements.agData.value;
    if (!data) {
      UI.showFieldError('data', 'Selecione uma data');
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data);
    
    if (selectedDate < today) {
      UI.showFieldError('data', 'Não é permitido agendar em datas passadas');
      return false;
    }
    
    UI.showFieldError('data', '');
    return true;
  },

  validateHora() {
    const hora = this.elements.agHora.value;
    if (!hora) {
      UI.showFieldError('hora', 'Selecione um horário');
      return false;
    }
    
    const hour = parseInt(hora.split(':')[0]);
    if (hour < 9 || hour > 20) {
      UI.showFieldError('hora', 'Horário comercial: 09:00 às 20:00');
      return false;
    }
    
    UI.showFieldError('hora', '');
    return true;
  },

  validateServico() {
    const servicoId = this.elements.agServico.value;
    if (!servicoId) {
      UI.showFieldError('servico', 'Selecione um serviço');
      return false;
    }
    UI.showFieldError('servico', '');
    return true;
  },

  validateForm() {
    return this.validateNome() && 
           this.validateWhatsapp() && 
           this.validateData() && 
           this.validateHora() && 
           this.validateServico();
  },

  handleAppointment(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
      UI.showToast('Preencha todos os campos corretamente', 'error');
      return;
    }
    
    const data = this.elements.agData.value;
    const hora = this.elements.agHora.value;
    
    if (Storage.hasConflict(data, hora)) {
      UI.showToast('❌ Este horário já está ocupado! Escolha outro.', 'error');
      return;
    }
    
    const servicoId = parseInt(this.elements.agServico.value);
    const servico = this.state.services.find(s => s.id === servicoId);
    
    const appointment = {
      cliente: this.elements.agNome.value.trim(),
      whatsapp: this.elements.agWhatsapp.value.trim(),
      servicoId: servicoId,
      servicoNome: servico ? servico.name : 'Serviço',
      data: data,
      hora: hora,
      status: 'agendado'
    };
    
    // Salvar no localStorage
    Storage.addAppointment(appointment);
    this.state.appointments = Storage.getAppointments();
    
    console.log('Agendamento realizado:', appointment);
    console.log('Total no storage:', this.state.appointments);
    
    UI.showToast(`✅ Agendamento confirmado para ${data} às ${hora}!`, 'success');
    
    // Limpar formulário
    this.elements.formAgendamento.reset();
    Calendar.resetSelection();
    this.renderCalendarioAtualizado();
    
    // Remover seleção visual do calendário
    document.querySelectorAll('.calendar-day.selected').forEach(d => {
      d.classList.remove('selected');
    });
  },

  renderCalendarioAtualizado() {
    Calendar.render(this.elements.calGrade, this.elements.calTitulo);
  },

  renderBarbeiroPanel() {
    this.renderServicesList();
    this.renderTodayAppointments();
  },

  renderServicesList() {
    if (!this.elements.listaServicos) return;
    
    this.state.services = Storage.getServices();
    
    if (this.state.services.length === 0) {
      this.elements.listaServicos.innerHTML = '<div class="text-center text-secondary py-3">Nenhum serviço cadastrado</div>';
      return;
    }
    
    this.elements.listaServicos.innerHTML = this.state.services.map(service => `
      <div class="service-item">
        <span><i class="bi bi-scissors me-2"></i>${this.escapeHtml(service.name)}</span>
        <button onclick="window.appDeleteService(${service.id})" class="btn-delete-service" title="Remover serviço">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `).join('');
    
    window.appDeleteService = (id) => this.deleteService(id);
  },

  deleteService(id) {
    if (confirm('Tem certeza que deseja remover este serviço?')) {
      Storage.removeService(id);
      this.state.services = Storage.getServices();
      this.renderServicesList();
      this.updateServiceSelect();
      UI.showToast('Serviço removido com sucesso', 'success');
    }
  },

  handleAddService(e) {
    e.preventDefault();
    const serviceName = this.elements.svNome.value.trim();
    
    if (!serviceName) {
      UI.showToast('Digite o nome do serviço', 'error');
      return;
    }
    
    if (serviceName.length < 3) {
      UI.showToast('Nome do serviço deve ter pelo menos 3 caracteres', 'error');
      return;
    }
    
    Storage.addService(serviceName);
    this.state.services = Storage.getServices();
    this.renderServicesList();
    this.updateServiceSelect();
    this.elements.svNome.value = '';
    UI.showToast(`Serviço "${serviceName}" adicionado!`, 'success');
  },

  renderTodayAppointments() {
    if (!this.elements.tbodyAgendamentos) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = this.state.appointments.filter(a => a.data === today);
    
    console.log('Agendamentos de hoje:', todayAppointments);
    
    if (todayAppointments.length === 0) {
      this.elements.tbodyAgendamentos.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-secondary py-4">
            <i class="bi bi-inbox me-2"></i>Nenhum agendamento para hoje
          </td>
        </tr>
      `;
      return;
    }
    
    todayAppointments.sort((a, b) => a.hora.localeCompare(b.hora));
    
    this.elements.tbodyAgendamentos.innerHTML = todayAppointments.map(app => `
      <tr>
        <td><strong>${this.escapeHtml(app.hora)}</strong></td>
        <td>${this.escapeHtml(app.cliente)}</td>
        <td><i class="bi bi-scissors me-1"></i>${this.escapeHtml(app.servicoNome)}</td>
        <td><i class="bi bi-whatsapp me-1"></i>${this.escapeHtml(app.whatsapp)}</td>
        <td>
          <button onclick="window.appCancelAppointment(${app.id})" class="btn-cancel" title="Cancelar agendamento">
            <i class="bi bi-x-circle"></i> Cancelar
          </button>
        </td>
      </tr>
    `).join('');
    
    window.appCancelAppointment = (id) => this.cancelAppointment(id);
  },

  cancelAppointment(id) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      Storage.removeAppointment(id);
      this.state.appointments = Storage.getAppointments();
      this.renderTodayAppointments();
      UI.showToast('Agendamento cancelado', 'success');
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Inicializar aplicação
App.init();