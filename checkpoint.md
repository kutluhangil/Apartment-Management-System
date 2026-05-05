# Checkpoint — Cumhuriyet Apartmanı Yönetim Sistemi

> Bu dosya benim için yazılmıştır. İleride konuşma başladığında projeyi hızla hatırlamak için kullanılır.
> Son güncelleme: 2026-05-05

---

## 1. Proje Kimliği

| Alan | Detay |
|------|-------|
| **Site** | cumhuriyetapartmani.com |
| **Amaç** | 18 daireli apartmanın dijital yönetimi (aidat, gider, toplantı, belgeler) |
| **Kullanıcı Sayısı** | 18 daire, birden fazla rol |
| **Geliştirici** | Kutluhan Gül (Daire 8, Software Developer) |
| **Durum** | Canlıda — Ankara |

---

## 2. Teknik Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 8
- **Yönlendirme:** React Router DOM v7
- **HTTP:** Axios (merkezi `api/index.ts`)
- **Bildirimler:** react-hot-toast
- **Grafikler:** Recharts (bar + pie chart)
- **PDF:** jsPDF + jsPDF-autotable
- **Excel:** xlsx (SheetJS)
- **Stil:** Tailwind CSS (CDN), Google Material Symbols ikonları

### Backend
- **Runtime:** Node.js (Dockerfile'da 18-alpine; güncellenebilir)
- **Framework:** Express.js 4
- **Veritabanı:** `@libsql/client` — yerel SQLite (`data/apartment.db`) veya Turso (bulut)
- **Auth:** bcryptjs + jsonwebtoken (7 günlük JWT, httpOnly cookie)
- **Güvenlik:** helmet (CSP), CORS, CSRF header check, express-rate-limit
- **Dosya Upload:** Multer → `/uploads/` dizini (Docker volume) veya Vercel Blob

### Altyapı
- **Sunucu:** Apple Mac Mini, Ubuntu Server 24.04, yerel IP: `192.168.1.174`
- **Dış Erişim:** Cloudflare Tunnel (port açmadan, HTTPS)
- **Domain:** cumhuriyetapartmani.com (Cloudflare üzerinde)
- **Konteyner:** Docker Compose → yalnızca `backend` servisi
- **Frontend Konteyner:** `cumhuriyet-frontend-internal` (nginx, ayrıca yönetilir, compose dışı)
- **CI/CD:** GitHub Actions, self-hosted runner, `main` branch push tetikler
- **Runner Dizini:** `~/actions-runner/`

---

## 3. Proje Dizin Yapısı

```
cumhuriyetapartmani.com/
├── api/
│   └── index.js                  ← Vercel serverless wrapper (Express app'i export eder)
├── backend/
│   ├── src/
│   │   ├── server.js             ← Express app, tüm middleware ve route kaydı
│   │   ├── db/
│   │   │   ├── schema.sql        ← Tüm tablo CREATE IF NOT EXISTS komutları
│   │   │   ├── database.js       ← libsql client, getOne/getAll/run yardımcıları
│   │   │   ├── seed.js           ← 18 daire, 2 kullanıcı, örnek veri
│   │   │   ├── migrate_room_type.js  ← room_type sütun ekleme migrasyonu
│   │   │   ├── migrate_apartments.js
│   │   │   ├── migrate_photo.js
│   │   │   ├── migrate_add_amount_to_payments.js
│   │   │   ├── migrate_upgrades.js
│   │   │   ├── clear_data.js
│   │   │   └── reset_passwords.js
│   │   ├── middleware/
│   │   │   └── auth.js           ← authenticateToken, authorizeRole, JWT_SECRET
│   │   └── routes/
│   │       ├── auth.js           ← login / logout / me
│   │       ├── apartments.js     ← daire CRUD + fotoğraf upload
│   │       ├── aidats.js         ← aidat dönemleri + ödeme durumları
│   │       ├── expenses.js       ← gelir/gider CRUD + fatura upload
│   │       ├── meetings.js       ← toplantı CRUD (kararlar JSON)
│   │       ├── timeline.js       ← apartman tarihçesi (herkese açık)
│   │       ├── announcements.js  ← duyurular
│   │       ├── documents.js      ← belge arşivi (Blob veya local)
│   │       ├── maintenance.js    ← bakım takibi
│   │       └── analytics.js      ← dashboard istatistikleri
│   ├── data/apartment.db         ← Yerel SQLite (development)
│   ├── .env                      ← GIT'E GİRMEZ — sunucuda manual tutulur
│   ├── .env.example
│   ├── Dockerfile                ← node:18-alpine (güncellenebilir)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx              ← Tüm route tanımları burada (App.tsx boş)
│   │   ├── api/index.ts          ← Axios instance + tüm API metodları
│   │   ├── contexts/AuthContext.tsx ← User state, login/logout, isLoading
│   │   ├── components/
│   │   │   ├── public/Navbar.tsx
│   │   │   └── ui/
│   │   │       ├── AuthGuard.tsx        ← Route koruması
│   │   │       └── InvoicePreviewModal.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx          ← / (herkese açık)
│   │   │   ├── FinancePage.tsx          ← /finansal (herkese açık)
│   │   │   ├── MeetingNotesPage.tsx     ← /toplanti-notlari (herkese açık)
│   │   │   ├── LoginPage.tsx            ← /giris
│   │   │   └── dashboard/
│   │   │       ├── DashboardLayout.tsx  ← Sidebar + header wrapper
│   │   │       ├── DashboardOverview.tsx ← /dashboard (bar chart, pie chart, kartlar)
│   │   │       ├── AidatPage.tsx        ← /dashboard/aidat
│   │   │       ├── ExpensePage.tsx      ← /dashboard/gelir-gider
│   │   │       ├── MeetingManagePage.tsx ← /dashboard/toplanti
│   │   │       ├── ApartmentsPage.tsx   ← /dashboard/daireler
│   │   │       ├── AnnouncementsPage.tsx ← /dashboard/duyurular
│   │   │       ├── DocumentsPage.tsx    ← /dashboard/belgeler
│   │   │       └── MaintenancePage.tsx  ← /dashboard/bakim
│   │   └── utils/
│   │       ├── format.ts          ← formatCurrency, MONTHS dizisi
│   │       └── meetings.ts
│   ├── nginx.conf                 ← Production nginx config (API + uploads proxy)
│   ├── Dockerfile                 ← Frontend container (nginx)
│   └── vite.config.ts             ← Dev proxy: /api → :3001, /uploads → :3001
├── docker-compose.yml             ← Sadece backend servisi
├── vercel.json                    ← Alternatif Vercel deployment config
├── api/index.js                   ← Vercel serverless entry point
├── SERVER_SETUP.md                ← Sunucu kurulum ve sorun giderme notları
└── checkpoint.md                  ← Bu dosya
```

---

## 4. Veritabanı Şeması

### `users`
```sql
id, email (UNIQUE), password_hash, name, role ('manager'|'admin'), created_at
```

### `apartments`
```sql
id, number (1-18, UNIQUE), owner_name, floor, profession, owner_photo, notes, room_type ('2+1'|'3+1')
```
> **Dikkat:** `room_type` sütunu `schema.sql`'de YOKTU — `migrate_room_type.js` ile eklendi.
> Taze kurulumda bu migration çalıştırılmalı veya `schema.sql` güncellenmeli.

### `aidats`
```sql
id, month (1-12), year, amount (varsayılan 1000), created_at, UNIQUE(month, year)
```

### `aidat_payments`
```sql
id, aidat_id (FK→aidats CASCADE), apartment_id (FK→apartments), 
status ('paid'|'pending'|'unpaid'), amount, paid_at, note, UNIQUE(aidat_id, apartment_id)
```
> `amount` daire tipine göre farklıdır: 2+1 → `amount_2plus1`, 3+1 → `amount_3plus1`

### `expenses`
```sql
id, title, description, amount, type ('income'|'expense'), date, 
invoice_path (sadece dosya adı), invoice_original_name, created_by, created_at
```

### `meetings`
```sql
id, title, meeting_type, date, time, notes, decisions (JSON array string), 
attendee_count, status ('completed'|'info'|'important'|'archived'|'planned'), created_by, created_at
```

### `timeline`
```sql
id, year (UNIQUE), title, description, income, total_expense, maintenance_note, icon, image_path
```

### `announcements`
```sql
id, title, message, date, created_by, created_at
```

### `documents`
```sql
id, title, description, file_url, upload_date, uploaded_by, created_at
```

### `maintenance`
```sql
id, maintenance_type, description, last_maintenance_date, next_maintenance_date, created_by, created_at
```

### `audit_logs`
```sql
id, user_id, action_type, target_entity, details, timestamp
```

---

## 5. Kullanıcı Rolleri ve Yetkileri

| Sayfa/Özellik | admin | manager | sakin |
|---------------|-------|---------|-------|
| Dashboard özeti | ✅ | ✅ | ✅ |
| Aidat yönetimi | ✅ | ✅ | ❌ |
| Gelir/Gider | ✅ | ✅ | ❌ |
| Toplantı yönetimi | ✅ | ✅ | ❌ |
| Bakım takibi | ✅ | ✅ | ❌ |
| Daire listesi | ✅ | ✅ | ✅ |
| Duyurular | ✅ | ✅ | ✅ |
| Belgeler | ✅ | ✅ | ✅ |
| Duyuru/Belge ekleme | ✅ | ✅ | ❌ |

---

## 6. API Endpoint'leri

| Method | Endpoint | Auth | Açık mı? |
|--------|----------|------|----------|
| POST | `/api/auth/login` | ❌ | ✅ herkese |
| POST | `/api/auth/logout` | ❌ | ✅ herkese |
| GET | `/api/auth/me` | Cookie | ✅ herkese |
| GET | `/api/apartments` | ✅ | ❌ login gerek |
| PUT | `/api/apartments/:id` | admin/manager | ❌ |
| POST | `/api/apartments/:id/photo` | admin/manager | ❌ |
| GET | `/api/apartments/:id/aidats` | ✅ | ❌ |
| GET | `/api/aidats` | ✅ | ❌ |
| POST | `/api/aidats` | admin/manager | ❌ |
| GET | `/api/aidats/:id/payments` | ✅ | ❌ |
| PUT | `/api/aidats/payments/:id` | admin/manager | ❌ |
| DELETE | `/api/aidats/:id` | admin/manager | ❌ |
| GET | `/api/aidats/:id/stats` | ✅ | ❌ |
| GET | `/api/expenses` | ❌ | ✅ herkese (finansal şeffaflık) |
| GET | `/api/expenses/summary` | ❌ | ✅ herkese |
| POST | `/api/expenses` | admin/manager | ❌ |
| DELETE | `/api/expenses/:id` | admin/manager | ❌ |
| GET | `/api/meetings` | ❌ | ✅ herkese |
| POST | `/api/meetings` | admin/manager | ❌ |
| PUT | `/api/meetings/:id` | admin/manager | ❌ |
| DELETE | `/api/meetings/:id` | admin/manager | ❌ |
| GET | `/api/timeline` | ❌ | ✅ herkese |
| POST | `/api/timeline` | admin/manager | ❌ |
| GET | `/api/announcements` | ✅ | ❌ |
| POST | `/api/announcements` | admin/manager | ❌ |
| DELETE | `/api/announcements/:id` | admin/manager | ❌ |
| GET | `/api/documents` | ✅ | ❌ |
| POST | `/api/documents` | admin/manager | ❌ |
| DELETE | `/api/documents/:id` | admin/manager | ❌ |
| GET | `/api/maintenance` | ✅ | ❌ |
| POST | `/api/maintenance` | admin/manager | ❌ |
| DELETE | `/api/maintenance/:id` | admin/manager | ❌ |
| GET | `/api/analytics` | ✅ | ❌ |
| GET | `/api/health` | ❌ | ✅ herkese |

---

## 7. Güvenlik Mimarisi

- **JWT:** httpOnly cookie, secure (prod), sameSite=strict, 7 gün
- **CSRF:** POST/PUT/DELETE/PATCH'te `X-Requested-With: XMLHttpRequest` zorunlu; yoksa 403
- **Rate Limiting:** `/api/auth/login` → 15 dakikada max 10 deneme; Cloudflare IP'si kullanılır
- **Helmet:** CSP, HSTS, clickjacking koruması
- **Trust Proxy:** `app.set('trust proxy', 1)` — Cloudflare Tunnel arkasında doğru IP için zorunlu
- **Error Sanitization:** Prod'da stack trace loglanmaz, JWT leak regex ile temizlenir

---

## 8. 18 Daire Listesi

| No | Sahip | Kat | Tip |
|----|-------|-----|-----|
| 1 | Turgut IRMAK | 1 | 2+1 |
| 2 | GÖZDE BARIK | 1 | 2+1 |
| 3 | Hakan ÇAKIR | 1 | 2+1 |
| 4 | İLYAS GÜLERYÜZ | 2 | 3+1 |
| 5 | A.Tahir ALTINSOY | 2 | 3+1 |
| 6 | R. Tolunay GENÇ | 2 | 2+1 |
| 7 | Hanife ŞEKER | 3 | 3+1 |
| 8 | Kutluhan GUL | 3 | 3+1 (geliştirici/sistem yöneticisi) |
| 9 | SEVGİ AKKURT | 3 | 2+1 |
| 10 | BORA DENİZ | 4 | 3+1 |
| 11 | Buğra ÇAKIR | 4 | 3+1 |
| 12 | KALI YAPI | 4 | 2+1 (şirket, sakin belirsiz) |
| 13 | Murat ATAÇ | 5 | 3+1 (apartman yöneticisi) |
| 14 | Basri GÜZER | 5 | 3+1 |
| 15 | Ebru KARDEŞ | 5 | 2+1 |
| 16 | KALI YAPI | 6 | 3+1 (şirket, sakin belirsiz) |
| 17 | KALİ YAPI | 6 | 3+1 (şirket, sakin belirsiz) |
| 18 | Bahtiyar TURAN | 6 | 2+1 |

---

## 9. Dosya Upload Mantığı

### Fatura (expenses)
- `invoice_path` sütununda sadece **dosya adı** saklanır (örn: `1735000000-abc.pdf`)
- Sunulan URL: `/uploads/dosya_adı` (backend static serving)
- Frontend preview: `setPreviewUrl('/uploads/' + exp.invoice_path)`

### Daire Fotoğrafı (apartments)
- `owner_photo` sütununda `/uploads/dosya_adı` saklanır
- Frontend: `<img src={'/api' + apt.owner_photo} />`

### Belgeler (documents)
- `BLOB_READ_WRITE_TOKEN` varsa → Vercel Blob (tam URL saklanır)
- Yoksa → `/uploads/dosya_adı` (local)

---

## 10. Deployment Akışı

```
Kod değişikliği → git push origin main
        ↓
GitHub Actions (self-hosted runner, ~/actions-runner)
        ↓
ssh → git pull → docker compose up -d --build backend
        ↓
cumhuriyet-backend container yeniden başlar
        ↓
Cloudflare Tunnel → nginx → backend:3001
```

### Ortam Değişkenleri (backend/.env — sunucuda, git'te yok)
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://cumhuriyetapartmani.com
JWT_SECRET=<güçlü değer>
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
MANAGER_EMAIL=murat@cumhuriyet.com
MANAGER_PASSWORD=<şifre>
ADMIN_EMAIL=kutluhan@cumhuriyet.com
ADMIN_PASSWORD=<şifre>
```

---

## 11. Bilinen Eksikler ve Çözümleri

### ✅ Düzeltildi — schema.sql'de room_type eksikti
`schema.sql`'deki `apartments` tablosuna `room_type TEXT DEFAULT '3+1'` sütunu eklendi.
Taze kurulumda artık migration çalıştırmaya gerek yok.

### ✅ Düzeltildi — seed.js room_type eklemiyordu
Seed verisi artık her dairenin doğru `room_type`'ını (2+1 / 3+1) kullanarak ekliyor.

### ✅ Düzeltildi — Dockerfile node:18 (deprecated)
Dockerfile `node:20-alpine` olarak güncellendi.

### Eksik — maintenance UPDATE endpoint'i yok
`PUT /api/maintenance/:id` endpoint'i yok. Bakım kaydı eklendikten sonra yalnızca silinebilir, düzenlenemez. Frontend'de de düzenleme arayüzü bulunmuyor.

### Eksik — ApartmentsPage'de "Notes" alanı yok
Daire düzenleme modalında `notes` alanı gösterilmiyor. Backend bunu kabul ediyor ama UI'da input yok.

### Bilgi — docker-compose'da frontend servisi yok
Kasıtlı: frontend container (`cumhuriyet-frontend-internal`, nginx) Docker Compose dışında ayrıca yönetilir. SERVER_SETUP.md'de detaylar var.

### Bilgi — vercel.json kök dizinde
Hem kendi sunucusu hem de potansiyel Vercel deployment için yapılandırma. Kendi sunucusunda kullanılmıyor.

---

## 12. Sık Kullanılan Komutlar

```bash
# Backend yeniden başlat
docker compose up -d --build backend

# Logları izle
docker logs cumhuriyet-backend -f

# Health kontrol
docker inspect cumhuriyet-backend --format='{{json .State.Health}}'

# Yerel geliştirme — backend
cd backend && npm run dev

# Yerel geliştirme — frontend
cd frontend && npm run dev

# Veritabanı seed (ilk kurulum)
cd backend && npm run seed
node src/db/migrate_room_type.js   # room_type kolonunu doldurur (schema.sql'de artık var)

# Şifre sıfırla
node src/db/reset_passwords.js
```

---

## 13. Önemli Kod Noktaları

- **`api/index.js`:** Vercel serverless wrapper. `initDb()` + Express app'i export eder.
- **`server.js:13`:** `app.set('trust proxy', 1)` — Cloudflare arkasında rate limiting için şart.
- **`auth.js middleware`:** CSRF check → JWT cookie → Bearer fallback.
- **`aidats.js POST`:** `apt.room_type === '2+1' ? val2plus1 : val3plus1` — daire tipine göre aidat tutarı.
- **`database.js`:** `TURSO_DATABASE_URL` tanımlıysa Turso, değilse yerel SQLite.
- **`documents.js`:** `BLOB_READ_WRITE_TOKEN` tanımlıysa Vercel Blob, değilse local uploads.
- **`main.tsx`:** Tüm route'lar burada — `App.tsx` boş.
- **`AuthContext`:** `/auth/me` ile sayfa yenilemede oturum kontrol edilir, localStorage kullanılmaz.
