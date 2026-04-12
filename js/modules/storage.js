// ========== GERENCIAMENTO DE ARMAZENAMENTO LOCAL ==========
const KEYS = {
  services: 'bb_services',
  appointments: 'bb_appointments',
  cancellations: 'bb_cancellations',
  users: 'bb_users',
  currentUser: 'bb_current_user',
  precosConfig: 'bb_precos_config',
  temposConfig: 'bb_tempos_config'
};

export const Storage = {
  // Serviços
  getServices() {
    const data = localStorage.getItem(KEYS.services);
    if (data) return JSON.parse(data);
    const defaultServices = [
      { id: 1, name: 'Corte Masculino', preco: 50, tempo: 30 },
      { id: 2, name: 'Barba Completa', preco: 40, tempo: 25 },
      { id: 3, name: 'Corte + Barba', preco: 80, tempo: 50 },
      { id: 4, name: 'Pezinho e Acabamento', preco: 25, tempo: 15 }
    ];
    this.setServices(defaultServices);
    return defaultServices;
  },
  setServices(services) { localStorage.setItem(KEYS.services, JSON.stringify(services)); },
  addService(service) {
    const services = this.getServices();
    const newId = Math.max(...services.map(s => s.id), 0) + 1;
    services.push({ id: newId, ...service });
    this.setServices(services);
    return services;
  },
  removeService(id) {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    this.setServices(services);
    return services;
  },

  // Agendamentos
  getAppointments() {
    const data = localStorage.getItem(KEYS.appointments);
    return data ? JSON.parse(data) : [];
  },
  setAppointments(appointments) { localStorage.setItem(KEYS.appointments, JSON.stringify(appointments)); },
  addAppointment(appointment) {
    const appointments = this.getAppointments();
    appointment.id = Date.now();
    appointments.push(appointment);
    this.setAppointments(appointments);
    return appointments;
  },
  removeAppointment(id) {
    let appointments = this.getAppointments();
    appointments = appointments.filter(a => a.id !== id);
    this.setAppointments(appointments);
    return appointments;
  },

  // Cancelamentos
  getCancellations() {
    const data = localStorage.getItem(KEYS.cancellations);
    return data ? JSON.parse(data) : [];
  },
  setCancellations(cancellations) { localStorage.setItem(KEYS.cancellations, JSON.stringify(cancellations)); },
  addCancellation(cancellation) {
    const cancellations = this.getCancellations();
    cancellation.id = Date.now();
    cancellations.push(cancellation);
    this.setCancellations(cancellations);
    return cancellations;
  },

  // Usuários
  getUsers() {
    const data = localStorage.getItem(KEYS.users);
    if (data) return JSON.parse(data);
    const defaultUsers = [{ id: 1, nome: 'Admin Barbeiro', email: 'admin@navalha.com', whatsapp: '(00) 00000-0000', senha: 'NavalhaBarber26', role: 'barbeiro' }];
    this.setUsers(defaultUsers);
    return defaultUsers;
  },
  setUsers(users) { localStorage.setItem(KEYS.users, JSON.stringify(users)); },
  addUser(user) {
    const users = this.getUsers();
    user.id = Date.now();
    users.push(user);
    this.setUsers(users);
    return users;
  },

  // Sessão
  getCurrentUser() {
    const data = localStorage.getItem(KEYS.currentUser);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser(user) { localStorage.setItem(KEYS.currentUser, JSON.stringify(user)); },
  clearCurrentUser() { localStorage.removeItem(KEYS.currentUser); },

  // Configurações
  getPrecosConfig() {
    const data = localStorage.getItem(KEYS.precosConfig);
    return data ? JSON.parse(data) : null;
  },
  setPrecosConfig(config) { localStorage.setItem(KEYS.precosConfig, JSON.stringify(config)); },
  getTemposConfig() {
    const data = localStorage.getItem(KEYS.temposConfig);
    return data ? JSON.parse(data) : null;
  },
  setTemposConfig(config) { localStorage.setItem(KEYS.temposConfig, JSON.stringify(config)); }
};