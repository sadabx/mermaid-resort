require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser with increased limit for base64 images
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup Neon / Postgres connection pool
let pool;
let useMockDb = false;
let mockBookings = [];

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set in environment variables. Falling back to in-memory mock database.");
  useMockDb = true;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test connection & auto-initialize table
  const initDb = async () => {
    try {
      const client = await pool.connect();
      console.log("Successfully connected to Neon PostgreSQL Database.");
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          room VARCHAR(100) NOT NULL,
          price_per_night INT NOT NULL,
          checkin DATE NOT NULL,
          checkout DATE NOT NULL,
          nights INT NOT NULL,
          guests INT NOT NULL,
          total_amount INT NOT NULL,
          advance_amount INT NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          id_card VARCHAR(100),
          id_photo_base64 TEXT,
          id_photo_mime_type VARCHAR(100),
          id_photo_name VARCHAR(255),
          customer_photo_base64 TEXT,
          customer_photo_mime_type VARCHAR(100),
          customer_photo_name VARCHAR(255),
          ip_address VARCHAR(50)
        );
      `);
      console.log("Database 'bookings' table initialized.");
      client.release();
    } catch (err) {
      console.error("Database connection or initialization failed. Falling back to mock database. Error:", err.message);
      useMockDb = true;
    }
  };
  initDb();
}

// Helper: Get all dates between checkin and checkout (inclusive of checkin, exclusive of checkout)
function getDatesInRange(startDateStr, endDateStr) {
  const dates = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return dates;
  }
  
  // Loop through days, exclusive of checkout day
  const current = new Date(start);
  while (current < end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Serve static assets from root and subdirectories
app.use(express.static(path.join(__dirname)));

// API: Get booked dates for a specific room
app.get("/api/booked-dates", async (req, res) => {
  const { room } = req.query;
  if (!room) {
    return res.status(400).json({ error: "Room parameter is required" });
  }

  try {
    let bookings = [];
    if (useMockDb) {
      bookings = mockBookings.filter(b => b.room === room);
    } else {
      const result = await pool.query(
        "SELECT TO_CHAR(checkin, 'YYYY-MM-DD') as checkin_str, TO_CHAR(checkout, 'YYYY-MM-DD') as checkout_str FROM bookings WHERE room = $1",
        [room]
      );
      bookings = result.rows.map(row => ({
        checkin: row.checkin_str,
        checkout: row.checkout_str
      }));
    }

    const disabledDates = [];
    bookings.forEach(b => {
      const dates = getDatesInRange(b.checkin, b.checkout);
      disabledDates.push(...dates);
    });

    // Remove duplicates
    const uniqueDates = [...new Set(disabledDates)];
    return res.json({ dates: uniqueDates });
  } catch (err) {
    console.error("Error in /api/booked-dates:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API: Create a new booking
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      room,
      pricePerNight,
      checkin,
      checkout,
      nights,
      guests,
      totalAmount,
      advance30,
      fullName,
      phone,
      email,
      idCard,
      idPhotoBase64,
      idPhotoMimeType,
      idPhotoName,
      customerPhotoBase64,
      customerPhotoMimeType,
      customerPhotoName,
      ipAddress
    } = req.body;

    if (!room || !checkin || !checkout || !fullName || !phone || !email) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    if (useMockDb) {
      const newBooking = {
        id: mockBookings.length + 1,
        created_at: new Date().toISOString(),
        room,
        price_per_night: pricePerNight || 0,
        checkin,
        checkout,
        nights: nights || 1,
        guests: guests || 1,
        total_amount: totalAmount || 0,
        advance_amount: advance30 || 0,
        full_name: fullName,
        phone,
        email,
        id_card: idCard || "N/A",
        id_photo_base64: idPhotoBase64 || "",
        id_photo_mime_type: idPhotoMimeType || "",
        id_photo_name: idPhotoName || "",
        customer_photo_base64: customerPhotoBase64 || "",
        customer_photo_mime_type: customerPhotoMimeType || "",
        customer_photo_name: customerPhotoName || "",
        ip_address: ipAddress || "Unknown"
      };
      mockBookings.push(newBooking);
      console.log(`Mock DB saved new booking: ID ${newBooking.id} for ${fullName}`);
      return res.json({ success: true, bookingId: newBooking.id });
    } else {
      const queryText = `
        INSERT INTO bookings (
          room, price_per_night, checkin, checkout, nights, guests, 
          total_amount, advance_amount, full_name, phone, email, id_card, 
          id_photo_base64, id_photo_mime_type, id_photo_name, 
          customer_photo_base64, customer_photo_mime_type, customer_photo_name, 
          ip_address
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING id;
      `;
      const values = [
        room, pricePerNight || 0, checkin, checkout, nights || 1, guests || 1,
        totalAmount || 0, advance30 || 0, fullName, phone, email, idCard || "N/A",
        idPhotoBase64 || "", idPhotoMimeType || "", idPhotoName || "",
        customerPhotoBase64 || "", customerPhotoMimeType || "", customerPhotoName || "",
        ipAddress || "Unknown"
      ];

      const result = await pool.query(queryText, values);
      console.log(`Neon DB saved new booking: ID ${result.rows[0].id} for ${fullName}`);
      return res.json({ success: true, bookingId: result.rows[0].id });
    }
  } catch (err) {
    console.error("Error in /api/bookings:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Authorization Middleware
const authorizeAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  // Support either raw password or Bearer token
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  
  if (token !== adminPass) {
    return res.status(401).json({ error: "Invalid password credentials" });
  }
  
  next();
};

// API: Admin Login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  
  if (password === adminPass) {
    return res.json({ success: true, token: adminPass });
  } else {
    return res.status(401).json({ success: false, error: "Incorrect password" });
  }
});

// API: Get all bookings (Admin only)
app.get("/api/admin/bookings", authorizeAdmin, async (req, res) => {
  try {
    if (useMockDb) {
      // Sort mock bookings by id DESC
      const sorted = [...mockBookings].sort((a, b) => b.id - a.id);
      return res.json(sorted);
    } else {
      const result = await pool.query(`
        SELECT 
          id, 
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
          room, 
          price_per_night, 
          TO_CHAR(checkin, 'YYYY-MM-DD') as checkin, 
          TO_CHAR(checkout, 'YYYY-MM-DD') as checkout, 
          nights, 
          guests, 
          total_amount, 
          advance_amount, 
          full_name, 
          phone, 
          email, 
          id_card, 
          id_photo_name, 
          id_photo_mime_type,
          id_photo_base64,
          customer_photo_name,
          customer_photo_mime_type,
          customer_photo_base64,
          ip_address 
        FROM bookings 
        ORDER BY id DESC;
      `);
      return res.json(result.rows);
    }
  } catch (err) {
    console.error("Error in /api/admin/bookings:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API: Delete a booking (Admin only)
app.delete("/api/admin/bookings/:id", authorizeAdmin, async (req, res) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    if (useMockDb) {
      const initialLength = mockBookings.length;
      mockBookings = mockBookings.filter(b => b.id !== bookingId);
      if (mockBookings.length === initialLength) {
        return res.status(404).json({ error: "Booking not found" });
      }
      console.log(`Mock DB deleted booking: ID ${bookingId}`);
      return res.json({ success: true });
    } else {
      const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING id", [bookingId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
      console.log(`Neon DB deleted booking: ID ${bookingId}`);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error("Error in /api/admin/bookings/delete:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Fallback HTML page routing for SPA friendliness
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});
app.get("/restaurant", (req, res) => {
  res.sendFile(path.join(__dirname, "restaurant.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mermaid Resort server is running at http://localhost:${PORT}`);
});
