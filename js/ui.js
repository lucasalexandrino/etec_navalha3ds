// UI Service - Navalha Barbearia

export const ui = {
  $(selector, parent = document) {
    const el = parent.querySelector(selector);
    if (!el) throw new Error(`Elemento não encontrado: ${selector}`);
    return el;
  },
  
  $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },
  
  hide(el) {
    if (el) el.style.display = 'none';
  },
  
  show(el, display = 'block') {
    if (el) el.style.display = display;
  },
  
  clear(el) {
    if (el) el.innerHTML = '';
  },
  
  toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
};