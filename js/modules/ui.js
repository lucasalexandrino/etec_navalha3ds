// Módulo de UI (toasts e mensagens)
export const UI = {
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-custom ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
      <i class="bi bi-${icon} fs-5"></i>
      <span class="flex-grow-1">${message}</span>
      <button type="button" class="btn-close btn-close-white btn-sm" data-bs-dismiss="toast"></button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  clearErrors(formElement) {
    const invalidInputs = formElement.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => input.classList.remove('is-invalid'));
    
    const feedbacks = formElement.querySelectorAll('.invalid-feedback');
    feedbacks.forEach(fb => fb.textContent = '');
  },

  showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const feedback = document.getElementById(`error-${inputId}`);
    
    if (input && feedback) {
      input.classList.add('is-invalid');
      feedback.textContent = message;
    }
  },

  hideLoader(button) {
    if (button && button._originalText) {
      button.innerHTML = button._originalText;
      button.disabled = false;
    }
  },

  showLoader(button, loadingText = '<i class="bi bi-hourglass-split me-2"></i>Processando...') {
    if (button && !button.disabled) {
      button._originalText = button.innerHTML;
      button.innerHTML = loadingText;
      button.disabled = true;
    }
  }
};