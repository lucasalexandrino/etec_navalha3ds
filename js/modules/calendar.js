// Módulo do calendário
export const Calendar = {
  currentDate: new Date(),
  selectedDate: null,
  selectedMonth: null,
  selectedYear: null,
  onDateSelected: null,

  init(onDateSelectedCallback) {
    this.onDateSelected = onDateSelectedCallback;
  },

  getMonthYear(date) {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  },

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  },

  isPastDate(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(year, month, day);
    return compareDate < today;
  },

  render(containerElement, monthElement) {
    const date = this.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    
    monthElement.textContent = this.getMonthYear(date);
    
    const firstDay = this.getFirstDayOfMonth(year, month);
    const lastDay = this.getDaysInMonth(year, month);
    const today = new Date();
    
    containerElement.innerHTML = '';
    
    // Dias vazios
    for (let i = 0; i < firstDay; i++) {
      containerElement.innerHTML += `<div class="calendar-day empty"></div>`;
    }
    
    // Dias do mês
    for (let dia = 1; dia <= lastDay; dia++) {
      const isPast = this.isPastDate(year, month, dia);
      const isToday = dia === today.getDate() && 
                      month === today.getMonth() && 
                      year === today.getFullYear();
      const isSelected = this.selectedDate === dia && 
                         this.selectedMonth === month && 
                         this.selectedYear === year;
      
      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      if (isPast) classes += ' disabled';
      
      const dayDiv = document.createElement('div');
      dayDiv.className = classes;
      dayDiv.textContent = dia;
      
      if (!isPast) {
        dayDiv.onclick = () => {
          document.querySelectorAll('.calendar-day.selected').forEach(d => {
            d.classList.remove('selected');
          });
          dayDiv.classList.add('selected');
          
          this.selectedDate = dia;
          this.selectedMonth = month;
          this.selectedYear = year;
          
          if (this.onDateSelected) {
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            this.onDateSelected(formattedDate);
          }
        };
      }
      
      containerElement.appendChild(dayDiv);
    }
  },

  changeMonth(diff, containerElement, monthElement) {
    this.currentDate.setMonth(this.currentDate.getMonth() + diff);
    this.render(containerElement, monthElement);
  },

  resetSelection() {
    this.selectedDate = null;
    this.selectedMonth = null;
    this.selectedYear = null;
  }
};