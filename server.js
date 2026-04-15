const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "frontend");
const ADMIN_EMAIL = "admlucas@gmail.com";
const ADMIN_PASSWORD = "12345678";
const JWT_SECRET = process.env.JWT_SECRET || "barbearia-navalha-secret";
const JWT_EXPIRES = "8h";

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ clients: [], barbers: [], services: [], bookings: [] }, null, 2), "utf8");
  }
}

function loadData() {
  ensureDataStore();
  let raw = fs.readFileSync(DATA_FILE, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function getActiveBarbers(data) {
  return (data.barbers || []).filter((barber) => normalizeEmail(barber.email) !== normalizeEmail(ADMIN_EMAIL));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function formatDateTime(date, time) {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function getSlotMinutes(dt) {
  return dt.getHours() * 60 + dt.getMinutes();
}

function isBusinessDay(dt) {
  const day = dt.getDay();
  return day !== 0;
}

function isWithinBusinessHours(dt) {
  const day = dt.getDay();
  const minutes = getSlotMinutes(dt);
  if (day === 0) return false;
  if (minutes < 9 * 60) return false;
  if (day === 6) {
    return minutes <= 13 * 60;
  }
  return minutes <= 18 * 60;
}

function isValidTimeSlot(time) {
  return typeof time === "string" && /^([01]\d|2[0-3]):(00|30)$/.test(time);
}

function isBookingConflict(bookings, barberId, date, time, durationMinutes) {
  // If no duration specified, check only for exact time slot conflict
  if (!durationMinutes) {
    return bookings.some((item) => item.barberId === barberId && item.date === date && item.time === time);
  }

  // Parse the start time and calculate end time
  const startDateTime = formatDateTime(date, time);
  if (!startDateTime) return false;
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  // Check if any existing booking overlaps with the requested time period
  return bookings.some((item) => {
    if (item.barberId !== barberId || item.date !== date) return false;
    const bookingStart = formatDateTime(item.date, item.time);
    if (!bookingStart) return false;
    const bookingDuration = item.durationMinutes || 30;
    const bookingEnd = new Date(bookingStart.getTime() + bookingDuration * 60 * 1000);
    // Overlap exists if one starts before the other ends
    return startDateTime < bookingEnd && endDateTime > bookingStart;
  });
}

function canCancelBooking(booking) {
  const appointment = formatDateTime(booking.date, booking.time);
  if (!appointment) return false;
  const now = new Date();
  const cutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return appointment > cutoff;
}

function getValidSlotsForDate(date) {
  const dt = new Date(`${date}T00:00:00`);
  if (!isBusinessDay(dt)) return [];
  const day = dt.getDay();
  const start = 9 * 60;
  const end = day === 6 ? 13 * 60 : 18 * 60;
  const slots = [];
  for (let minutes = start; minutes <= end; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push({ date, time: `${hour}:${minute}` });
  }
  return slots;
}

function nextDates(days = 14) {
  const list = [];
  const today = new Date();
  for (let i = 0; list.length < days; i += 1) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (!isBusinessDay(candidate)) continue;
    list.push(candidate.toISOString().slice(0, 10));
  }
  return list;
}

function buildAvailability(date, barberId, durationMinutes) {
  const data = loadData();
  const duration = durationMinutes || 30; // Default 30 minutes
  if (date) {
    const slots = getValidSlotsForDate(date)
      .filter((slot) => {
        const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
        return slotDateTime.getTime() > Date.now();
      })
      .map((slot) => {
        const occupied = barberId
          ? isBookingConflict(data.bookings, barberId, slot.date, slot.time, duration)
          : getActiveBarbers(data).some((barber) => isBookingConflict(data.bookings, barber.id, slot.date, slot.time, duration));
        // Also check if slot goes beyond business hours
        const slotEnd = new Date(new Date(`${slot.date}T${slot.time}:00`).getTime() + duration * 60 * 1000);
        const withinHours = isWithinBusinessHours(slotEnd);
        return { ...slot, occupied: occupied || !withinHours };
      });
    return { date, slots };
  }
  const dates = nextDates(14);
  const output = [];
  dates.forEach((day) => {
    getValidSlotsForDate(day).forEach((slot) => {
      const free = barberId
        ? !isBookingConflict(data.bookings, barberId, slot.date, slot.time, duration)
        : getActiveBarbers(data).some((barber) => !isBookingConflict(data.bookings, barber.id, slot.date, slot.time, duration));
      if (!free) return;
      const dateObj = new Date(`${slot.date}T${slot.time}:00`);
      if (dateObj.getTime() <= Date.now()) return;
      // Check if slot end time is within business hours
      const slotEnd = new Date(dateObj.getTime() + duration * 60 * 1000);
      if (!isWithinBusinessHours(slotEnd)) return;
      output.push({
        date: slot.date,
        time: slot.time,
        label: `${dateObj.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} — ${slot.time}`
      });
    });
  });
  return output.slice(0, 36);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido." });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.auth = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.auth || req.auth.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado." });
  }
  return next();
}

