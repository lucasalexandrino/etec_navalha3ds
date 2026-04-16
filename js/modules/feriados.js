// ========== FERIADOS NACIONAIS DO BRASIL ==========
export function isFeriadoNacional(date) {
  // Garantir que estamos comparando apenas a data (sem horas)
  // A data já vem padronizada com horário 12:00 do calendário
  const ano = date.getFullYear();
  const mes = date.getMonth() + 1;
  const dia = date.getDate();
  
  // Feriados fixos
  const feriadosFixos = [
    { mes: 1, dia: 1 },      // Ano Novo
    { mes: 4, dia: 21 },     // Tiradentes
    { mes: 5, dia: 1 },      // Dia do Trabalhador
    { mes: 9, dia: 7 },      // Independência do Brasil
    { mes: 10, dia: 12 },    // Nossa Sra. Aparecida
    { mes: 11, dia: 2 },     // Finados
    { mes: 11, dia: 15 },    // Proclamação da República
    { mes: 12, dia: 25 }     // Natal
  ];
  
  for (const feriado of feriadosFixos) {
    if (mes === feriado.mes && dia === feriado.dia) {
      return true;
    }
  }
  
  return false;
}