// ========== FERIADOS NACIONAIS DO BRASIL ==========
export function isFeriadoNacional(date) {
  // Criar uma data padronizada com horário 12:00 para evitar problemas de fuso
  const ano = date.getFullYear();
  const mes = date.getMonth();
  const dia = date.getDate();
  const dataPadronizada = new Date(ano, mes, dia, 12, 0, 0);
  
  const anoNum = dataPadronizada.getFullYear();
  const mesNum = dataPadronizada.getMonth() + 1;
  const diaNum = dataPadronizada.getDate();
  
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
    if (mesNum === feriado.mes && diaNum === feriado.dia) {
      return true;
    }
  }
  
  return false;
}