function clientMiddleware(req, res, next) {
  if (!req.auth || req.auth.role !== "client") {
    return res.status(403).json({ error: "Acesso negado." });
  }
  return next();
}

function barberMiddleware(req, res, next) {
  if (!req.auth || req.auth.role !== "barber") {
    return res.status(403).json({ error: "Acesso negado." });
  }
  return next();
}

app.get("/api/services", (req, res) => {
  const data = loadData();
  const services = (data.services || []).map((item) => ({
    id: item.id,
    name: item.name,
    price: typeof item.price === "number" ? item.price : 0
  }));
  return res.json(services);
});

app.get("/api/barbers", (req, res) => {
  const data = loadData();
  return res.json(getActiveBarbers(data).map((barber) => ({ id: barber.id, name: barber.name, email: barber.email })));
});

app.get("/api/availability", (req, res) => {
  const { date, barberId, durationMinutes } = req.query;
  const duration = durationMinutes ? Number(durationMinutes) : undefined;
  const output = buildAvailability(date, barberId, duration);
  return res.json(output);
});

app.post("/api/auth/register", (req, res) => {
  const { nome, email, whatsapp, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Dados incompletos." });
  }
  const data = loadData();
  const normalizedEmail = normalizeEmail(email);
  if (data.clients.some((client) => normalizeEmail(client.email) === normalizedEmail)) {
    return res.status(409).json({ error: "E-mail já cadastrado." });
  }
  const client = {
    id: createId("cliente"),
    nome: nome.trim(),
    email: normalizedEmail,
    whatsapp: whatsapp ? whatsapp.trim() : "",
    senha: senha
  };
  data.clients.push(client);
  saveData(data);
  const token = signToken({ role: "client", user: { id: client.id, nome: client.nome, email: client.email, whatsapp: client.whatsapp } });
  return res.json({ role: "client", user: { id: client.id, nome: client.nome, email: client.email, whatsapp: client.whatsapp }, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: "E-mail e senha obrigatórios." });
  }
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail === ADMIN_EMAIL && senha === ADMIN_PASSWORD) {
    const token = signToken({ role: "admin", user: { email: ADMIN_EMAIL, name: "Administrador" } });
    return res.json({ role: "admin", user: { email: ADMIN_EMAIL, name: "Administrador" }, token });
  }
  const data = loadData();
  const client = data.clients.find((item) => normalizeEmail(item.email) === normalizedEmail && item.senha === senha);
  if (client) {
    const token = signToken({ role: "client", user: { id: client.id, nome: client.nome, email: client.email, whatsapp: client.whatsapp } });
    return res.json({ role: "client", user: { id: client.id, nome: client.nome, email: client.email, whatsapp: client.whatsapp }, token });
  }
  const barber = data.barbers.find((item) => normalizeEmail(item.email) === normalizedEmail && item.password === senha);
  if (barber) {
    const token = signToken({ role: "barber", user: { id: barber.id, name: barber.name, email: barber.email } });
    return res.json({ role: "barber", user: { id: barber.id, name: barber.name, email: barber.email }, token });
  }
  return res.status(401).json({ error: "Credenciais inválidas." });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  return res.json(req.auth);
});

