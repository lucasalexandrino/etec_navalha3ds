// ========== CONFIGURAÇÕES DO SISTEMA ==========
export let precosConfig = {
  domicilio: 30,
  autista: 10,
  cadeirante: 15,
  deficiente: 10,
  idoso: 20,
  crianca: 15
};

export let temposConfig = {
  domicilio: 20,
  autista: 15,
  cadeirante: 15,
  deficiente: 10,
  idoso: 10,
  crianca: 15
};

export function setPrecosConfig(novaConfig) {
  precosConfig = { ...precosConfig, ...novaConfig };
}

export function setTemposConfig(novaConfig) {
  temposConfig = { ...temposConfig, ...novaConfig };
}

export function getPrecoDesconto(condicao) {
  const descontos = {
    autista: precosConfig.autista,
    cadeirante: precosConfig.cadeirante,
    deficiente: precosConfig.deficiente,
    idoso: precosConfig.idoso,
    crianca: precosConfig.crianca
  };
  return descontos[condicao] || 0;
}

export function getTempoAdicional(condicao) {
  const tempos = {
    autista: temposConfig.autista,
    cadeirante: temposConfig.cadeirante,
    deficiente: temposConfig.deficiente,
    idoso: temposConfig.idoso,
    crianca: temposConfig.crianca
  };
  return tempos[condicao] || 0;
}