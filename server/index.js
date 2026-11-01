import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Validate admin password at startup
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'admin123') {
  console.error('❌ ADMIN_PASSWORD non configuré ou trop faible ! Définissez une variable d\'environnement ADMIN_PASSWORD forte.');
  process.exit(1);
}

// Middleware — CORS restrictif
app.use(cors({
  origin: ['https://smartnouri.cloud'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

// Security headers (inline helmet-like)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple rate limiter (in-memory, per-IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // 10 requests per window

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return next();
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Trop de requêtes. Réessayez dans 15 minutes.' });
  }
  next();
}

// Database Setup
let db;
async function initializeDB() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      establishment TEXT,
      city TEXT,
      business_type TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database initialized');
}

initializeDB();

// --- Routes ---

// 1. Submit Contact Form (rate-limited)
app.post('/api/contacts', rateLimit, async (req, res) => {
  try {
    const { name, phone, establishment, city, businessType, message } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Input length validation
    if (name.length > 200 || phone.length > 20 || 
        (establishment && establishment.length > 200) ||
        (city && city.length > 100) ||
        (message && message.length > 2000)) {
      return res.status(400).json({ error: 'Input trop long' });
    }

    const result = await db.run(
      `INSERT INTO contacts (name, phone, establishment, city, business_type, message) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, phone, establishment || null, city || null, businessType || null, message || null]
    );

    res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Contacts (Protected with strong password)
app.get('/api/contacts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contacts = await db.all('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