app.post("/api/admin/services", authMiddleware, adminMiddleware, (req, res) => {
  const { name, price } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do serviço é obrigatório." });
  }
  const parsedPrice = parsePrice(price);
  if (parsedPrice === null) {
    return res.status(400).json({ error: "Preço do serviço inválido." });
  }
  const data = loadData();
  if (data.services.some((item) => normalizeEmail(item.name) === normalizeEmail(name))) {
    return res.status(409).json({ error: "Serviço já cadastrado." });
  }
  const service = { id: createId("servico"), name: name.trim(), price: parsedPrice };
  data.services.push(service);
  saveData(data);
  return res.json(service);
});

app.put("/api/admin/services/:id", authMiddleware, adminMiddleware, (req, res) => {
  const serviceId = req.params.id;
  const { name, price } = req.body;
  const data = loadData();
  const service = data.services.find((item) => item.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do serviço é obrigatório." });
  }
  const parsedPrice = parsePrice(price);
  if (parsedPrice === null) {
    return res.status(400).json({ error: "Preço do serviço inválido." });
  }
  service.name = name.trim();
  service.price = parsedPrice;
  saveData(data);
  return res.json(service);
});

app.delete("/api/admin/services/:id", authMiddleware, adminMiddleware, (req, res) => {
  const serviceId = req.params.id;
  const data = loadData();
  if (!data.services.some((service) => service.id === serviceId)) {
    return res.status(404).json({ error: "Serviço não encontrado." });
  }
  data.services = data.services.filter((service) => service.id !== serviceId);
  saveData(data);
  return res.json({ success: true });
});

app.post("/api/admin/barbers", authMiddleware, adminMiddleware, (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Dados do barbeiro incompletos." });
  }
  const data = loadData();
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail === normalizeEmail(ADMIN_EMAIL)) {
    return res.status(400).json({ error: "Este e-mail pertence ao administrador e não pode ser cadastrado como barbeiro." });
  }
  if (data.barbers.some((item) => normalizeEmail(item.email) === normalizedEmail)) {
    return res.status(409).json({ error: "E-mail do barbeiro já cadastrado." });
  }
  const barber = {
    id: createId("barbeiro"),
    name: name.trim(),
    email: normalizedEmail,
    password: password
  };
  data.barbers.push(barber);
  saveData(data);
  return res.json({ id: barber.id, name: barber.name, email: barber.email });
});

app.get("/api/admin/clients", authMiddleware, adminMiddleware, (req, res) => {
  const data = loadData();
  return res.json(data.clients.map((client) => ({ id: client.id, nome: client.nome, email: client.email, whatsapp: client.whatsapp })));
});

app.delete("/api/admin/clients/:id", authMiddleware, adminMiddleware, (req, res) => {
  const clientId = req.params.id;
  const data = loadData();
  if (!data.clients.some((client) => client.id === clientId)) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }
  data.clients = data.clients.filter((client) => client.id !== clientId);
  data.bookings = data.bookings.filter((booking) => booking.clientId !== clientId);
  saveData(data);
  return res.json({ success: true });
});

app.get("/api/admin/reports/monthly", authMiddleware, adminMiddleware, (req, res) => {
  const requestedMonth = Number(req.query.month);
  const requestedYear = Number(req.query.year);
  const data = loadData();
  const bookings = data.bookings || [];
  const summaries = [];
  if (Number.isFinite(requestedMonth) && Number.isFinite(requestedYear)) {
    summaries.push({ month: requestedMonth, year: requestedYear });
  } else {
    const today = new Date();
    for (let offset = 0; offset >= -2; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      summaries.push({ month: date.getMonth(), year: date.getFullYear() });
    }
  }
  const report = summaries.map(({ month, year }) => {
    let total = 0;
    let servicesCount = 0;
    let bookingsCount = 0;
    bookings.forEach((booking) => {
      const bookingDate = formatDateTime(booking.date, booking.time);
      if (!bookingDate) return;
      if (bookingDate.getMonth() !== month || bookingDate.getFullYear() !== year) return;
      bookingsCount += 1;
      const items = Array.isArray(booking.serviceItems)
        ? booking.serviceItems
        : booking.serviceId
        ? [{ price: booking.servicePrice || 0 }]
        : [];
      servicesCount += items.length;
      total += items.reduce((sum, item) => sum + (typeof item.price === "number" ? item.price : 0), 0);
    });
    return {
      month,
      year,
      monthLabel: `${String(month + 1).padStart(2, "0")}/${year}`,
      total: Number(total.toFixed(2)),
      servicesCount,
      bookingsCount,
    };
  });
  return res.json(report);
});

