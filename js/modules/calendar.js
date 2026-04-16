// ========== CALENDÁRIO ==========
import { isFeriadoNacional } from './feriados.js';

let currentDate = new Date();
let selectedDate = null;
let onDateSelectCallback = null;

export function initCalendar(onDateSelect) {
  onDateSelectCallback = onDateSelect;
}

export function renderCalendar(containerElement, monthElement) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  monthElement.textContent = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  // Data de hoje padronizada com horário 12:00
  const hoje = new Date();
  const hojePadronizada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0);
  
  containerElement.innerHTML = '';
  
  for (let i = 0; i < firstDay; i++) {
    containerElement.innerHTML += `<div class="calendar-day empty"></div>`;
  }
  
  for (let dia = 1; dia <= lastDay; dia++) {
    // Data do dia padronizada com horário 12:00
    const dataAtual = new Date(year, month, dia, 12, 0, 0);
    const isPast = dataAtual < hojePadronizada;
    const isToday = dia === hoje.getDate() && month === hoje.getMonth() && year === hoje.getFullYear();
    const isSelected = selectedDate === dia;
    const isFeriado = isFeriadoNacional(dataAtual);
    const isDomingo = dataAtual.getDay() === 0; // 0 = Domingo
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isToday) dayDiv.classList.add('today');
    if (isSelected) dayDiv.classList.add('selected');
    if (isPast || isFeriado || isDomingo) dayDiv.classList.add('disabled');
    
    if (isFeriado) dayDiv.title = "Feriado nacional - não disponível";
    if (isDomingo) dayDiv.title = "Domingo - não disponível";
    
    dayDiv.textContent = dia;
    
    if (!isPast && !isFeriado && !isDomingo) {
      dayDiv.onclick = () => {
        document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
        dayDiv.classList.add('selected');
        selectedDate = dia;
        if (onDateSelectCallback) {
          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          onDateSelectCallback(formattedDate);
        }
      };
    }
    containerElement.appendChild(dayDiv);
  }
}

export function changeMonth(diff, containerElement, monthElement) {
  currentDate.setMonth(currentDate.getMonth() + diff);
  selectedDate = null;
  renderCalendar(containerElement, monthElement);
}

export function resetSelection() {
  selectedDate = null;
}