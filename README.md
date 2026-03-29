<div align="center">

<br />

<img src="https://img.shields.io/badge/Built%20with-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Backend-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
<img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />

<br /><br />

<h1>🏢 Cumhuriyet Apartmanı</h1>
<h3>A minimalist, production-ready apartment management system<br/>built with React 18 · Express · SQLite · TypeScript</h3>

<br />

<a href="#-features"><strong>Features</strong></a> ·
<a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
<a href="#-project-structure"><strong>Structure</strong></a> ·
<a href="#-getting-started"><strong>Getting Started</strong></a> ·
<a href="#-api-reference"><strong>API</strong></a> ·
<a href="#-pages--screens"><strong>Pages</strong></a>

<br /><br />

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🌐 Public

- **Landing Page** — Hero section, building timeline, before/after renovation cards
- **Financial Transparency** — Paginated expense records visible to all residents
- **Meeting Notes** — Year-filtered meeting cards with decisions
- **Apple-style Login** — Clean minimal auth form

</td>
<td width="50%">

### 🔐 Manager Dashboard

- **Overview Panel** — Net balance, income/expense stats, quick navigation
- **Aidat Management** — 18-apartment payment status with dropdown controls
- **Income / Expense CRUD** — Full create/delete with invoice upload
- **Meeting Management** — Create meetings, record decisions
- **Apartment Registry** — Edit owner names, floors, notes

</td>
</tr>
</table>

<table>
<tr>
<td width="33%" align="center"><strong>📎 Invoice Upload</strong><br/>Drag & drop PDF/JPG/PNG with inline preview modal</td>
<td width="33%" align="center"><strong>🔔 Toast Notifications</strong><br/>Real-time feedback on every mutation</td>
<td width="33%" align="center"><strong>📱 Mobile-First</strong><br/>Responsive sidebar, hamburger menu, 500px tested</td>
</tr>
<tr>
<td width="33%" align="center"><strong>🌙 Dark Mode</strong><br/>System-aware with Tailwind dark: classes</td>
<td width="33%" align="center"><strong>🔑 JWT Auth</strong><br/>7-day tokens, auto-refresh, 401 redirect</td>
<td width="33%" align="center"><strong>🛡 Protected Routes</strong><br/>AuthGuard component wrapping all dashboard pages</td>
</tr>
</table>

---

## 🛠 Tech Stack

<table>
<thead>
<tr>
<th>Layer</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Frontend</strong></td>
<td>React 18 + TypeScript + Vite 8</td>
<td>SPA with fast HMR development</td>
</tr>
<tr>
<td><strong>Styling</strong></td>
<td>Tailwind CSS v3 (CDN)</td>
<td>Stitch design token-matched utility classes</td>
</tr>
<tr>
<td><strong>Routing</strong></td>
<td>React Router v6</td>
<td>File-based page navigation + protected routes</td>
</tr>
<tr>
<td><strong>HTTP Client</strong></td>
<td>Axios</td>
<td>Centralized API layer with JWT interceptor</td>
</tr>
<tr>
<td><strong>Notifications</strong></td>
<td>react-hot-toast</td>
<td>Success / error toast system</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Node.js 24 + Express 4</td>
<td>REST API server</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>SQLite via node-sqlite3-wasm</td>
<td>Zero-config embedded DB (no native compilation needed)</td>
</tr>
<tr>
<td><strong>Authentication</strong></td>
<td>bcryptjs + jsonwebtoken</td>
<td>Hashed passwords, 7-day JWT sessions</td>
</tr>
<tr>
<td><strong>File Uploads</strong></td>
<td>Multer</td>
<td>Invoice PDF/JPG/PNG storage (max 10MB)</td>
</tr>
</tbody>
</table>

---

## 📁 Project Structure

```
Apartment-Management-System/
│
├── 📂 backend/
│   ├── src/
│   │   ├── server.js                   # Express app entry point
│   │   ├── db/
│   │   │   ├── schema.sql              # 7 tables: users, apartments, aidats...
│   │   │   ├── database.js             # SQLite connection (WASM)
│   │   │   └── seed.js                 # Initial data: 18 apartments, meetings, expenses
│   │   ├── middleware/
│   │   │   └── auth.js                 # JWT verification middleware
│   │   └── routes/
│   │       ├── auth.js                 # POST /api/auth/login
│   │       ├── apartments.js           # GET, PUT /api/apartments
│   │       ├── aidats.js               # GET, POST /api/aidats + payments
│   │       ├── expenses.js             # GET, POST, DELETE /api/expenses
│   │       ├── meetings.js             # GET, POST, PUT, DELETE /api/meetings
│   │       └── timeline.js             # GET, POST /api/timeline
│   ├── uploads/                        # Uploaded invoice files
│   ├── data/apartment.db               # SQLite database file
│   └── package.json
│
└── 📂 frontend/
    ├── index.html                      # Tailwind CDN + Material Symbols + Inter font
    ├── vite.config.ts                  # Proxy /api → :3001
    └── src/
        ├── main.tsx                    # App entry + React Router routes
        ├── index.css                   # Minimal global reset
        ├── api/
        │   └── index.ts               # Axios + JWT interceptor + typed API methods
        ├── contexts/
        │   └── AuthContext.tsx        # Global auth state (localStorage persistence)
        ├── components/
        │   ├── public/Navbar.tsx      # Sticky responsive navbar + mobile menu
        │   └── ui/AuthGuard.tsx       # Protected route wrapper
        └── pages/
            ├── LandingPage.tsx        # Hero · Timeline · Before/After · CTA
            ├── FinancePage.tsx        # Public expenses + invoice preview modal
            ├── MeetingNotesPage.tsx   # Year-filtered meeting cards
            ├── LoginPage.tsx          # JWT login form
            └── dashboard/
                ├── DashboardLayout.tsx    # Sidebar + header shell
                ├── DashboardOverview.tsx  # Stats + quick links + apartment list
                ├── AidatPage.tsx          # 18-apt table + expense form + file drop
                ├── ExpensePage.tsx        # Income/expense CRUD + filter
                ├── MeetingManagePage.tsx  # Create meetings + decisions + history
                └── ApartmentsPage.tsx     # Search grid + edit modal
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v18+** (tested on v24.12.0)
- **npm v9+**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Apartment-Management-System.git
cd Apartment-Management-System
```