app.get("/api/bookings", authMiddleware, (req, res) => {
  const data = loadData();
  if (req.auth.role === "admin") {
    return res.json(data.bookings);
  }
  if (req.auth.role === "client") {
    return res.json(data.bookings.filter((booking) => booking.clientId === req.auth.user.id));
  }
  if (req.auth.role === "barber") {
    return res.json(data.bookings.filter((booking) => booking.barberId === req.auth.user.id));
  }
  return res.status(403).json({ error: "Acesso negado." });
});

app.get("/api/barber/earnings", authMiddleware, barberMiddleware, (req, res) => {
  const requestedMonth = Number(req.query.month);
  const requestedYear = Number(req.query.year);
  const data = loadData();
  const barberId = req.auth.user.id;
  
  // Get current month and year if not specified
  const today = new Date();
  const month = Number.isFinite(requestedMonth) ? requestedMonth : today.getMonth();
  const year = Number.isFinite(requestedYear) ? requestedYear : today.getFullYear();
  
  // Filter bookings for this barber and month
  const bookings = (data.bookings || []).filter((booking) => {
    if (booking.barberId !== barberId) return false;
    const bookingDate = formatDateTime(booking.date, booking.time);
    if (!bookingDate) return false;
    return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
  });
  
  // Calculate total earnings
  let totalEarnings = 0;
  let bookingsCount = 0;
  
  bookings.forEach((booking) => {
    if (typeof booking.totalValue === "number") {
      totalEarnings += booking.totalValue;
      bookingsCount += 1;
    }
  });
  
  totalEarnings = Number(totalEarnings.toFixed(2));
  
  return res.json({
    month,
    year,
    monthLabel: `${String(month + 1).padStart(2, "0")}/${year}`,
    totalEarnings,
    bookingsCount,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      time: booking.time,
      clientName: booking.clientName,
      serviceName: booking.serviceName,
      totalValue: booking.totalValue
    }))
  });
});

