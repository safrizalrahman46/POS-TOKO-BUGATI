# POS-TOKO-BUGATI

<img width="1536" height="1024" alt="Image" src="https://github.com/user-attachments/assets/fec78223-423a-42a6-abd4-de7f77fbca94" />

# 🛒 POS Toko Bugati

Sistem Point of Sale (POS) berbasis web untuk operasional toko yang dibangun menggunakan:

* **Frontend:** React + Nginx
* **Backend:** Golang API
* **Database:** PostgreSQL 16
* **Deployment:** Docker Compose

---

# 📦 Arsitektur Sistem

```text
┌─────────────────┐
│    Frontend     │
│ React + Nginx   │
│    Port 80      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Golang API     │
│   Port 2000     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL 16   │
│   Port 5432     │
└─────────────────┘
```

Seluruh service dijalankan menggunakan **Docker Compose** dalam 3 container terpisah.

---

# 💻 Spesifikasi Minimum

| Komponen | Minimum          | Rekomendasi           |
| -------- | ---------------- | --------------------- |
| RAM      | 4 GB             | 8 GB                  |
| OS       | Windows 10/11    | Windows 10/11 Pro     |
| Storage  | 10 GB Free Space | 20 GB+                |
| Docker   | Docker Desktop   | Docker Desktop Latest |

> Docker Desktop membutuhkan WSL2 atau Hyper-V.

---

# 📋 Prasyarat

Sebelum menjalankan aplikasi, pastikan sudah menginstall:

### 1. Docker Desktop

Download:

https://www.docker.com/products/docker-desktop

### 2. WSL2

Biasanya akan otomatis diinstall saat proses instalasi Docker Desktop.

Untuk Windows Home Edition gunakan:

**Docker Desktop with WSL2 Backend**

---

# 🚀 Cara Instalasi

## 1. Download Project

Simpan source code ke komputer.

Contoh:

```text
D:\POS
```

Struktur folder:

```text
D:\POS
│
├── backend
├── frontend
├── docker-compose.yml
└── README.md
```

---

## 2. Jalankan Docker Desktop

Pastikan Docker Desktop sudah aktif.

Periksa icon Docker pada taskbar Windows.

Status harus:

```text
Docker is running
```

---

## 3. Buka CMD / Terminal

Masuk ke folder project:

```bash
cd D:\POS
```

---

## 4. Jalankan Docker Compose

```bash
docker compose up -d
```

---

## 5. Tunggu Build Selesai

Saat pertama kali dijalankan Docker akan:

* Download image
* Build frontend
* Build backend
* Membuat database PostgreSQL

Proses pertama biasanya membutuhkan:

```text
5 - 10 Menit
```

---

# 🌐 Akses Aplikasi

## Frontend POS

```text
http://localhost:3000
```

## Backend API

```text
http://localhost:2000
```

---

# 🔐 Login Default

Gunakan akun bawaan berikut:

```text
Username : admin
Password : admin123
```

> Segera ubah password setelah deployment pertama.

---

# 📱 Akses dari PC atau Tablet Lain

## 1. Pastikan Satu Jaringan

Semua perangkat harus berada pada:

* WiFi yang sama
  atau
* LAN yang sama

---

## 2. Cari IP Address Komputer Host

Buka CMD:

```bash
ipconfig
```

Cari:

```text
IPv4 Address
```

Contoh:

```text
192.168.1.105
```

---

## 3. Akses dari Device Lain

Buka browser:

```text
http://192.168.1.105:3000
```

Ganti IP sesuai IP komputer host.

---

# ⚙️ Konfigurasi CORS & API URL

Jika frontend diakses dari device lain, ubah konfigurasi:

## Backend

```env
CORS_ALLOWED_ORIGINS=http://192.168.1.105:3000
```

## Frontend

```env
VITE_API_BASE_URL=http://192.168.1.105:2000
```

---

# 🔄 Restart Setelah Perubahan Konfigurasi

Jalankan:

```bash
docker compose down
```

Kemudian:

```bash
docker compose up -d
```

---

# 🛠️ Perintah Docker yang Sering Digunakan

## Menjalankan Aplikasi

```bash
docker compose up -d
```

## Menghentikan Aplikasi

```bash
docker compose down
```

## Melihat Log

```bash
docker compose logs -f
```

## Melihat Container Aktif

```bash
docker ps
```

## Restart Container

```bash
docker compose restart
```

---

# 🔍 Troubleshooting

## Port Sudah Dipakai

Error:

```text
Port is already allocated
```

Solusi:

Edit bagian:

```yaml
ports:
```

Pada file:

```text
docker-compose.yml
```

Misalnya:

```yaml
3000:80
```

Menjadi:

```yaml
3001:80
```

---

## Docker Tidak Mau Jalan

Pastikan:

* Docker Desktop aktif
* WSL2 berjalan
* Virtualization aktif di BIOS

---

## Tidak Bisa Diakses dari Device Lain

Periksa:

* Firewall Windows
* Semua device berada pada jaringan yang sama
* IP Address sudah benar
* Konfigurasi CORS sudah diperbarui

---

# 📌 Rekomendasi Produksi

Untuk penggunaan permanen di toko:

✅ Gunakan Static IP

✅ Backup database secara berkala

✅ Gunakan UPS untuk komputer server

✅ Ganti password default admin

✅ Aktifkan auto-start Docker Desktop saat Windows menyala

---

# 📄 Lisensi

Copyright © Toko Bugati

Digunakan untuk kebutuhan operasional dan pengelolaan sistem POS Toko Bugati.