### 2. Set up the Backend

```bash
cd backend
npm install
npm run seed       # Creates DB + seeds 18 apartments, sample data
npm start          # Starts API at http://localhost:3001
```

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev        # Starts dev server at http://localhost:5173
```

### 4. Open in browser

```
http://localhost:5173
```

---


## 📡 API Reference

<details>
<summary><strong>🔐 Auth</strong></summary>

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| `POST` | `/api/auth/login` | ❌ | `{ email, password }` |

</details>

<details>
<summary><strong>🏘 Apartments</strong></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/apartments` | ❌ | List all 18 apartments |
| `GET` | `/api/apartments/:id` | ❌ | Single apartment |
| `PUT` | `/api/apartments/:id` | ✅ | Update owner / floor / notes |

</details>

<details>
<summary><strong>💳 Aidats (Monthly Dues)</strong></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/aidats` | ✅ | List all periods |
| `POST` | `/api/aidats` | ✅ | Create period (auto-creates 18 payment records) |
| `GET` | `/api/aidats/:id/payments` | ✅ | Per-apartment payment status |
| `GET` | `/api/aidats/:id/stats` | ✅ | Paid / pending / unpaid counts |
| `PUT` | `/api/aidats/payments/:id` | ✅ | Update payment status |

</details>

<details>
<summary><strong>💰 Expenses</strong></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/expenses` | ❌ | Paginated list (type, page, limit) |
| `GET` | `/api/expenses/summary` | ❌ | Total income / expense / balance |
| `POST` | `/api/expenses` | ✅ | Create with optional invoice (multipart) |
| `DELETE` | `/api/expenses/:id` | ✅ | Delete + remove uploaded file |

</details>

<details>
<summary><strong>📅 Meetings</strong></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/meetings` | ❌ | List (year, page filters) |
| `POST` | `/api/meetings` | ✅ | Create with decisions array |
| `PUT` | `/api/meetings/:id` | ✅ | Update |
| `DELETE` | `/api/meetings/:id` | ✅ | Delete |

</details>

<details>
<summary><strong>📜 Timeline</strong></summary>

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/timeline` | ❌ | Building history by year |
| `POST` | `/api/timeline` | ✅ | Upsert year entry |

</details>

---

## 🖥 Pages & Screens

| Page | Route | Access | Description |
|------|--------|--------|-------------|
| Landing | `/` | Public | Hero, building timeline, before/after, meeting CTA |
| Financial | `/finansal` | Public | Expense table with invoice preview |
| Meetings | `/toplanti-notlari` | Public | Year-filtered cards with decisions |
| Login | `/giris` | Public | JWT auth form |
| Dashboard | `/dashboard` | 🔒 Manager | Stats, quick links, apartment list |
| Aidat | `/dashboard/aidat` | 🔒 Manager | Payment table + expense recorder |
| Expenses | `/dashboard/gelir-gider` | 🔒 Manager | Full CRUD income/expense |
| Meetings Mgmt | `/dashboard/toplanti` | 🔒 Manager | Create / view / delete meetings |
| Apartments | `/dashboard/daireler` | 🔒 Manager | Search and edit apartment info |

---

## 🗄 Database Schema

```sql
users          — id, email, password_hash, name, role
apartments     — id, number (1–18), owner_name, floor, notes
aidats         — id, month, year, amount, UNIQUE(month, year)
aidat_payments — id, aidat_id, apartment_id, status, paid_at, note
expenses       — id, title, description, amount, type, date, invoice_path
meetings       — id, title, meeting_type, date, time, notes, decisions (JSON), status
timeline       — id, year, title, income, total_expense, maintenance_note, icon
```

---

## 🌐 Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=3001
JWT_SECRET=your-super-secret-key-here
```

---

## 🗺 Roadmap

- [ ] Email notifications for unpaid aidats
- [ ] PDF export for monthly reports
- [ ] Resident portal (read-only view with login)
- [ ] Multi-building support
- [ ] Push notifications (PWA)

---

<div align="center">

<br />

Made with ❤️ by **Kutluhan Gül**

<br />

<img src="https://img.shields.io/badge/UI-Turkish-red?style=flat-square" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
<img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square" />

</div>