app.post("/api/bookings", authMiddleware, clientMiddleware, (req, res) => {
  const { barberId, serviceId, serviceIds, date, time } = req.body;
  const selectedServiceIds = Array.isArray(serviceIds) ? serviceIds : serviceId ? [serviceId] : [];
  if (!barberId || !selectedServiceIds.length || !date || !time) {
    return res.status(400).json({ error: "Dados de agendamento incompletos." });
  }
  const data = loadData();
  const barber = data.barbers.find((item) => item.id === barberId);
  const client = data.clients.find((item) => item.id === req.auth.user.id);
  if (!barber || !client) {
    return res.status(400).json({ error: "Barbeiro ou cliente inválido." });
  }
  const services = selectedServiceIds.map((id) => data.services.find((item) => item.id === id)).filter(Boolean);
  if (services.length !== selectedServiceIds.length) {
    return res.status(400).json({ error: "Serviço inválido." });
  }
  if (!isValidTimeSlot(time)) {
    return res.status(400).json({ error: "Horário deve ser um slot de 30 minutos, como 09:00 ou 09:30." });
  }
  const appointment = formatDateTime(date, time);
  if (!appointment || !isWithinBusinessHours(appointment)) {
    return res.status(400).json({ error: "Horário fora do expediente." });
  }
  if (appointment.getTime() <= Date.now()) {
    return res.status(400).json({ error: "Não é possível agendar em horários passados." });
  }
  // Calculate total duration: 30 minutes per service
  const durationMinutes = Math.max(30, selectedServiceIds.length * 30);
  // Check if appointment end time is within business hours
  const appointmentEnd = new Date(appointment.getTime() + durationMinutes * 60 * 1000);
  if (!isWithinBusinessHours(appointmentEnd)) {
    return res.status(400).json({ error: "O agendamento ultrapassaria o horário de fechamento. Escolha um horário anterior." });
  }
  // Check for conflicts during entire appointment duration
  if (isBookingConflict(data.bookings, barberId, date, time, durationMinutes)) {
    return res.status(409).json({ error: "Barbeiro indisponível neste horário (conflito com outro agendamento)." });
  }
  const serviceItems = services.map((service) => ({
    id: service.id,
    name: service.name,
    price: typeof service.price === "number" ? service.price : 0,
  }));
  const totalValue = Number(serviceItems.reduce((sum, item) => sum + item.price, 0).toFixed(2));
  const booking = {
    id: createId("agendamento"),
    clientId: client.id,
    clientName: client.nome,
    whatsapp: client.whatsapp,
    barberId: barber.id,
    barberName: barber.name,
    serviceItems,
    serviceIds: selectedServiceIds,
    serviceName: serviceItems.map((item) => item.name).join(", "),
    totalValue,
    durationMinutes,
    date,
    time
  };
  data.bookings.push(booking);
  saveData(data);
  return res.json(booking);
});

app.delete("/api/bookings/:id", authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const data = loadData();
  const booking = data.bookings.find((item) => item.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Agendamento não encontrado." });
  }
  if (req.auth.role === "admin") {
    data.bookings = data.bookings.filter((item) => item.id !== bookingId);
    saveData(data);
    return res.json({ success: true });
  }
  if (req.auth.role === "barber") {
    if (booking.barberId !== req.auth.user.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    data.bookings = data.bookings.filter((item) => item.id !== bookingId);
    saveData(data);
    return res.json({ success: true });
  }
  if (req.auth.role === "client") {
    if (booking.clientId !== req.auth.user.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    if (!canCancelBooking(booking)) {
      return res.status(400).json({ error: "Cancelamento deve ser feito com ao menos 2 horas de antecedência." });
    }
    data.bookings = data.bookings.filter((item) => item.id !== bookingId);
    saveData(data);
    return res.json({ success: true });
  }
  return res.status(403).json({ error: "Acesso negado." });
});

app.patch("/api/bookings/:id/status", authMiddleware, (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  
  if (!status || !["agendado", "realizado", "cancelado"].includes(status)) {
    return res.status(400).json({ error: "Status inválido. Use: agendado, realizado ou cancelado." });
  }
  
  const data = loadData();
  const booking = data.bookings.find((item) => item.id === bookingId);
  
  if (!booking) {
    return res.status(404).json({ error: "Agendamento não encontrado." });
  }
  
  // Verificar permissões
  if (req.auth.role === "admin") {
    // Admin pode alterar qualquer status
  } else if (req.auth.role === "barber") {
    if (booking.barberId !== req.auth.user.id) {
      return res.status(403).json({ error: "Acesso negado. Você só pode alterar seus próprios agendamentos." });
    }
    // Barbeiro só pode marcar como realizado
    if (status !== "realizado") {
      return res.status(403).json({ error: "Barbeiro só pode marcar agendamentos como realizados." });
    }
  } else if (req.auth.role === "client") {
    if (booking.clientId !== req.auth.user.id) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    // Cliente só pode cancelar
    if (status !== "cancelado") {
      return res.status(403).json({ error: "Cliente só pode cancelar agendamentos." });
    }
  } else {
    return res.status(403).json({ error: "Acesso negado." });
  }
  
  // Atualizar status
  booking.status = status;
  saveData(data);
  
  return res.json({ success: true, booking: booking });
});

app.get("*", (req, res) => {
  const filePath = path.join(PUBLIC_DIR, req.path === "/" ? "index.html" : req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
