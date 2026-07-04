# Mermaid Resort

**Live:** [Mermaid Resort](https://mermaid.trionine.xyz)

This project has been upgraded to a Node.js/Express application with a Neon PostgreSQL database integration to store reservation details and manage bookings through a secure, beautiful Admin Portal.

---

## 📁 Project Structure

```
mermaid-resort/
├── assets/                 # Shared brand, favicon, and image assets
├── css/                    # Modular CSS styles
│   ├── admin.css           # Admin dashboard layout and design
│   ├── flatpickr-dark.css  # Custom Flatpickr calendar theme
│   ├── main.css            # Resets, design system tokens, global components
│   ├── resort.css          # Room card, gallery, contact & booking modal styles
│   └── restaurant.css      # Restaurant menu specific styles
├── js/                     # Modular JavaScript files
│   ├── admin.js            # Admin authentication & dashboard logic
│   ├── restaurant.js       # Restaurant preloader & animations logic
│   ├── rooms.js            # Resort room data specs list
│   └── script.js           # Booking calculator, calendar disable dates, form validation
├── admin.html              # Admin Portal dashboard UI
├── index.html              # Main Resort landing page
├── restaurant.html         # Restaurant menu page
├── server.js               # Node.js/Express server and database middleware
├── package.json            # Project dependencies & npm run scripts
├── .env.example            # Environment variables configuration template
└── README.md               # Project documentation
```

---

## 🚀 Setup & Installation

Follow these steps to run the application locally with a Neon database connection.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16+) installed.

### 2. Install Dependencies
Run the following command to download the packages:
```bash
npm install
```

### 3. Database Configuration
1. Sign up on [Neon Console](https://neon.tech/) and create a serverless PostgreSQL database.
2. Retrieve your **PostgreSQL Connection String** from the Neon dashboard.
3. Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` variables with your credentials:
   - `DATABASE_URL`: Set to your Neon database connection string (ensure it includes `?sslmode=require`).
   - `ADMIN_PASSWORD`: Configure the password you wish to use to log into the Admin Dashboard.
   - `PORT`: Server port (default is `3000`).

### 4. Run the Application
Start the server in development mode:
```bash
npm run dev
```

Open `http://localhost:3000` in your web browser. The server automatically:
- Serves the frontend landing pages.
- Establishes a secure connection to your Neon database.
- Checks and auto-creates the `bookings` table schema if it does not already exist.

---

## 🛡️ Admin Portal Access
To manage the bookings, go to:
`http://localhost:3000/admin.html` (or `http://localhost:3000/admin`)

Log in using the `ADMIN_PASSWORD` defined inside your `.env` file. The panel allows you to:
- Review total reservations, estimated revenue, and expected advances.
- Search and filter guests by name, phone, email, and room category.
- View details including full resolution uploads of customer selfies and NID/passport scans.
- Download NID/Passport files and selfie attachments directly.
- Cancel or delete bookings.

---

## 📊 Database Table Schema
The Postgres table is initialized automatically with the following structure:
```sql
CREATE TABLE bookings (
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
```
