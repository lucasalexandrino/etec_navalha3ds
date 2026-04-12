// ========== AUTENTICAÇÃO ==========
import { Storage } from './storage.js';
import { showToast } from './ui.js';

export function handleLogin(email, password, users, onSuccess) {
  if (email === 'admin@navalha.com' && password === 'NavalhaBarber26') {
    const user = { id: 1, nome: 'Admin Barbeiro', email, role: 'barbeiro', displayName: 'Admin Barbeiro' };
    Storage.setCurrentUser(user);
    onSuccess(user);
    showToast('Bem-vindo, Admin!', 'success');
    return true;
  }
  
  const user = users.find(u => u.email === email && u.senha === password);
  if (user) {
    const currentUser = { id: user.id, nome: user.nome, email: user.email, whatsapp: user.whatsapp, role: user.role, displayName: user.nome };
    Storage.setCurrentUser(currentUser);
    onSuccess(currentUser);
    showToast(`Bem-vindo, ${user.nome}!`, 'success');
    return true;
  }
  
  showToast('Email ou senha inválidos', 'error');
  return false;
}

export function handleRegister(userData, users, onSuccess) {
  const { nome, email, whatsapp, senha, confirmSenha } = userData;
  
  if (nome.length < 3) return { success: false, error: 'Nome deve ter pelo menos 3 caracteres' };
  if (!email.includes('@') || !email.includes('.')) return { success: false, error: 'Email inválido' };
  if (users.some(u => u.email === email)) return { success: false, error: 'Email já cadastrado' };
  
  const whatsappDigits = whatsapp.replace(/\D/g, '');
  if (whatsappDigits.length < 10 || whatsappDigits.length > 11) return { success: false, error: 'WhatsApp inválido' };
  if (senha.length < 6) return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
  if (senha !== confirmSenha) return { success: false, error: 'As senhas não coincidem' };
  
  const newUser = { nome, email, whatsapp, senha, role: 'cliente' };
  Storage.addUser(newUser);
  showToast('Cadastro realizado com sucesso! Faça login.', 'success');
  if (onSuccess) onSuccess();
  return { success: true };
}

export function logout(onLogout) {
  Storage.clearCurrentUser();
  if (onLogout) onLogout();
  showToast('Logout realizado!', 'success');
}