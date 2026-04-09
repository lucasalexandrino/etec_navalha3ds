// Módulo de gerenciamento de armazenamento local
export const Storage = {
  keys: {
    services: 'bb_services',
    appointments: 'bb_appointments',
    session: 'bb_session'
  },

  // Serviços
  getServices() {
    const data = localStorage.getItem(this.keys.services);
    return data ? JSON.parse(data) : [];
  },

  setServices(services) {
    localStorage.setItem(this.keys.services, JSON.stringify(services));
  },

  addService(service) {
    const services = this.getServices();
    const newService = {
      id: Date.now(),
      name: service.trim(),
      createdAt: new Date().toISOString()
    };
    services.push(newService);
    this.setServices(services);
    return newService;
  },

  removeService(id) {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    this.setServices(services);
    return services;
  },

  // Agendamentos
  getAppointments() {
    const data = localStorage.getItem(this.keys.appointments);
    return data ? JSON.parse(data) : [];
  },

  setAppointments(appointments) {
    localStorage.setItem(this.keys.appointments, JSON.stringify(appointments));
  },

  addAppointment(appointment) {
    const appointments = this.getAppointments();
    const newAppointment = {
      id: Date.now(),
      ...appointment,
      createdAt: new Date().toISOString()
    };
    appointments.push(newAppointment);
    this.setAppointments(appointments);
    return newAppointment;
  },

  removeAppointment(id) {
    let appointments = this.getAppointments();
    appointments = appointments.filter(a => a.id !== id);
    this.setAppointments(appointments);
    return appointments;
  },

  getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments().filter(a => a.data === today);
  },

  // Sessão
  getSession() {
    const data = localStorage.getItem(this.keys.session);
    return data ? JSON.parse(data) : null;
  },

  setSession(user) {
    localStorage.setItem(this.keys.session, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.keys.session);
  },

  // Verificar conflito de horário
  hasConflict(data, hora, excludeId = null) {
    const appointments = this.getAppointments();
    return appointments.some(a => 
      a.data === data && 
      a.hora === hora && 
      (excludeId === null || a.id !== excludeId)
    );
  }
};