import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { services } from "../drizzle/schema";

// Helper to create admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Helper to create barber-only procedure
const barberProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "barber") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Barber access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Services
  services: router({
    list: publicProcedure.query(async () => {
      return await db.getAllServices();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getServiceById(input.id);
    }),
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.string(),
          durationMinutes: z.number().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const result = await database.insert(services).values({
          name: input.name,
          description: input.description,
          price: input.price,
          durationMinutes: input.durationMinutes,
        });
        
        return { id: result[0].insertId };
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          durationMinutes: z.number().min(1).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.price) updates.price = input.price;
        if (input.durationMinutes) updates.durationMinutes = input.durationMinutes;
        
        await database.update(services).set(updates).where(eq(services.id, input.id));
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        await database.update(services).set({ isActive: false }).where(eq(services.id, input.id));
        return { success: true };
      }),
  }),

  // Barbers
  barbers: router({
    list: publicProcedure.query(async () => {
      return await db.getAllBarbers();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getBarberById(input.id);
    }),
    getMe: barberProcedure.query(async ({ ctx }) => {
      return await db.getBarberByUserId(ctx.user.id);
    }),
  }),

  // Appointments
  appointments: router({
    listByClient: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAppointmentsByClientId(ctx.user.id);
    }),
    listByBarber: barberProcedure.query(async ({ ctx }) => {
      const barber = await db.getBarberByUserId(ctx.user.id);
      if (!barber) throw new TRPCError({ code: "NOT_FOUND" });
      return await db.getAppointmentsByBarberId(barber.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment) throw new TRPCError({ code: "NOT_FOUND" });
        
        if (ctx.user.role === "user" && appointment.clientId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        return appointment;
      }),
  }),

  // Settings
  settings: router({
    get: publicProcedure.query(async () => {
      return await db.getSettings();
    }),
  }),
});

export type AppRouter = typeof appRouter;
