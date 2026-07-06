# 🌊 Mermaid Resort

Live site: [Mermaid Resort](https://mermaid.trionine.xyz)

Mermaid Resort is a premium resort booking and island restaurant portal with an Express/Node.js backend, integrated PostgreSQL (Neon DB) storage, and bKash Tokenized Checkout (Sandbox) automated payment verification.

---

## 📂 Project Structure

```text
mermaid-resort/
├── index.html              # Main resort landing and booking page
├── restaurant.html         # Resort restaurant menu page
├── payment-status.html     # Dedicated payment success/failure receipt page
├── admin.html              # Secure admin portal dashboard
├── css/
│   ├── main.css            # Global design tokens, layout & typography
│   └── pages/
│       ├── resort.css      # Styles for resort-specific elements
│       ├── restaurant.css  # Styles for restaurant and starters cards
│       ├── admin.css       # Dashboard layout and drawer panels
│       ├── flatpickr-dark.css # Dark flatpickr datepicker theme
│       └── payment-status.css # Styles for payment status receipt card
├── js/
│   ├── script.js           # Client booking logic & NID validation
│   ├── data/
│   │   └── rooms.js        # Room data models
│   └── pages/
│       ├── restaurant.js   # Restaurant interactions
│       ├── admin.js        # Admin dashboard logic & API requests
│       └── payment-status.js # Client payment status verification page logic
├── assets/                 # Brand logos, favicons, and room graphics
├── backend/
│   ├── server.js           # Express.js app (endpoints, schemas & rate limiting)
│   ├── package.json        # Backend NPM packages (Express, Multer, PG)
│   ├── package-lock.json   # Locked dependency tree
│   └── netlify/
│       └── functions/
│           └── api.js      # Serverless entrypoint for Netlify deployment
├── netlify.toml            # Netlify build configurations and clean URL routing
├── _redirects              # Static domain canonical redirection rules
├── sitemap.xml             # Sitemap with clean paths
└── robots.txt              # Search engine crawler instructions
```

---

## 🛠 Features

* **Room Reservation**: Dynamic room grid showing details, gallery slideshows, and instant checkout.
* **bKash Tokenized Payment**: Integrated bKash Sandbox for payment checkout with automatic 30% advance amount verification.
* **Brute-Force Lockout**: Security middleware that locks IP addresses out for 15 minutes after 5 consecutive failed admin logins.
* **Document Upload**: Raw binary NID and selfie uploading (limited to 5MB) stored directly inside Neon PostgreSQL `BYTEA` column structures.
* **Clean URLs**: Serverless rewrites mapping `/admin`, `/restaurant`, and `/payment-status` cleanly.

---

## ⚙️ Local Development Setup

### 1. Setup Environment Variables
Create a `.env` file inside the root directory:
```env
# Neon Database Connection String
DATABASE_URL=your-neon-postgres-connection-string

# Admin Access Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# bKash API Credentials (Sandbox)
BKASH_USER_NAME=sandboxTokenizedUser02
BKASH_PASSWORD=sandboxTokenizedUser02@12345
BKASH_APP_KEY=4f6o0cjiki2rfm34kfdadl1eqq
BKASH_APP_SECRET=2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_CALLBACK_URL=http://localhost:3000/api/bkash/callback

# Server Port
PORT=3000
```

### 2. Install & Start Server
```bash
cd backend
npm install
npm run dev
```
The server will initialize your database tables automatically and run at `http://localhost:3000`.

---

## 🧪 Testing bKash Payments
When prompted on the bKash Sandbox payment portal:
* **Wallet Number**: `01770618575` (or `01929918378`)
* **Test PIN**: `12121`
* **Test OTP**: `123456`
