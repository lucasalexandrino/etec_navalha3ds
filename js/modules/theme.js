// ========== GERENCIAMENTO DE TEMA ==========

const STORAGE_KEY = 'bb_theme_preference';

export function initThemeToggle() {
  // Carregar preferência salva
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  
  if (savedTheme === 'light') {
    enableLightTheme();
  } else {
    enableDarkTheme();
  }
  
  // Adicionar botão ao DOM
  addThemeToggleButton();
}

function addThemeToggleButton() {
  // Verificar se o botão já existe
  if (document.getElementById('theme-toggle-btn')) return;
  
  // Carregar o componente do botão
  fetch('components/theme-toggle.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      setupThemeToggleEvent();
    })
    .catch(error => {
      console.error('Erro ao carregar botão de tema:', error);
      // Fallback: criar botão diretamente
      const buttonHtml = `<button id="theme-toggle-btn" class="theme-toggle-btn" title="Alternar tema claro/escuro"><i id="theme-icon" class="bi bi-sun-fill"></i></button>`;
      document.body.insertAdjacentHTML('beforeend', buttonHtml);
      setupThemeToggleEvent();
    });
}

function setupThemeToggleEvent() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  
  toggleBtn.addEventListener('click', () => {
    const isLightTheme = document.body.classList.contains('light-theme');
    
    if (isLightTheme) {
      enableDarkTheme();
    } else {
      enableLightTheme();
    }
  });
}

export function enableLightTheme() {
  document.body.classList.add('light-theme');
  
  // Habilitar a folha de estilo do tema claro
  const lightStylesheet = document.getElementById('light-theme-stylesheet');
  if (lightStylesheet) {
    lightStylesheet.disabled = false;
  }
  
  // Trocar ícone do botão
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.classList.remove('bi-sun-fill');
    themeIcon.classList.add('bi-moon-fill');
  }
  
  // Trocar logos
  updateLogos('light');
  
  // Salvar preferência
  localStorage.setItem(STORAGE_KEY, 'light');
}

export function enableDarkTheme() {
  document.body.classList.remove('light-theme');
  
  // Desabilitar a folha de estilo do tema claro
  const lightStylesheet = document.getElementById('light-theme-stylesheet');
  if (lightStylesheet) {
    lightStylesheet.disabled = true;
  }
  
  // Trocar ícone do botão
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.classList.remove('bi-moon-fill');
    themeIcon.classList.add('bi-sun-fill');
  }
  
  // Trocar logos
  updateLogos('dark');
  
  // Salvar preferência
  localStorage.setItem(STORAGE_KEY, 'dark');
}

function updateLogos(theme) {
  // Atualizar logo no header
  const headerLogo = document.querySelector('.navbar-custom img');
  if (headerLogo) {
    headerLogo.src = theme === 'light' ? 'img/NavalhaIcon2.png' : 'img/NavalhaIcon.png';
  }
  
  // Atualizar logo na tela de login (pode haver múltiplos)
  const loginLogos = document.querySelectorAll('#auth-screen .card-dark img, #login-panel img, #register-panel img');
  loginLogos.forEach(img => {
    if (img.src.includes('NavalhaVlogo') || img.src.includes('NavalhaIcon')) {
      img.src = theme === 'light' ? 'img/NavalhaVlogo2.png' : 'img/NavalhaVlogo.png';
    }
  });
}

// Função para ser chamada quando novos logos são carregados dinamicamente
export function refreshLogos() {
  const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  updateLogos(currentTheme);
}