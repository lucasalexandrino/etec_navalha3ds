import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "barber", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services offered by the barbershop
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(), // Duration in minutes
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Barbers/Professionals
 */
export const barbers = mysqlTable("barbers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  specialty: varchar("specialty", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;

/**
 * Services offered by each barber
 */
export const barberServices = mysqlTable("barberServices", {
  id: int("id").autoincrement().primaryKey(),
  barberId: int("barberId").notNull(),
  serviceId: int("serviceId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BarberService = typeof barberServices.$inferSelect;
export type InsertBarberService = typeof barberServices.$inferInsert;

/**
 * Working hours for barbers
 * Defines which days and times each barber works
 */
export const barberWorkingHours = mysqlTable("barberWorkingHours", {
  id: int("id").autoincrement().primaryKey(),
  barberId: int("barberId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM format
  isWorkingDay: boolean("isWorkingDay").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BarberWorkingHours = typeof barberWorkingHours.$inferSelect;
export type InsertBarberWorkingHours = typeof barberWorkingHours.$inferInsert;

/**
 * Barbershop operating hours
 * Defines the general business hours
 */
export const operatingHours = mysqlTable("operatingHours", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM format
  isOpen: boolean("isOpen").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OperatingHours = typeof operatingHours.$inferSelect;
export type InsertOperatingHours = typeof operatingHours.$inferInsert;

/**
 * Appointments/Bookings
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  barberId: int("barberId").notNull(),
  serviceId: int("serviceId").notNull(),
  startTime: datetime("startTime").notNull(),
  endTime: datetime("endTime").notNull(),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Business settings
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  minimumAdvanceBookingHours: int("minimumAdvanceBookingHours").default(1).notNull(), // Minimum hours in advance to book
  businessName: varchar("businessName", { length: 100 }).default("Navalha Barbearia").notNull(),
  businessPhone: varchar("businessPhone", { length: 20 }),
  businessEmail: varchar("businessEmail", { length: 320 }),
  businessAddress: text("businessAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;
