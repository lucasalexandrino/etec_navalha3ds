// ========== FERIADOS NACIONAIS DO BRASIL ==========
export function isFeriadoNacional(date) {
  const ano = date.getFullYear();
  const mes = date.getMonth() + 1;
  const dia = date.getDate();
  
  // Feriados fixos
  const feriadosFixos = [
    { mes: 1, dia: 1, nome: "Ano Novo" },
    { mes: 4, dia: 21, nome: "Tiradentes" },
    { mes: 5, dia: 1, nome: "Dia do Trabalhador" },
    { mes: 9, dia: 7, nome: "Independência do Brasil" },
    { mes: 10, dia: 12, nome: "Nossa Sra. Aparecida" },
    { mes: 11, dia: 2, nome: "Finados" },
    { mes: 11, dia: 15, nome: "Proclamação da República" },
    { mes: 12, dia: 25, nome: "Natal" }
  ];
  
  for (const feriado of feriadosFixos) {
    if (mes === feriado.mes && dia === feriado.dia) return true;
  }
  
  // Cálculo da Páscoa (algoritmo de Gauss)
  function calcularPascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
    const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mesPascoa - 1, diaPascoa);
  }
  
  const pascoa = calcularPascoa(ano);
  const carnaval = new Date(pascoa);
  carnaval.setDate(pascoa.getDate() - 47);
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);
  
  const feriadosMoveis = [carnaval, sextaSanta, pascoa, corpusChristi];
  
  for (const feriado of feriadosMoveis) {
    if (date.toDateString() === feriado.toDateString()) return true;
  }
  
  return false;
}