import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  services,
  barbers,
  appointments,
  operatingHours,
  barberWorkingHours,
  settings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Services
export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(eq(services.isActive, true));
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

// Barbers
export async function getAllBarbers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(barbers).where(eq(barbers.isActive, true));
}

export async function getBarberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(barbers).where(eq(barbers.id, id)).limit(1);
  return result[0];
}

export async function getBarberByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(barbers).where(eq(barbers.userId, userId)).limit(1);
  return result[0];
}

// Appointments
export async function getAppointmentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.clientId, clientId));
}

export async function getAppointmentsByBarberId(barberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.barberId, barberId));
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
}

// Operating Hours
export async function getOperatingHours() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operatingHours);
}

export async function getBarberWorkingHours(barberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(barberWorkingHours).where(eq(barberWorkingHours.barberId, barberId));
}

// Settings
export async function getSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).limit(1);
  return result[0];
}
