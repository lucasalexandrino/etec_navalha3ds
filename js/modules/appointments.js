// ========== AGENDAMENTOS ==========
import { Storage } from './storage.js';
import { services, calcularValorFinal, calcularTempoEstimado, formatMoney, formatarTempo } from './services.js';
import { showToast, showConfirmModal, showCancelModal } from './ui.js';

export let appointments = [];
export let cancellations = [];

export function loadAppointments() {
  appointments = Storage.getAppointments();
  cancellations = Storage.getCancellations();
}

export function saveAppointments() {
  Storage.setAppointments(appointments);
}

export function saveCancellations() {
  Storage.setCancellations(cancellations);
}

export function addAppointment(appointmentData) {
  const appointment = { id: Date.now(), ...appointmentData, status: 'agendado', createdAt: new Date().toISOString() };
  appointments.push(appointment);
  saveAppointments();
  return appointment;
}

export function cancelAppointment(id, motivo, canceladoPor) {
  const appointment = appointments.find(a => a.id === id);
  if (!appointment) return false;
  
  const cancelRecord = {
    agendamentoId: id,
    cliente: appointment.cliente,
    dataAgendamento: appointment.data,
    horaAgendamento: appointment.hora,
    motivo: motivo,
    canceladoPor: canceladoPor,
    canceladoEm: new Date().toISOString()
  };
  cancellations.push(cancelRecord);
  saveCancellations();
  
  appointment.status = 'cancelado';
  appointment.motivoCancelamento = motivo;
  appointment.canceladoPor = canceladoPor;
  appointment.canceladoEm = cancelRecord.canceladoEm;
  saveAppointments();
  return true;
}

export function completeAppointment(id) {
  const appointment = appointments.find(a => a.id === id);
  if (appointment && appointment.status === 'agendado') {
    appointment.status = 'concluido';
    appointment.concluidoEm = new Date().toISOString();
    saveAppointments();
    return true;
  }
  return false;
}

export function clearUserCancellations(userNome) {
  appointments = appointments.filter(a => !(a.cliente === userNome && a.status === 'cancelado'));
  saveAppointments();
}

export function clearAllCancellations() {
  cancellations = [];
  saveCancellations();
}

export function ordenarAgendamentos(lista) {
  return [...lista].sort((a, b) => {
    if (a.data === b.data) return a.hora.localeCompare(b.hora);
    return a.data.localeCompare(b.data);
  });
}

export function hasConflict(data, hora, excludeId = null) {
  return appointments.some(a => a.data === data && a.hora === hora && a.status === 'agendado' && (excludeId === null || a.id !== excludeId));
}

// ========== FUNÇÕES PARA BARBEIRO LIMPAR SEUS CONCLUÍDOS ==========
export function getBarbeiroConcluidosLimpos() {
  return Storage.getBarbeiroConcluidosLimpos();
}

export function limparTodosConcluidosBarbeiro() {
  const concluidos = appointments.filter(a => a.status === 'concluido');
  const ids = concluidos.map(a => a.id);
  Storage.limparTodosConcluidosBarbeiro(ids);
}