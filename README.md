# Mermaid Resort

Live site: [Mermaid Resort](https://mermaid.trionine.xyz)

## Overview

Mermaid Resort is a static resort and restaurant website with a separate admin UI and a Node.js backend under `backend/` for API and Netlify function support.

## Project Structure

```text
mermaid-resort/
├── admin.html              # Admin dashboard page
├── index.html              # Main resort landing page
├── restaurant.html         # Restaurant menu page
├── css/
│   ├── admin.css           # Admin dashboard styles
│   ├── flatpickr-dark.css  # Flatpickr theme
│   ├── main.css            # Global design system and shared components
│   ├── resort.css          # Resort page styles
│   ├── restaurant.css      # Restaurant page styles
│   └── styles.css          # Legacy/shared stylesheet
├── js/
│   ├── admin.js            # Admin dashboard logic
│   ├── restaurant.js       # Restaurant page interactions
│   ├── rooms.js            # Room data definitions
│   └── script.js           # Main resort page logic
├── assets/                 # Brand, favicon, gallery, and room images
├── backend/
│   ├── package.json        # Backend dependencies and scripts
│   ├── server.js           # Express server
│   └── netlify/functions/  # Netlify serverless functions
├── netlify.toml            # Netlify build and redirects config
├── _redirects              # Static host redirects
├── robots.txt              # Robots instructions
├── sitemap.xml             # Sitemap
└── README.md               # Project documentation
```

## Run Locally

### Frontend

Open the static pages directly in a browser or serve the project root with your preferred static server.

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend starts from `backend/server.js`.

## Deployment

The project is configured for Netlify with redirects in `netlify.toml` and serverless API support under `backend/netlify/functions/`.
