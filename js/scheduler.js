// Scheduler Service - Navalha Barbearia

export const scheduler = {
  HORARIO_ABERTURA: 9,
  HORARIO_FECHAMENTO: 18,
  INTERVALO_LIMPEZA: 10,
  ANTECEDENCIA_MINIMA: 60,
  PASSO_SLOTS: 15,
  
  isDiaUtil(data) {
    const dia = data.getDay();
    return dia >= 1 && dia <= 5;
  },
  
  addMinutes(data, minutos) {
    return new Date(data.getTime() + minutos * 60000);
  },
  
  criarData(dataYmd, horaStr) {
    const [ano, mes, dia] = dataYmd.split('-').map(Number);
    const [hora, minuto] = horaStr.split(':').map(Number);
    return new Date(ano, mes - 1, dia, hora, minuto);
  },
  
  hasConflito(novoInicio, novoFim, agendamentosExistentes, ignorarId = null) {
    const novoInicioTime = novoInicio.getTime();
    const novoFimComLimpeza = this.addMinutes(novoFim, this.INTERVALO_LIMPEZA).getTime();
    
    for (const ag of agendamentosExistentes) {
      if (ag.id === ignorarId) continue;
      if (ag.statusPagamento === 'Cancelado') continue;
      
      const existenteInicio = new Date(ag.inicioIso).getTime();
      const existenteFim = new Date(ag.fimIso).getTime();
      const existenteFimComLimpeza = this.addMinutes(new Date(ag.fimIso), this.INTERVALO_LIMPEZA).getTime();
      
      if (novoInicioTime < existenteFimComLimpeza && novoFimComLimpeza > existenteInicio) {
        return true;
      }
    }
    return false;
  },
  
  gerarSlots(dataYmd, duracaoMinutos, agendamentosExistentes = [], agora = new Date()) {
    const data = new Date(dataYmd);
    const slots = [];
    
    const abertura = new Date(data.getFullYear(), data.getMonth(), data.getDate(), this.HORARIO_ABERTURA, 0);
    const fechamento = new Date(data.getFullYear(), data.getMonth(), data.getDate(), this.HORARIO_FECHAMENTO, 0);
    const ultimoInicio = this.addMinutes(fechamento, -(duracaoMinutos + this.INTERVALO_LIMPEZA));
    
    for (let horario = new Date(abertura); horario <= ultimoInicio; horario = this.addMinutes(horario, this.PASSO_SLOTS)) {
      const fim = this.addMinutes(horario, duracaoMinutos);
      const isPassado = horario < agora;
      const hasConflict = this.hasConflito(horario, fim, agendamentosExistentes);
      const isAntecedenciaOk = (horario.getTime() - agora.getTime()) >= (this.ANTECEDENCIA_MINIMA * 60000);
      
      slots.push({
        inicio: new Date(horario),
        hora: horario.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        disponivel: !isPassado && !hasConflict && isAntecedenciaOk
      });
    }
    
    return slots;
  }
};