// --- DATABASE SIMULATION (LocalStorage) ---
const DB = {
  getServicos: () => JSON.parse(localStorage.getItem('barbearia_servicos')) || ['Corte Social', 'Barba', 'Combo'],
  saveServico: (nome) => {
    const s = DB.getServicos();
    s.push(nome);
    localStorage.setItem('barbearia_servicos', JSON.stringify(s));
  },
  removeServico: (index) => {
    const s = DB.getServicos();
    s.splice(index, 1);
    localStorage.setItem('barbearia_servicos', JSON.stringify(s));
  },
  getAgendamentos: () => JSON.parse(localStorage.getItem('barbearia_agendamentos')) || [],
  saveAgendamento: (ag) => {
    const a = DB.getAgendamentos();
    a.push(ag);
    localStorage.setItem('barbearia_agendamentos', JSON.stringify(a));
  },
  removeAgendamento: (index) => {
    const a = DB.getAgendamentos();
    a.splice(index, 1);
    localStorage.setItem('barbearia_agendamentos', JSON.stringify(a));
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  renderCalendar();
  updateServicosSelect();
});

// --- UI CONTROLS ---
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Toggle Panels
document.querySelectorAll('.papel').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.papel').forEach(b => b.classList.remove('ativo'));
    document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
    btn.classList.add('ativo');
    document.getElementById(`painel-${btn.dataset.papel}`).classList.add('ativo');
    if (btn.dataset.papel === 'barbeiro') updateBarbeiroView();
  };
});

// --- CLIENT LOGIC ---
function updateServicosSelect() {
  const select = document.getElementById('ag-servico');
  const servicos = DB.getServicos();
  select.innerHTML = '<option value="">Selecione...</option>' +
    servicos.map(s => `<option value="${s}">${s}</option>`).join('');
}

// Calendar
const grade = document.getElementById('cal-grade');
const tituloMes = document.getElementById('cal-titulo-mes');
let dataAtual = new Date();

function renderCalendar() {
  grade.innerHTML = '';
  const mes = dataAtual.getMonth();
  const ano = dataAtual.getFullYear();
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  tituloMes.textContent = `${meses[mes]} ${ano}`;

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    grade.appendChild(Object.assign(document.createElement('div'), { className: 'dia vazio' }));
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const div = document.createElement('div');
    div.className = 'dia';
    div.textContent = dia;
    const fullDate = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    if (fullDate === new Date().toISOString().split('T')[0]) div.classList.add('hoje');
    div.onclick = () => {
      document.querySelectorAll('.dia').forEach(d => d.classList.remove('selecionado'));
      div.classList.add('selecionado');
      document.getElementById('ag-data').value = fullDate;
    };
    grade.appendChild(div);
  }
}

document.getElementById('cal-mes-ant').onclick = () => { dataAtual.setMonth(dataAtual.getMonth() - 1); renderCalendar(); };
document.getElementById('cal-prox-mes').onclick = () => { dataAtual.setMonth(dataAtual.getMonth() + 1); renderCalendar(); };

// Form Agendamento
document.getElementById('form-agendamento').onsubmit = function (e) {
  e.preventDefault();
  let valid = true;
  this.querySelectorAll('[required]').forEach(input => {
    if (!input.value) {
      input.classList.add('error');
      if (input.nextElementSibling) input.nextElementSibling.style.display = 'block';
      valid = false;
    } else {
      input.classList.remove('error');
      if (input.nextElementSibling) input.nextElementSibling.style.display = 'none';
    }
  });

  if (valid) {
    DB.saveAgendamento({
      nome: document.getElementById('ag-nome').value,
      whatsapp: document.getElementById('ag-whatsapp').value,
      servico: document.getElementById('ag-servico').value,
      data: document.getElementById('ag-data').value,
      hora: document.getElementById('ag-hora').value
    });
    showToast('Agendamento realizado com sucesso!');
    this.reset();
    document.querySelectorAll('.dia').forEach(d => d.classList.remove('selecionado'));
  } else {
    showToast('Preencha todos os campos corretamente.', 'error');
  }
};

// --- BARBEIRO LOGIC ---
function updateBarbeiroView() {
  // Lista de Serviços
  const lista = document.getElementById('lista-servicos');
  lista.innerHTML = DB.getServicos().map((s, i) => `
    <li>${s} <button class="btn-icon" onclick="deleteServico(${i})"><i data-lucide="trash-2" style="width:16px"></i></button></li>
  `).join('');

  // Tabela Agendamentos
  const tbody = document.getElementById('tbody-agendamentos');
  const ags = DB.getAgendamentos().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  tbody.innerHTML = ags.map((ag, i) => `
    <tr>
      <td><strong>${ag.hora}</strong><br><small>${ag.data.split('-').reverse().slice(0, 2).join('/')}</small></td>
      <td>${ag.nome}<br><small>${ag.whatsapp}</small></td>
      <td><span class="badge">${ag.servico}</span></td>
      <td><button class="btn-icon" onclick="deleteAgendamento(${i})" style="color:var(--success)"><i data-lucide="check-circle" style="width:18px"></i></button></td>
    </tr>
  `).join('');
  if (ags.length === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Nenhum agendamento.</td></tr>';
  lucide.createIcons();
}

window.deleteServico = (i) => {
  DB.removeServico(i);
  updateBarbeiroView();
  updateServicosSelect();
  showToast('Serviço removido.');
};

window.deleteAgendamento = (i) => {
  DB.removeAgendamento(i);
  updateBarbeiroView();
  showToast('Atendimento concluído!');
};

document.getElementById('form-servico').onsubmit = function (e) {
  e.preventDefault();
  const input = document.getElementById('sv-nome');
  if (!input.value) {
    input.classList.add('error');
    return;
  }
  DB.saveServico(input.value);
  input.value = '';
  updateBarbeiroView();
  updateServicosSelect();
  showToast('Novo serviço cadastrado!');
};
