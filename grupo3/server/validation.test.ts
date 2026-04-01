import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateTimeSlotAvailability,
  validateMinimumAdvanceBooking,
  validateOperatingHours,
  validateAppointmentBooking,
  validateCancellation,
} from "./validation";
import * as db from "./db";

vi.mock("./db");

describe("Appointment Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateTimeSlotAvailability", () => {
    it("should return true when no conflicts exist", async () => {
      vi.mocked(db.getAppointmentsByBarberId).mockResolvedValue([]);

      const result = await validateTimeSlotAvailability(
        1,
        new Date("2026-04-05 10:00"),
        new Date("2026-04-05 10:30")
      );

      expect(result).toBe(true);
    });

    it("should return false when time slot overlaps with existing appointment", async () => {
      const existingAppointment = {
        id: 1,
        barberId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: new Date("2026-04-05 10:00"),
        endTime: new Date("2026-04-05 10:30"),
        status: "scheduled" as const,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAppointmentsByBarberId).mockResolvedValue([
        existingAppointment,
      ]);

      const result = await validateTimeSlotAvailability(
        1,
        new Date("2026-04-05 10:15"),
        new Date("2026-04-05 10:45")
      );

      expect(result).toBe(false);
    });

    it("should ignore cancelled appointments", async () => {
      const cancelledAppointment = {
        id: 1,
        barberId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: new Date("2026-04-05 10:00"),
        endTime: new Date("2026-04-05 10:30"),
        status: "cancelled" as const,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAppointmentsByBarberId).mockResolvedValue([
        cancelledAppointment,
      ]);

      const result = await validateTimeSlotAvailability(
        1,
        new Date("2026-04-05 10:00"),
        new Date("2026-04-05 10:30")
      );

      expect(result).toBe(true);
    });
  });

  describe("validateMinimumAdvanceBooking", () => {
    it("should return true when booking is more than 1 hour in advance", async () => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 2);

      vi.mocked(db.getSettings).mockResolvedValue({
        minimumAdvanceBookingHours: 1,
      } as any);

      const result = await validateMinimumAdvanceBooking(futureTime);

      expect(result).toBe(true);
    });

    it("should return false when booking is less than 1 hour in advance", async () => {
      const nearFutureTime = new Date();
      nearFutureTime.setMinutes(nearFutureTime.getMinutes() + 30);

      vi.mocked(db.getSettings).mockResolvedValue({
        minimumAdvanceBookingHours: 1,
      } as any);

      const result = await validateMinimumAdvanceBooking(nearFutureTime);

      expect(result).toBe(false);
    });
  });

  describe("validateCancellation", () => {
    it("should allow cancellation with 2+ hours notice", async () => {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 3);

      const appointment = {
        id: 1,
        barberId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: futureTime,
        endTime: new Date(futureTime.getTime() + 30 * 60000),
        status: "scheduled" as const,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAppointmentById).mockResolvedValue(appointment);

      const result = await validateCancellation(1);

      expect(result.valid).toBe(true);
    });

    it("should prevent cancellation with less than 2 hours notice", async () => {
      const nearFutureTime = new Date();
      nearFutureTime.setHours(nearFutureTime.getHours() + 1);

      const appointment = {
        id: 1,
        barberId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: nearFutureTime,
        endTime: new Date(nearFutureTime.getTime() + 30 * 60000),
        status: "scheduled" as const,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAppointmentById).mockResolvedValue(appointment);

      const result = await validateCancellation(1);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("2 horas");
    });

    it("should prevent cancellation of non-scheduled appointments", async () => {
      const appointment = {
        id: 1,
        barberId: 1,
        clientId: 1,
        serviceId: 1,
        startTime: new Date(),
        endTime: new Date(),
        status: "completed" as const,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAppointmentById).mockResolvedValue(appointment);

      const result = await validateCancellation(1);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("confirmados");
    });
  });
});
