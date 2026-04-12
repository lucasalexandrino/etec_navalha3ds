// ========== UI (TOASTS E MODAIS) ==========
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-triangle' : 'info-circle');
  toast.innerHTML = `<i class="bi bi-${icon} fs-5"></i><span>${message}</span><button type="button" class="btn-close btn-close-white btn-sm" onclick="this.parentElement.remove()"></button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function showConfirmModal(title, message, onConfirm) {
  const modalElement = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('confirmModalTitle');
  const modalMessage = document.getElementById('confirmModalMessage');
  const confirmBtn = document.getElementById('confirmModalConfirmBtn');
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  const modal = new bootstrap.Modal(modalElement);
  newConfirmBtn.addEventListener('click', () => {
    modal.hide();
    if (onConfirm) onConfirm();
  });
  modal.show();
}

export function showCancelModal(onConfirm) {
  const modalElement = document.getElementById('cancelModal');
  const motivoTextarea = document.getElementById('cancel-motivo');
  const errorDiv = document.getElementById('error-motivo');
  const confirmBtn = document.getElementById('cancelModalConfirmBtn');
  
  motivoTextarea.value = '';
  motivoTextarea.classList.remove('is-invalid');
  if (errorDiv) errorDiv.style.display = 'none';
  
  const modal = new bootstrap.Modal(modalElement);
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  newConfirmBtn.addEventListener('click', () => {
    const motivo = motivoTextarea.value.trim();
    if (!motivo) {
      motivoTextarea.classList.add('is-invalid');
      if (errorDiv) errorDiv.style.display = 'block';
      return;
    }
    modal.hide();
    if (onConfirm) onConfirm(motivo);
  });
  modal.show();
}