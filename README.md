# PayrollPro - Sistem Manajemen Gaji & Keuangan

PayrollPro adalah aplikasi manajemen penggajian (payroll) dan pelacakan keuangan perusahaan yang dibangun dengan teknologi modern. Aplikasi ini dirancang untuk memudahkan pengelolaan data karyawan, pemrosesan gaji, dan pemantauan arus kas perusahaan (pemasukan & pengeluaran).

## 🚀 Fitur Utama

- **Dashboard Integrasi**: Visualisasi data keuangan dan ringkasan pengeluaran gaji menggunakan grafik interaktif (Recharts).
- **Manajemen Karyawan**: Sistem CRUD lengkap untuk mengelola data karyawan.
- **Pemrosesan Gaji (Payroll)**: Kalkulasi gaji otomatis berdasarkan data periodik.
- **Laporan Keuangan**: Pelacakan pemasukan, pengeluaran, dan manajemen vendor.
- **Slip Gaji PDF**: Pembuatan slip gaji otomatis dalam format PDF yang siap cetak.
- **Ringkasan Laba Rugi**: Laporan efisiensi keuangan perusahaan secara real-time.
- **Autentikasi Aman**: Didukung oleh Better Auth untuk keamanan data tingkat tinggi.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)
- **Styling**: Vanilla CSS (Modern CSS Variables & Glassmorphism)

### Backend & Database
- **Runtime**: Node.js (via [tsx](https://tsx.is/))
- **Framework**: [Express 5](https://expressjs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [SQLite](https://www.sqlite.org/) (Better-sqlite3)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **File Upload**: [Multer](https://github.com/expressjs/multer)

## 📦 Struktur Proyek

```text
├── server/             # Backend (Express + Drizzle + SQLite)
│   ├── src/db/         # Skema & Inisialisasi Database
│   ├── src/routes/     # API Endpoints
│   └── src/services/   # Logika Bisnis
├── src/                # Frontend (React + Vite)
│   ├── components/     # UI Components reusable
│   ├── context/        # State Management (Auth, Toast)
│   ├── pages/          # Halaman Utama
│   └── styles/         # Global & Utility Styles
└── public/             # Static Assets
```

## 🛠️ Cara Menjalankan Proyek

### Prasyarat
- Node.js versi terbaru (Rekomendasi v18 ke atas)

### Langkah-langkah

1. **Clone Repositori**
   ```bash
   git clone https://github.com/FaishalZaraz/Payroll-Web.git
   cd Website-Gaji-Karyawan
   ```

2. **Instal Dependensi (Root & Server)**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Konfigurasi Environment Variable**
   Salin file `.env.example` di dalam folder `server` menjadi `.env` dan sesuaikan nilainya.

4. **Inisialisasi Database**
   Di dalam folder `server`, jalankan:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Jalankan Aplikasi (Mode Pengembangan)**
   Dari root direktori, jalankan:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di [http://localhost:5173](http://localhost:5173) (Client) dan [http://localhost:3001](http://localhost:3001) (Server).

## 🗄️ Manajemen Database

Untuk melihat dan mengelola isi database secara visual, Anda dapat menggunakan **Drizzle Studio**:

1. Masuk ke folder `server`
2. Jalankan perintah:
   ```bash
   npm run db:studio
   ```
3. Buka **[https://local.drizzle.studio](https://local.drizzle.studio)** di browser Anda.

## 📄 Lisensi
Project ini dibuat untuk tujuan pembelajaran dan manajemen internal.
