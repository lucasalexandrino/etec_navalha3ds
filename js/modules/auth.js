// Módulo de autenticação (simulada para aprendizado)
import { Storage } from './storage.js';

// Credenciais fixas para demonstração
// ⚠️ EM PRODUÇÃO: autenticação deve ser feita no servidor com hash de senha!
const USERS = {
  admin: { password: '123456', role: 'barbeiro', name: 'Admin Barbeiro' },
  cliente: { password: '123456', role: 'cliente', name: 'Cliente' }
};

export const Auth = {
  login(username, password) {
    const user = USERS[username.toLowerCase()];
    
    if (user && user.password === password) {
      const sessionUser = {
        username: username.toLowerCase(),
        role: user.role,
        displayName: user.name,
        loggedAt: new Date().toISOString()
      };
      Storage.setSession(sessionUser);
      return { success: true, user: sessionUser };
    }
    
    return { success: false, error: 'Usuário ou senha inválidos' };
  },

  logout() {
    Storage.clearSession();
  },

  isAuthenticated() {
    const session = Storage.getSession();
    return session !== null;
  },

  getCurrentUser() {
    return Storage.getSession();
  },

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }
};