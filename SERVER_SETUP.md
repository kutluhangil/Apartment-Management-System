# Sunucu ve Backend Kurulum Notları

Bu dosya, gelecekte sorun giderme veya yeni değişiklik yaparken referans olarak kullanılmak üzere yazılmıştır.

---

## Fiziksel Altyapı

| Bileşen | Detay |
|---------|-------|
| Sunucu | Apple Mac Mini (Ubuntu Server 24.04 kurulu) |
| IP (yerel ağ) | `192.168.1.174` |
| Kullanıcı | `kutluhan` |
| Proje dizini | `/home/kutluhan/Apartment-Management-System` |
| Dış erişim | Cloudflare Tunnel (port açmaya gerek yok) |
| Domain | `cumhuriyetapartmani.com` |

---

## Docker Kurulumu

### Çalışan Container'lar

```
cumhuriyet-backend          → Express/Node API, port 3001 (sadece iç ağda)
cumhuriyet-frontend-internal → Nginx reverse proxy, port 80 (dış ağa açık)
```

**Önemli:** `frontend` servisi `docker-compose.yml`'de **yoktur**. Nginx (`cumhuriyet-frontend-internal`) ayrı bir container olarak sunucuda yönetilmekte olup bu projenin compose dosyasının dışındadır.

### docker-compose.yml Yapısı

Yalnızca `backend` servisi tanımlıdır:

```yaml
services:
  backend:
    container_name: cumhuriyet-backend
    env_file: ./backend/.env
    expose: ["3001"]        # Dışarıya açılmaz — nginx üzerinden erişilir
    networks: [app-network]
    healthcheck:
      # curl alpine image'da yok, node ile yapılır
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', ...)"]
```

**Neden curl değil node?** `node:18-alpine` imajında `curl` bulunmaz. Healthcheck her zaman `node` ile yapılmalıdır.

### Komutlar

```bash
# Backend yeniden build et ve başlat
docker compose up -d --build backend

# Log izle
docker logs cumhuriyet-backend -f

# Health durumu kontrol
docker inspect cumhuriyet-backend --format='{{json .State.Health}}'

# Container'ları listele
docker ps --filter "name=cumhuriyet"
```

---

## Backend Mimarisi

### Teknoloji

- **Runtime:** Node.js 18 (Alpine Docker imajı)
- **Framework:** Express.js
- **Veritabanı:** `@libsql/client` — geliştirmede yerel SQLite, üretimde Turso (bulut SQLite)
- **Auth:** JWT — httpOnly cookie ile taşınır, JavaScript'ten erişilemez
- **Güvenlik:** Helmet (CSP, HSTS), CORS, CSRF koruması, rate limiting (express-rate-limit)

### Veritabanı Mantığı

```
TURSO_DATABASE_URL tanımlı değilse → ./data/apartment.db (yerel SQLite dosyası)
TURSO_DATABASE_URL tanımlıysa       → Turso bulut veritabanı
```

Sunucudaki `.env` dosyasında `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` tanımlıdır, dolayısıyla **üretim ortamı Turso kullanır**. Yerel geliştirme ise `backend/data/apartment.db` dosyasını kullanır — bunlar **iki ayrı veritabanıdır**.

### API Endpoint'leri

| Prefix | Dosya | Açıklama |
|--------|-------|----------|
| `/api/auth` | `routes/auth.js` | Giriş, çıkış, oturum kontrolü |
| `/api/apartments` | `routes/apartments.js` | Daire yönetimi |
| `/api/aidats` | `routes/aidats.js` | Aidat dönemleri ve ödemeler |
| `/api/expenses` | `routes/expenses.js` | Gelir/gider kayıtları |
| `/api/meetings` | `routes/meetings.js` | Toplantı notları |
| `/api/timeline` | `routes/timeline.js` | Apartman tarihçesi (herkese açık) |
| `/api/announcements` | `routes/announcements.js` | Duyurular |
| `/api/documents` | `routes/documents.js` | Belge arşivi ve dosya yükleme |
| `/api/maintenance` | `routes/maintenance.js` | Bakım takibi |
| `/api/analytics` | `routes/analytics.js` | Dashboard istatistikleri |
| `/api/health` | `server.js` | Container sağlık kontrolü |

### Güvenlik Katmanları

**CSRF Koruması:** Tüm `POST/PUT/DELETE/PATCH` isteklerinde `X-Requested-With: XMLHttpRequest` header'ı zorunludur. Olmadan `403` döner.

