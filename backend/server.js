const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser with increased limit for legacy Base64 JSON submissions
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Multer setup for memory storage of binary uploads with 5MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

// Setup Neon / Postgres connection pool
let pool;
let useMockDb = false;
let mockBookings = [];
let mockLoginAttempts = {};

if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL is not set in environment variables. Falling back to in-memory mock database.",
  );
  useMockDb = true;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
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
          id_photo_data BYTEA,
          id_photo_mime_type VARCHAR(100),
          id_photo_name VARCHAR(255),
          customer_photo_data BYTEA,
          customer_photo_mime_type VARCHAR(100),
          customer_photo_name VARCHAR(255),
          ip_address VARCHAR(50)
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          ip_address VARCHAR(45) PRIMARY KEY,
          attempts INT DEFAULT 0,
          last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Migrate legacy DB columns if present from base64 tests
      await client.query(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_photo_data BYTEA;",
      );
      await client.query(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_photo_data BYTEA;",
      );
      await client.query(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';",
      );
      await client.query(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bkash_payment_id VARCHAR(100);",
      );
      await client.query(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bkash_trx_id VARCHAR(100);",
      );
      console.log("Database tables initialized.");
      client.release();
    } catch (err) {
      console.error(
        "Database connection or initialization failed. Falling back to mock database. Error:",
        err.message,
      );
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
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Serve static assets from root and subdirectories
app.use(express.static(path.join(__dirname, "..")));

// API: Get booked dates for a specific room
app.get("/api/booked-dates", async (req, res) => {
  const { room } = req.query;
  if (!room) {
    return res.status(400).json({ error: "Room parameter is required" });
  }

  try {
    let bookings = [];
    if (useMockDb) {
      bookings = mockBookings.filter((b) => b.room === room);
    } else {
      const result = await pool.query(
        "SELECT TO_CHAR(checkin, 'YYYY-MM-DD') as checkin_str, TO_CHAR(checkout, 'YYYY-MM-DD') as checkout_str FROM bookings WHERE room = $1",
        [room],
      );
      bookings = result.rows.map((row) => ({
        checkin: row.checkin_str,
        checkout: row.checkout_str,
      }));
    }

    const disabledDates = [];
    bookings.forEach((b) => {
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

// API: Create a new booking (Supports both Multipart binary and legacy JSON Base64 uploads)
app.post(
  "/api/bookings",
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "customerPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const isJson = req.is("json");
      console.log(
        `Received booking request. Format: ${isJson ? "JSON" : "Multipart"}`,
      );

      let room,
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
        ipAddress;
      let idPhotoData = null,
        idPhotoName = "",
        idPhotoMime = "";
      let customerPhotoData = null,
        customerPhotoName = "",
        customerPhotoMime = "";

      if (isJson) {
        // Extract fields from JSON payload
        ({
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
          ipAddress,
          idPhotoBase64,
          idPhotoMimeType,
          idPhotoName: idName,
          customerPhotoBase64,
          customerPhotoMimeType: custMime,
          customerPhotoName: custName,
        } = req.body);

        // Convert base64 fields back to binary buffer for BYTEA storage
        if (req.body.idPhotoBase64) {
          idPhotoData = Buffer.from(req.body.idPhotoBase64, "base64");
          idPhotoName = idName || "nid.jpg";
          idPhotoMime = idPhotoMimeType || "image/jpeg";
        }
        if (req.body.customerPhotoBase64) {
          customerPhotoData = Buffer.from(
            req.body.customerPhotoBase64,
            "base64",
          );
          customerPhotoName = custName || "customer.jpg";
          customerPhotoMime = custMime || "image/jpeg";
        }
      } else {
        // Extract fields from multipart form
        ({
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
          ipAddress,
        } = req.body);

        // Extract files from multer
        const idPhotoFile =
          req.files && req.files.idPhoto ? req.files.idPhoto[0] : null;
        const customerPhotoFile =
          req.files && req.files.customerPhoto
            ? req.files.customerPhoto[0]
            : null;

        idPhotoData = idPhotoFile ? idPhotoFile.buffer : null;
        idPhotoName = idPhotoFile ? idPhotoFile.originalname : "";
        idPhotoMime = idPhotoFile ? idPhotoFile.mimetype : "";

        customerPhotoData = customerPhotoFile ? customerPhotoFile.buffer : null;
        customerPhotoName = customerPhotoFile
          ? customerPhotoFile.originalname
          : "";
        customerPhotoMime = customerPhotoFile ? customerPhotoFile.mimetype : "";
      }

      if (!room || !checkin || !checkout || !fullName || !phone || !email) {
        return res.status(400).json({ error: "Required fields are missing" });
      }

      if (useMockDb) {
        const newBooking = {
          id: mockBookings.length + 1,
          created_at: new Date().toISOString(),
          room,
          price_per_night: parseInt(pricePerNight) || 0,
          checkin,
          checkout,
          nights: parseInt(nights) || 1,
          guests: parseInt(guests) || 1,
          total_amount: parseInt(totalAmount) || 0,
          advance_amount: parseInt(advance30) || 0,
          full_name: fullName,
          phone,
          email,
          id_card: idCard || "N/A",
          id_photo_data: idPhotoData,
          id_photo_name: idPhotoName,
          id_photo_mime_type: idPhotoMime,
          customer_photo_data: customerPhotoData,
          customer_photo_name: customerPhotoName,
          customer_photo_mime_type: customerPhotoMime,
          ip_address: ipAddress || "Unknown",
          payment_status: "pending",
          bkash_payment_id: null,
          bkash_trx_id: null,
        };
        mockBookings.push(newBooking);
        console.log(
          `Mock DB saved new booking: ID ${newBooking.id} for ${fullName}`,
        );
        return res.json({ success: true, bookingId: newBooking.id });
      } else {
        const queryText = `
          INSERT INTO bookings (
            room, price_per_night, checkin, checkout, nights, guests, 
            total_amount, advance_amount, full_name, phone, email, id_card, 
            id_photo_data, id_photo_mime_type, id_photo_name, 
            customer_photo_data, customer_photo_mime_type, customer_photo_name, 
            ip_address
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          ) RETURNING id;
        `;
        const values = [
          room,
          parseInt(pricePerNight) || 0,
          checkin,
          checkout,
          parseInt(nights) || 1,
          parseInt(guests) || 1,
          parseInt(totalAmount) || 0,
          parseInt(advance30) || 0,
          fullName,
          phone,
          email,
          idCard || "N/A",
          idPhotoData,
          idPhotoMime,
          idPhotoName,
          customerPhotoData,
          customerPhotoMime,
          customerPhotoName,
          ipAddress || "Unknown",
        ];

        const result = await pool.query(queryText, values);
        console.log(
          `Neon DB saved new booking: ID ${result.rows[0].id} for ${fullName}`,
        );
        return res.json({ success: true, bookingId: result.rows[0].id });
      }
    } catch (err) {
      console.error("Error in /api/bookings:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// =========================================================================
// bKASH TOKENIZED CHECKOUT API ENDPOINTS (SANDBOX)
// =========================================================================

// API: Initiate bKash Payment
app.get("/api/bkash/initiate", async (req, res) => {
  const { bookingId } = req.query;
  if (!bookingId) {
    return res.status(400).send("Booking ID is required");
  }

  // If using in-memory mock DB, simulate successful redirect to mock success callback
  if (useMockDb) {
    console.log(`Mock DB initiating simulated bKash payment for Booking ID: ${bookingId}`);
    return res.redirect(`/api/bkash/callback?status=success&paymentID=MOCK_PAYMENT_ID&bookingId=${bookingId}`);
  }

  try {
    // 1. Fetch booking details to get the amount (advance_amount) and phone
    const dbResult = await pool.query(
      "SELECT advance_amount, phone FROM bookings WHERE id = $1",
      [parseInt(bookingId)]
    );
    if (dbResult.rows.length === 0) {
      return res.status(404).send("Booking not found");
    }
    const booking = dbResult.rows[0];

    // 2. Grant Token from bKash Sandbox
    const tokenResponse = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "username": process.env.BKASH_USER_NAME,
        "password": process.env.BKASH_PASSWORD
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("bKash Grant Token error:", errorText);
      return res.redirect(`/payment-status?status=failed&reason=bkash_auth_failed`);
    }
    
    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    // 3. Create Payment with bKash Sandbox
    const callbackURL = `${process.env.BKASH_CALLBACK_URL || 'https://mermaid.trionine.com/api/bkash/callback'}?bookingId=${bookingId}`;
    const createResponse = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": idToken,
        "X-APP-Key": process.env.BKASH_APP_KEY
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: booking.phone || "01770618575",
        callbackURL: callbackURL,
        amount: booking.advance_amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: `INV-${bookingId}-${Date.now().toString().slice(-4)}`
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("bKash Create Payment error:", errorText);
      return res.redirect(`/payment-status?status=failed&reason=bkash_create_failed`);
    }

    const createData = await createResponse.json();
    
    if (createData.statusCode && createData.statusCode !== "0000") {
      console.error("bKash API create payment returned status error:", createData.statusMessage);
      return res.redirect(`/payment-status?status=failed&reason=${encodeURIComponent(createData.statusMessage)}`);
    }

    // 4. Save bKash PaymentID in Database
    await pool.query(
      "UPDATE bookings SET bkash_payment_id = $1 WHERE id = $2",
      [createData.paymentID, parseInt(bookingId)]
    );

    // 5. Redirect user to bKash portal (OTP/PIN entry screen)
    return res.redirect(createData.bkashURL);

  } catch (err) {
    console.error("Error in bKash initiate route:", err.message);
    return res.redirect(`/payment-status?status=failed&reason=internal_server_error`);
  }
});

// API: bKash Callback Endpoint
app.get("/api/bkash/callback", async (req, res) => {
  const { paymentID, status, bookingId } = req.query;

  if (!bookingId) {
    return res.status(400).send("Booking ID is missing");
  }

  // Handle cancelled or failed states
  if (status === "cancel" || status === "failure") {
    if (useMockDb) {
      const booking = mockBookings.find(b => b.id === parseInt(bookingId));
      if (booking) booking.payment_status = "cancelled";
    } else {
      await pool.query(
        "UPDATE bookings SET payment_status = $1 WHERE id = $2",
        [status === "cancel" ? "cancelled" : "failed", parseInt(bookingId)]
      );
    }
    return res.redirect(`/payment-status?status=failed&reason=${status}`);
  }

  if (status !== "success" || !paymentID) {
    return res.redirect(`/payment-status?status=failed&reason=unknown_status`);
  }

  // Handle mock DB mode
  if (useMockDb) {
    const booking = mockBookings.find(b => b.id === parseInt(bookingId));
    if (booking) {
      booking.payment_status = "paid";
      booking.bkash_trx_id = "MOCK-BKASH-TRXID";
      console.log(`Mock DB completed simulated payment for Booking ID: ${bookingId}`);
      return res.redirect(`/payment-status?status=success&id=${bookingId}&total=${booking.total_amount}&advance=${booking.advance_amount}&trx=MOCK-BKASH-TRXID`);
    }
    return res.redirect(`/payment-status?status=success&id=${bookingId}`);
  }

  try {
    // 1. Grant Token
    const tokenResponse = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "username": process.env.BKASH_USER_NAME,
        "password": process.env.BKASH_PASSWORD
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      })
    });
    
    if (!tokenResponse.ok) {
      console.error("bKash Grant Token failed in callback");
      return res.redirect(`/payment-status?status=failed&reason=bkash_auth_failed`);
    }
    
    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    // 2. Execute Payment with bKash Sandbox to finalize charges
    const executeResponse = await fetch(`${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": idToken,
        "X-APP-Key": process.env.BKASH_APP_KEY
      },
      body: JSON.stringify({ paymentID })
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      console.error("bKash Execute Payment request failed:", errorText);
      return res.redirect(`/payment-status?status=failed&reason=execute_failed`);
    }

    const executeData = await executeResponse.json();

    // Check if bKash successfully finalized the transaction
    if (executeData.transactionStatus === "Completed" || (executeData.statusCode === "0000")) {
      // 3. Mark booking as paid in Neon PostgreSQL Database
      await pool.query(
        "UPDATE bookings SET payment_status = 'paid', bkash_trx_id = $1 WHERE id = $2",
        [executeData.trxID || "MOCK-TRX-ID", parseInt(bookingId)]
      );
      
      const bResult = await pool.query(
        "SELECT total_amount, advance_amount FROM bookings WHERE id = $1",
        [parseInt(bookingId)]
      );
      const bData = bResult.rows[0] || { total_amount: 0, advance_amount: 0 };
      
      console.log(`bKash payment success: Booking ID ${bookingId}, TrxID ${executeData.trxID}`);
      return res.redirect(`/payment-status?status=success&id=${bookingId}&total=${bData.total_amount}&advance=${bData.advance_amount}&trx=${executeData.trxID || "MOCK-TRX-ID"}`);
    } else {
      console.error("bKash Execute Payment status not Completed:", executeData.statusMessage);
      await pool.query(
        "UPDATE bookings SET payment_status = 'failed' WHERE id = $1",
        [parseInt(bookingId)]
      );
      return res.redirect(`/payment-status?status=failed&reason=${encodeURIComponent(executeData.statusMessage || 'unsuccessful')}`);
    }

  } catch (err) {
    console.error("Error in bKash callback route:", err.message);
    return res.redirect(`/payment-status?status=failed&reason=internal_server_error`);
  }
});

// Admin Authorization Middleware (supports header token & query param token)
const authorizeAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  const adminPass = process.env.ADMIN_PASSWORD;

  let token = null;
  if (authHeader) {
    token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  if (token !== adminPass) {
    return res.status(401).json({ error: "Invalid password credentials" });
  }

  next();
};

// API: Admin Login (with database-backed brute-force lockout protection)
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPass) {
    console.error("Critical Security Alert: ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment variables.");
    return res.status(500).json({ success: false, error: "Internal server authentication configuration error." });
  }

  // Identify client IP address
  const ip = req.headers["x-nf-client-connection-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown-ip";

  const windowMs = 15 * 60 * 1000; // 15 minutes lockout window
  const maxAttempts = 5;

  try {
    let attemptsCount = 0;
    let lastAttempt = null;

    if (useMockDb) {
      const record = mockLoginAttempts[ip];
      if (record) {
        attemptsCount = record.attempts;
        lastAttempt = record.lastAttemptAt;
      }
    } else {
      const result = await pool.query(
        "SELECT attempts, last_attempt_at FROM login_attempts WHERE ip_address = $1",
        [ip]
      );
      if (result.rows.length > 0) {
        attemptsCount = result.rows[0].attempts;
        lastAttempt = result.rows[0].last_attempt_at;
      }
    }

    // Check if IP is currently locked out
    if (attemptsCount >= maxAttempts && lastAttempt) {
      const timeSinceLast = Date.now() - new Date(lastAttempt).getTime();
      if (timeSinceLast < windowMs) {
        const minutesLeft = Math.ceil((windowMs - timeSinceLast) / 60000);
        return res.status(429).json({
          success: false,
          error: `Too many failed login attempts. Please try again in ${minutesLeft} minute(s).`
        });
      } else {
        // Lockout expired, reset attempts count for validation
        attemptsCount = 0;
      }
    }

    const isCorrect = (username === adminUsername) && (password === adminPass);

    if (isCorrect) {
      // Clear logged attempts on successful login
      if (useMockDb) {
        delete mockLoginAttempts[ip];
      } else {
        await pool.query("DELETE FROM login_attempts WHERE ip_address = $1", [ip]);
      }
      return res.json({ success: true, token: adminPass });
    } else {
      // Increment failed attempt count
      attemptsCount += 1;
      const now = new Date();

      if (useMockDb) {
        mockLoginAttempts[ip] = {
          attempts: attemptsCount,
          lastAttemptAt: now
        };
      } else {
        await pool.query(
          `INSERT INTO login_attempts (ip_address, attempts, last_attempt_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (ip_address)
           DO UPDATE SET attempts = $2, last_attempt_at = $3`,
          [ip, attemptsCount, now]
        );
      }

      const remaining = maxAttempts - attemptsCount;
      const errorMsg = remaining > 0
        ? `Incorrect username or password. ${remaining} attempt(s) remaining before temporary lockout.`
        : "Incorrect username or password. Too many failed attempts: your IP is locked out for 15 minutes.";

      return res.status(401).json({ success: false, error: errorMsg });
    }
  } catch (err) {
    console.error("Error in /api/admin/login:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API: Get all bookings (Admin only) - Excludes heavy binary buffer fields
app.get("/api/admin/bookings", authorizeAdmin, async (req, res) => {
  try {
    if (useMockDb) {
      // Exclude attachment buffers from the mock db list response
      const cleanMock = mockBookings.map(
        ({ id_photo_data, customer_photo_data, ...rest }) => rest,
      );
      const sorted = cleanMock.sort((a, b) => b.id - a.id);
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
          customer_photo_name,
          customer_photo_mime_type,
          ip_address,
          payment_status,
          bkash_trx_id
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

// API: Get booking file attachment stream (Admin only) - Decodes legacy Base64 text if binary data column is empty
app.get(
  "/api/admin/bookings/attachments/:id/:type",
  authorizeAdmin,
  async (req, res) => {
    const bookingId = parseInt(req.params.id);
    const type = req.params.type; // 'idPhoto' or 'customerPhoto'

    if (isNaN(bookingId) || (type !== "idPhoto" && type !== "customerPhoto")) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    try {
      let booking = null;
      if (useMockDb) {
        booking = mockBookings.find((b) => b.id === bookingId);
      } else {
        const colPrefix = type === "idPhoto" ? "id_photo" : "customer_photo";
        const result = await pool.query(
          `SELECT 
           ${colPrefix}_data as file_data, 
           ${colPrefix}_base64 as file_base64,
           ${colPrefix}_mime_type as mime_type, 
           ${colPrefix}_name as filename 
         FROM bookings WHERE id = $1`,
          [bookingId],
        );
        if (result.rows.length > 0) {
          booking = result.rows[0];
        }
      }

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      let fileData = null;
      let mimeType = "";
      let filename = "";

      if (useMockDb) {
        fileData =
          type === "idPhoto"
            ? booking.id_photo_data
            : booking.customer_photo_data;
        if (!fileData) {
          const legacyBase64Text =
            type === "idPhoto"
              ? booking.id_photo_base64
              : booking.customer_photo_base64;
          if (legacyBase64Text) {
            fileData = Buffer.from(legacyBase64Text, "base64");
          }
        }
        mimeType =
          type === "idPhoto"
            ? booking.id_photo_mime_type
            : booking.customer_photo_mime_type;
        filename =
          type === "idPhoto"
            ? booking.id_photo_name
            : booking.customer_photo_name;
      } else {
        fileData = booking.file_data;
        // Fallback: If binary BYTEA is empty but legacy Base64 text is present, decode it on the fly
        if (!fileData && booking.file_base64) {
          console.log(
            `Streaming legacy base64 file decoded to binary for ID ${bookingId} (${type})`,
          );
          fileData = Buffer.from(booking.file_base64, "base64");
        }
        mimeType = booking.mime_type;
        filename = booking.filename;
      }

      if (!fileData) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Serverless-compatible response headers
      const finalMimeType = mimeType || "application/octet-stream";
      res.setHeader("Content-Type", finalMimeType);
      res.setHeader("Content-Length", fileData.length);
      res.setHeader("Cache-Control", "no-store");

      const safeFilename =
        filename || (type === "idPhoto" ? "id_document" : "photo");
      if (req.query.download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        );
      } else {
        res.setHeader(
          "Content-Disposition",
          `inline; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        );
      }

      // Ensure buffer and send
      return res.send(
        Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData),
      );
    } catch (err) {
      console.error("Error in fetching attachment:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// API: Delete a booking (Admin only)
app.delete("/api/admin/bookings/:id", authorizeAdmin, async (req, res) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    if (useMockDb) {
      const initialLength = mockBookings.length;
      mockBookings = mockBookings.filter((b) => b.id !== bookingId);
      if (mockBookings.length === initialLength) {
        return res.status(404).json({ error: "Booking not found" });
      }
      console.log(`Mock DB deleted booking: ID ${bookingId}`);
      return res.json({ success: true });
    } else {
      const result = await pool.query(
        "DELETE FROM bookings WHERE id = $1 RETURNING id",
        [bookingId],
      );
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
  res.sendFile(path.join(__dirname, "../admin.html"));
});
app.get("/restaurant", (req, res) => {
  res.sendFile(path.join(__dirname, "../restaurant.html"));
});
app.get("/payment-status", (req, res) => {
  res.sendFile(path.join(__dirname, "../payment-status.html"));
});

// Global error handler (handles Multer file size limits)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds 5MB limit. Please upload a smaller file." });
    }
    return res.status(400).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

// Export app for serverless compatibility, run server locally if launched directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mermaid Resort server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
