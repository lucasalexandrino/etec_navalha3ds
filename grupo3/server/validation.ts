import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Validates if a booking time slot is available for a barber
 * Checks for conflicts with existing appointments
 */
export async function validateTimeSlotAvailability(
  barberId: number,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: number
): Promise<boolean> {
  const barberAppointments = await db.getAppointmentsByBarberId(barberId);

  for (const apt of barberAppointments) {
    // Skip cancelled appointments and the appointment being edited
    if (apt.status === "cancelled") continue;
    if (excludeAppointmentId && apt.id === excludeAppointmentId) continue;

    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);

    // Check for time overlap
    if (startTime < aptEnd && endTime > aptStart) {
      return false;
    }
  }

  return true;
}

/**
 * Validates if booking meets minimum advance booking requirement
 */
export async function validateMinimumAdvanceBooking(
  requestedStartTime: Date
): Promise<boolean> {
  const settings = await db.getSettings();
  const minimumHours = settings?.minimumAdvanceBookingHours || 1;

  const now = new Date();
  const minimumBookingTime = new Date(now.getTime() + minimumHours * 60 * 60 * 1000);

  return requestedStartTime > minimumBookingTime;
}

/**
 * Validates if booking time is within business operating hours
 */
export async function validateOperatingHours(
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const operatingHours = await db.getOperatingHours();
  const dayOfWeek = startTime.getDay();

  const dayHours = operatingHours.find((oh) => oh.dayOfWeek === dayOfWeek);

  if (!dayHours || !dayHours.isOpen) {
    return false;
  }

  const startTimeStr = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endTimeStr = endTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    startTimeStr >= dayHours.startTime &&
    endTimeStr <= dayHours.endTime
  );
}

/**
 * Validates if barber is working on the requested date and time
 */
export async function validateBarberWorkingHours(
  barberId: number,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const barberHours = await db.getBarberWorkingHours(barberId);
  const dayOfWeek = startTime.getDay();

  const dayHours = barberHours.find((bh) => bh.dayOfWeek === dayOfWeek);

  if (!dayHours || !dayHours.isWorkingDay) {
    return false;
  }

  const startTimeStr = startTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const endTimeStr = endTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    startTimeStr >= dayHours.startTime &&
    endTimeStr <= dayHours.endTime
  );
}

/**
 * Comprehensive validation for appointment booking
 */
export async function validateAppointmentBooking(
  barberId: number,
  startTime: Date,
  endTime: Date
): Promise<{ valid: boolean; error?: string }> {
  // Check minimum advance booking
  const meetsMinimumAdvance = await validateMinimumAdvanceBooking(startTime);
  if (!meetsMinimumAdvance) {
    return {
      valid: false,
      error: "O agendamento deve ser feito com no mínimo 1 hora de antecedência",
    };
  }

  // Check operating hours
  const withinOperatingHours = await validateOperatingHours(startTime, endTime);
  if (!withinOperatingHours) {
    return {
      valid: false,
      error: "O horário solicitado está fora do horário de funcionamento",
    };
  }

  // Check barber working hours
  const barberWorking = await validateBarberWorkingHours(
    barberId,
    startTime,
    endTime
  );
  if (!barberWorking) {
    return {
      valid: false,
      error: "O profissional não está disponível no horário solicitado",
    };
  }

  // Check for time slot conflicts
  const slotAvailable = await validateTimeSlotAvailability(
    barberId,
    startTime,
    endTime
  );
  if (!slotAvailable) {
    return {
      valid: false,
      error: "O horário solicitado não está disponível para este profissional",
    };
  }

  return { valid: true };
}

/**
 * Validates cancellation eligibility
 */
export async function validateCancellation(
  appointmentId: number
): Promise<{ valid: boolean; error?: string }> {
  const appointment = await db.getAppointmentById(appointmentId);

  if (!appointment) {
    return { valid: false, error: "Agendamento não encontrado" };
  }

  if (appointment.status !== "scheduled") {
    return {
      valid: false,
      error: "Apenas agendamentos confirmados podem ser cancelados",
    };
  }

  const appointmentTime = new Date(appointment.startTime);
  const now = new Date();
  const minimumCancellationTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

  if (appointmentTime < minimumCancellationTime) {
    return {
      valid: false,
      error: "Cancelamentos devem ser feitos com no mínimo 2 horas de antecedência",
    };
  }

  return { valid: true };
}
