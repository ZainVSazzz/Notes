# Notes Forum

Aplikasi full-stack untuk mencatat dan berbagi catatan/solusi internal. Mendukung catatan **public** (bisa dilihat semua user yang login) dan **private** (hanya pemilik), keranjang sampah (soft delete), upload gambar, serta login terproteksi captcha matematika.

```
notes/
├── notes-backend/    REST API  — Node.js (Express 5) + MySQL
└── notes-frontend/   SPA        — Vue 3 + Vite + PrimeVue
```

## Daftar Isi

- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Variabel Environment](#variabel-environment)
- [Format Response API](#format-response-api)
- [Autentikasi](#autentikasi)
- [Dokumentasi API](#dokumentasi-api)
  - [Health](#health)
  - [Auth](#auth)
  - [Catatan](#catatan)
  - [Upload](#upload)
  - [Cabang](#cabang)
- [Testing](#testing)
- [Deployment (PM2)](#deployment-pm2)
- [Struktur Proyek](#struktur-proyek)

---

## Teknologi

**Backend**
- Node.js (ESM), Express 5
- MySQL (`mysql2/promise`, connection pool)
- JWT (`jsonwebtoken`) via cookie `httpOnly`
- Helmet, CORS, cookie-parser
- Multer (upload gambar, in-memory)
- Winston + winston-daily-rotate-file (logging terstruktur)
- Vitest + Supertest (testing)

**Frontend**
- Vue 3 (Composition API), Vue Router
- PrimeVue 4 + PrimeIcons
- Axios
- Vite 6

---

## Prasyarat

- Node.js 18+ (disarankan 20+; backend memakai `--env-file`)
- MySQL 8+
- Database `notes_app` beserta tabel: `users`, `catatanapp`, `m_cabang`

---

## Instalasi & Menjalankan

### Backend

```bash
cd notes-backend
npm install
cp .env.example .env     # lalu sesuaikan nilainya
npm run dev              # mode development (nodemon)
# atau
npm start                # mode production
```

Backend berjalan di `http://localhost:5000`.

### Frontend

```bash
cd notes-frontend
npm install
cp .env.example .env     # opsional
npm run dev              # dev server Vite di :5173
# atau
npm run build            # build produksi ke dist/
```

Frontend berjalan di `http://localhost:5173`.

---

## Variabel Environment

### Backend (`notes-backend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `APP_PORT` | Port server | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_USER` | User MySQL | `root` |
| `DB_PASSWORD` | Password MySQL | `` |
| `DB_NAME` | Nama database | `notes_app` |
| `CLIENT_URL` | Origin frontend (untuk CORS & deteksi HTTPS cookie) | `http://localhost:5173` |
| `JWT_SECRET` | Secret penandatangan JWT auth | *(string acak panjang)* |
| `JWT_EXPIRES_IN` | Masa berlaku token auth | `10h` |
| `JWT_COOKIE_MAX_AGE` | Max-age cookie auth (ms) | `36000000` |
| `CAPTCHA_SECRET` | Secret penandatangan token captcha | *(string acak panjang)* |
| `CAPTCHA_EXPIRES_IN` | Masa berlaku token captcha | `15s` |
| `CAPTCHA_COOKIE_MAX_AGE` | Max-age cookie captcha (ms) | `180000` |
| `SERVICE_NAME` | Nama service untuk log | `notes-forum-api` |
| `LOG_DIR` | Direktori log | `logs` |
| `LOG_LEVEL` | Level log Winston | `info` |

### Frontend (`notes-frontend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL API | `http://localhost:5000/api` |
| `VITE_API_ORIGIN` | Origin API | `http://localhost:5000` |

> Catatan: HTTP client frontend saat ini menyusun base URL secara dinamis dari `window.location` (`<protocol>//<hostname>:5000/api`).

---

## Format Response API

Semua endpoint (kecuali `GET /api/cabang`) mengembalikan struktur konsisten:

**Sukses**
```json
{
  "status": true,
  "message": "Pesan sukses",
  "data": {
    "...": "payload",
    "requestId": "uuid-per-request"
  }
}
```

**Gagal**
```json
{
  "status": false,
  "message": "Pesan error",
  "data": {
    "requestId": "uuid-per-request"
  }
}
```

`requestId` disisipkan otomatis pada setiap response untuk korelasi log.

---

## Autentikasi

- Autentikasi berbasis **JWT** yang disimpan di cookie `httpOnly` bernama `auth_token`.
- Alur login: minta captcha → kirim `identifier` + `captchaOptionId` yang benar → server set cookie `auth_token`.
- **Auto-refresh**: jika sisa umur token < 25% dari total lifetime, server menerbitkan token baru otomatis pada request terproteksi.
- Endpoint terproteksi membutuhkan cookie `auth_token` yang valid (gunakan `credentials: 'include'` / `withCredentials: true`).

---

## Dokumentasi API

Base URL: `http://localhost:5000`

Ringkasan endpoint:

| Method | Endpoint | Auth | Deskripsi |
|---|---|:---:|---|
| GET | `/` | – | Health check |
| GET | `/api/auth/captcha` | – | Ambil captcha matematika |
| POST | `/api/auth/login` | – | Login dengan captcha |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Data user saat ini |
| GET | `/api/catatan/public` | – | Daftar catatan public |
| GET | `/api/catatan/public/:id` | – | Detail catatan public |
| GET | `/api/catatan/my` | ✅ | Daftar catatan milik user |
| GET | `/api/catatan/my/:id` | ✅ | Detail catatan milik user |
| GET | `/api/catatan/trash` | ✅ | Daftar catatan di keranjang sampah |
| POST | `/api/catatan` | ✅ | Buat catatan |
| PATCH | `/api/catatan/:id` | ✅ | Update catatan |
| PATCH | `/api/catatan/:id/status` | ✅ | Ubah status public/private |
| PATCH | `/api/catatan/:id/delete` | ✅ | Pindahkan ke keranjang sampah |
| PATCH | `/api/catatan/:id/restore` | ✅ | Pulihkan dari keranjang sampah |
| POST | `/api/catatan/:id/copy-isi` | ✅ | Copy isi (+ increment klik) |
| POST | `/api/catatan/:id/copy-solusi` | ✅ | Copy solusi |
| POST | `/api/uploads/image` | ✅ | Upload gambar |
| GET | `/api/uploads/test` | – | Cek route upload |
| GET | `/api/cabang` | – | Daftar cabang |

---

### Health

#### `GET /`
Cek API aktif.

**Response 200**
```json
{
  "status": true,
  "message": "Notes Forum API aktif",
  "data": { "requestId": "..." }
}
```

---

### Auth

#### `GET /api/auth/captcha`
Menghasilkan soal captcha matematika (dirender sebagai SVG) dan menyetel cookie `captcha_token`.

**Response 200**
```json
{
  "status": true,
  "message": "Captcha berhasil dibuat",
  "data": {
    "questionSvg": "<svg>...</svg>",
    "options": [
      { "optionId": "a1b2c3...", "svg": "<svg>...</svg>" }
    ],
    "expiresIn": "15",
    "requestId": "..."
  }
}
```

#### `POST /api/auth/login`
Login menggunakan identifier (username/NIK) dan jawaban captcha yang dipilih.

**Body**
```json
{
  "identifier": "zainuri",
  "captchaOptionId": "a1b2c3..."
}
```

| Field | Wajib | Keterangan |
|---|:---:|---|
| `identifier` | ✅ | Username atau NIK |
| `captchaOptionId` | ✅ | `optionId` opsi captcha yang dipilih |

**Response 200** — set cookie `auth_token`
```json
{
  "status": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1, "username": "zainuri", "nik": "...",
      "name": "...", "role": "...", "status": "active",
      "created_at": "...", "updated_at": "..."
    },
    "requestId": "..."
  }
}
```

**Kemungkinan error**
| Status | Kondisi |
|---|---|
| 400 | `identifier`/`captchaOptionId` kosong, atau captcha tidak valid/kedaluwarsa |
| 404 | Username atau NIK tidak terdaftar |
| 403 | Akun tidak aktif |

#### `POST /api/auth/logout` 🔒
Menghapus cookie `auth_token`.

**Response 200**
```json
{ "status": true, "message": "Logout berhasil", "data": { "requestId": "..." } }
```

#### `GET /api/auth/me` 🔒
Mengambil data user yang sedang login.

**Response 200**
```json
{
  "status": true,
  "message": "Data user berhasil diambil",
  "data": { "user": { "id": 1, "username": "zainuri", "...": "..." }, "requestId": "..." }
}
```

---

### Catatan

Query params umum untuk endpoint list:

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `page` | number | `1` | Nomor halaman (> 0) |
| `limit` | number | `10` | Item per halaman (maks `50`) |
| `search` | string | – | Cari di `judul`, `isi`, `solusi`, `nama` |
| `sort` | string | `terbaru` | `terbaru` \| `terlama` \| `populer` \| `unpopuler` |

Objek `pagination` pada response list:
```json
{ "page": 1, "limit": 10, "total": 42, "totalPage": 5 }
```

Field catatan:
```json
{
  "id": 1, "judul": "...", "gambar": "/images/...", "isi": "...",
  "solusi": "...", "tanggal": "...", "updtime": "...", "nama": "...",
  "status": "public", "keterangan": "show", "klik": 3
}
```

#### `GET /api/catatan/public`
Daftar catatan public (`status = public`, `keterangan = show`).

#### `GET /api/catatan/public/:id`
Detail satu catatan public. **404** jika tidak ada.

#### `GET /api/catatan/my` 🔒
Daftar catatan milik user (difilter berdasarkan `nama` user). Query tambahan:

| Param | Keterangan |
|---|---|
| `status` | `public` \| `private` (opsional) |

#### `GET /api/catatan/my/:id` 🔒
Detail catatan milik user. **404** jika bukan milik user / tidak ada.

#### `GET /api/catatan/trash` 🔒
Daftar catatan user yang berada di keranjang sampah (`keterangan = hide`).

#### `POST /api/catatan` 🔒
Membuat catatan baru.

**Body**
```json
{
  "judul": "Judul catatan",
  "isi": "Isi catatan (opsional)",
  "solusi": "Penyelesaian",
  "gambar": "/images/foo.png",
  "status": "private"
}
```

| Field | Wajib | Keterangan |
|---|:---:|---|
| `judul` | ✅ | Tidak boleh kosong |
| `solusi` | ✅ | Tidak boleh kosong |
| `isi` | – | Opsional |
| `gambar` | – | URL hasil upload |
| `status` | – | `public` \| `private` (default `private`) |

**Response 201** — mengembalikan objek `catatan` yang dibuat.

#### `PATCH /api/catatan/:id` 🔒
Update sebagian field catatan. Minimal satu dari: `judul`, `gambar`, `isi`, `solusi`, `status`. `judul`/`solusi` tidak boleh string kosong; `status` harus `public`/`private`.

**Response 200** — objek `catatan` terbaru. **404** jika tidak ditemukan.

#### `PATCH /api/catatan/:id/status` 🔒
Ubah status catatan.

**Body**
```json
{ "status": "public" }
```

#### `PATCH /api/catatan/:id/delete` 🔒
Pindahkan catatan ke keranjang sampah (`keterangan = hide`).

**Response 200**
```json
{ "status": true, "message": "Catatan berhasil dipindahkan ke keranjang sampah",
  "data": { "id": 1, "keterangan": "hide", "requestId": "..." } }
```

#### `PATCH /api/catatan/:id/restore` 🔒
Pulihkan catatan dari keranjang sampah (`keterangan = show`).

#### `POST /api/catatan/:id/copy-isi` 🔒
Mengembalikan teks isi untuk disalin, dan menambah `klik` catatan. Dapat mengakses catatan public mana pun atau catatan milik sendiri.

**Response 200**
```json
{
  "status": true,
  "message": "Isi catatan berhasil dicopy",
  "data": { "copyText": "...", "catatan": { "id": 1, "klik": 4 }, "requestId": "..." }
}
```

#### `POST /api/catatan/:id/copy-solusi` 🔒
Mengembalikan teks solusi untuk disalin (tidak menambah klik).

**Catatan validasi untuk seluruh endpoint `:id`**: `id` harus angka > 0, jika tidak → **400** `ID catatan tidak valid`.

---

### Upload

#### `POST /api/uploads/image` 🔒
Upload satu gambar (multipart/form-data, field `image`).

- Format didukung: `jpeg`, `png`, `webp`, `gif`
- Ukuran maks: **3 MB**
- Deduplikasi: jika file dengan nama & ukuran sama sudah ada, file lama digunakan kembali (`reused: true`).

**Response 201**
```json
{
  "status": true,
  "message": "Gambar berhasil diupload",
  "data": {
    "imageUrl": "/images/nama-file.png",
    "filename": "nama-file.png",
    "reused": false,
    "requestId": "..."
  }
}
```

**Error 400** — tidak ada file, format tidak didukung, atau ukuran melebihi batas.

#### `GET /api/uploads/test`
Cek route upload aktif.

Gambar yang tersimpan dapat diakses statis di `GET /images/<filename>`.

---

### Cabang

#### `GET /api/cabang`
Daftar cabang dari tabel `m_cabang`. (Catatan: endpoint ini memakai format response sendiri.)

**Response 200**
```json
{
  "status": true,
  "message": "Data cabang berhasil diambil",
  "data": [
    { "kodeCab": "001", "namaCab": "Pusat", "label": "001 - Pusat" }
  ]
}
```

---

## Testing

Backend memakai **Vitest** + **Supertest**.

```bash
cd notes-backend
npm test
```

File test:
- `tests/_minimal.test.js` — smoke test
- `tests/auth/auth.test.js` — alur autentikasi
- `tests/catatan/catatan.test.js` — endpoint catatan
- `tests/setupLogin.js` — helper login (ambil captcha → decode → login)

> Test memerlukan koneksi database dan `CAPTCHA_SECRET` yang valid di environment.

---

## Deployment (PM2)

`notes-backend/ecosystem.config.cjs` mendefinisikan dua proses:

- `notes-backend` — menjalankan `src/server.js` dengan `--env-file=.env`
- `notes-frontend` — menyajikan `dist/` via `serve` di port `5173`

```bash
# build frontend lebih dulu
cd notes-frontend && npm run build

# jalankan kedua proses
cd ../notes-backend && pm2 start ecosystem.config.cjs
```

---

## Struktur Proyek

```
notes/
├── notes-backend/
│   ├── src/
│   │   ├── app.js                 # setup express, middleware, mount route
│   │   ├── server.js              # entry point
│   │   ├── config/                # db.js, logger.js
│   │   ├── middlewares/           # auth, requestId, httpLogger, error
│   │   ├── modules/
│   │   │   ├── auth/              # route, controller, model
│   │   │   ├── catatan/           # route, controller, model
│   │   │   ├── upload/            # route, controller, model
│   │   │   └── cabang/            # route, controller, model
│   │   └── utils/                 # jwt, captcha, cookieOptions, response, log
│   ├── tests/
│   └── ecosystem.config.cjs
└── notes-frontend/
    ├── src/
    │   ├── app/                   # main.js, App.vue, primevue.js
    │   ├── router/
    │   ├── shared/                # layout, api, composables
    │   └── features/
    │       ├── auth/              # views, stores, routes
    │       └── notes/             # views, components, services, routes
    └── vite.config.js
```
