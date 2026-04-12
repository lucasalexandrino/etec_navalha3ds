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
  const today = new Date();
  
  containerElement.innerHTML = '';
  
  for (let i = 0; i < firstDay; i++) {
    containerElement.innerHTML += `<div class="calendar-day empty"></div>`;
  }
  
  for (let dia = 1; dia <= lastDay; dia++) {
    const dataAtual = new Date(year, month, dia);
    const isPast = dataAtual < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = dia === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = selectedDate === dia;
    const isFeriado = isFeriadoNacional(dataAtual);
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isToday) dayDiv.classList.add('today');
    if (isSelected) dayDiv.classList.add('selected');
    if (isPast || isFeriado) dayDiv.classList.add('disabled');
    if (isFeriado) dayDiv.title = "Feriado nacional - não disponível";
    dayDiv.textContent = dia;
    
    if (!isPast && !isFeriado) {
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