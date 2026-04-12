// ========== SERVIÇOS ==========
import { Storage } from './storage.js';
import { precosConfig, temposConfig, getPrecoDesconto, getTempoAdicional } from './config.js';
import { showToast, showConfirmModal } from './ui.js';

export let services = [];

export function loadServices() {
  services = Storage.getServices();
  return services;
}

export function saveServices() {
  Storage.setServices(services);
}

export function addService(name, preco, tempo) {
  if (!name || name.length < 3) return { success: false, error: 'Nome deve ter pelo menos 3 caracteres' };
  if (!preco || preco <= 0) return { success: false, error: 'Digite um preço válido' };
  
  services.push({ id: Date.now(), name, preco, tempo: tempo || 30 });
  saveServices();
  return { success: true };
}

export function updateService(id, updates) {
  const service = services.find(s => s.id === id);
  if (service) {
    Object.assign(service, updates);
    saveServices();
  }
}

export function deleteService(id) {
  services = services.filter(s => s.id !== id);
  saveServices();
}

export function calcularValorFinal(servicoPreco, condicao, domicilio) {
  const descontoPercent = getPrecoDesconto(condicao);
  const acrescimoPercent = domicilio ? precosConfig.domicilio : 0;
  const valorDesconto = (servicoPreco * descontoPercent) / 100;
  const valorAcrescimo = (servicoPreco * acrescimoPercent) / 100;
  const valorFinal = servicoPreco - valorDesconto + valorAcrescimo;
  
  return { precoOriginal: servicoPreco, desconto: valorDesconto, acrescimo: valorAcrescimo, valorFinal };
}

export function calcularTempoEstimado(tempoBase, condicao, domicilio) {
  let tempo = tempoBase;
  tempo += getTempoAdicional(condicao);
  if (domicilio) tempo += temposConfig.domicilio;
  return tempo;
}

export function formatMoney(value) {
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

export function formatarTempo(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}