**JWT:** `httpOnly` cookie içinde saklanır. Cookie seçenekleri:
- `httpOnly: true` — XSS ile token çalınamaz
- `secure: true` (üretimde) — HTTPS zorunlu
- `sameSite: strict` — CSRF'e karşı ek koruma
- `maxAge: 7 gün`

**Rate Limiting:** `/api/auth/login` üzerinde 15 dakikada 10 deneme sınırı. Cloudflare gerçek IP'si (`cf-connecting-ip` header'ı) kullanılır.

**Trust Proxy:** `app.set('trust proxy', 1)` — Cloudflare Tunnel arkasında doğru IP alınması için zorunludur. Kaldırılırsa rate limiting bozulur.

**Roller:**
- `admin` — Tam yetki
- `manager` — Yönetici (veri girişi yapabilir)
- `sakin` — Salt okunur, sınırlı erişim

### Dosya Yükleme

```
BLOB_READ_WRITE_TOKEN tanımlıysa → Vercel Blob (bulut depolama)
Tanımlı değilse                  → /app/uploads/ (Docker named volume: uploads_data)
```

Üretimde `uploads_data` Docker volume'u `/var/lib/docker/volumes/uploads_data/_data` konumuna kalıcı olarak yazar. Container silinse bile dosyalar kaybolmaz.

---

## Ortam Değişkenleri (backend/.env)

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://cumhuriyetapartmani.com

JWT_SECRET=<güçlü rastgele değer>

TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...

MANAGER_EMAIL=murat@cumhuriyet.com
MANAGER_PASSWORD=<şifre>
ADMIN_EMAIL=kutluhan@cumhuriyet.com
ADMIN_PASSWORD=<şifre>
```

Bu dosya `.gitignore`'dadır, Git'e commit edilmez. Sunucuda manuel tutulur.

---

## Otomatik Deploy (GitHub Actions)

`.github/workflows/deploy.yml` dosyası `main` branch'e push geldiğinde çalışır:

1. `/home/kutluhan/Apartment-Management-System` dizinine `git pull`
2. `backend/` değiştiyse → `docker compose up -d --build backend`
3. `frontend/` değiştiyse → frontend container rebuild

**Önemli:** GitHub Actions self-hosted runner kurulumu `~/actions-runner/` dizinindedir. Runner'ın servis olarak çalışması için:

```bash
cd ~/actions-runner && sudo ./svc.sh start
sudo ./svc.sh status   # durumu kontrol et
```

Runner çalışmıyorsa otomatik deploy olmaz — değişiklikler sunucuya gitmez.

---

## Nginx Konfigürasyonu (Ayrı Yönetilen)

`cumhuriyet-frontend-internal` container'ı nginx'i çalıştırır. Nginx:
- Port 80'i dinler
- `/api/*` isteklerini `cumhuriyet-backend:3001`'e iletir
- Diğer tüm istekleri React SPA'ya yönlendirir (index.html)
- `/uploads/*` isteklerini de backend'e proxy'ler

---

## Sık Karşılaşılan Sorunlar

### Backend `unhealthy` durumda
**Sebep:** Healthcheck'te `curl` kullanılıyorsa — alpine imajında yok.  
**Çözüm:** `docker-compose.yml`'deki healthcheck `node` ile yapılmalı (mevcut hâli doğru).

### `git pull` çakışması (conflict)
**Sebep:** Sunucuda `docker-compose.yml` gibi dosyalar manuel düzenlenmiş.  
**Çözüm:**
```bash
git stash        # yerel değişiklikleri geçici sakla
git pull         # yeni kodu çek
git stash pop    # saklanmış değişiklikleri geri getir
```

### Giriş yapılamıyor
**Sebep:** Veritabanındaki şifre hash'i `.env`'deki şifreyle eşleşmiyor.  
**Çözüm:** Seed dosyasını yeniden çalıştır veya DB'yi manuel güncelle:
```bash
node -e "
const bcrypt = require('bcryptjs');
const { run } = require('./src/db/database');
bcrypt.hash('YENİ_ŞİFRE', 10).then(h => run('UPDATE users SET password_hash = ? WHERE email = ?', [h, 'email@cumhuriyet.com'])).then(() => process.exit(0));
"
```

### `dotenv injecting env (0)` mesajı
Bu bir hata değildir. Docker Compose `env_file` ile ortam değişkenlerini zaten yüklediğinden, uygulama içindeki dotenv ek değişken bulmaz. Normal davranış.

### TURSO bağlantı hatası
Turso auth token'ı süresi dolmuş olabilir. Turso dashboard'dan yeni token alınıp `.env` dosyasına yazılmalı ve backend restart edilmeli.
