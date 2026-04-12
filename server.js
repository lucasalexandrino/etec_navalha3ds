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

function isBookingConflict(bookings, barberId, date, time) {
  return bookings.some((item) => item.barberId === barberId && item.date === date && item.time === time);
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

function buildAvailability(date, barberId) {
  const data = loadData();
  if (date) {
    const slots = getValidSlotsForDate(date)
      .filter((slot) => {
        const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
        return slotDateTime.getTime() > Date.now();
      })
      .map((slot) => ({
        ...slot,
        occupied: barberId
          ? isBookingConflict(data.bookings, barberId, slot.date, slot.time)
          : getActiveBarbers(data).every((barber) => isBookingConflict(data.bookings, barber.id, slot.date, slot.time))
      }));
    return { date, slots };
  }
  const dates = nextDates(14);
  const output = [];
  dates.forEach((day) => {
    getValidSlotsForDate(day).forEach((slot) => {
      const free = barberId
        ? !isBookingConflict(data.bookings, barberId, slot.date, slot.time)
        : getActiveBarbers(data).some((barber) => !isBookingConflict(data.bookings, barber.id, slot.date, slot.time));
      if (!free) return;
      const dateObj = new Date(`${slot.date}T${slot.time}:00`);
      if (dateObj.getTime() <= Date.now()) return;
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
  return res.json(data.services);
});

app.get("/api/barbers", (req, res) => {
  const data = loadData();
  return res.json(getActiveBarbers(data).map((barber) => ({ id: barber.id, name: barber.name, email: barber.email })));
});

app.get("/api/availability", (req, res) => {
  const { date, barberId } = req.query;
  const output = buildAvailability(date, barberId);
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
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome do serviço é obrigatório." });
  }
  const data = loadData();
  if (data.services.some((item) => normalizeEmail(item.name) === normalizeEmail(name))) {
    return res.status(409).json({ error: "Serviço já cadastrado." });
  }
  const service = { id: createId("servico"), name: name.trim() };
  data.services.push(service);
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

app.post("/api/bookings", authMiddleware, clientMiddleware, (req, res) => {
  const { barberId, serviceId, date, time } = req.body;
  if (!barberId || !serviceId || !date || !time) {
    return res.status(400).json({ error: "Dados de agendamento incompletos." });
  }
  const data = loadData();
  const barber = data.barbers.find((item) => item.id === barberId);
  const service = data.services.find((item) => item.id === serviceId);
  const client = data.clients.find((item) => item.id === req.auth.user.id);
  if (!barber || !service || !client) {
    return res.status(400).json({ error: "Barbeiro, serviço ou cliente inválido." });
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
  if (isBookingConflict(data.bookings, barberId, date, time)) {
    return res.status(409).json({ error: "Horário já ocupado." });
  }
  const booking = {
    id: createId("agendamento"),
    clientId: client.id,
    clientName: client.nome,
    whatsapp: client.whatsapp,
    barberId: barber.id,
    barberName: barber.name,
    serviceId: service.id,
    serviceName: service.name,
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
