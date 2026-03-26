import {
  sqliteTable,
  text,
  integer,
} from 'drizzle-orm/sqlite-core';

// ============================================================
// Better Auth Tables
// ============================================================

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('karyawan'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ============================================================
// Business Tables
// ============================================================

export const employee = sqliteTable('employee', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  nama: text('nama').notNull(),
  nik: text('nik').notNull().unique(),
  jabatan: text('jabatan').notNull(),
  status: text('status').notNull().default('Aktif'),
  email: text('email'),
  phone: text('phone'),
  tanggalMasuk: text('tanggal_masuk').notNull(),
  alamat: text('alamat'),
  gajiPokok: integer('gaji_pokok').notNull().default(0),
  tunjanganTetap: integer('tunjangan_tetap').notNull().default(0),
  tunjanganTransport: integer('tunjangan_transport').notNull().default(0),
  statusPTKP: text('status_ptkp').notNull().default('TK/0'),
  npwp: text('npwp'),
  bank: text('bank'),
  noRek: text('no_rek'),
  bpjsKesehatan: text('bpjs_kesehatan'),
  bpjsKetenagakerjaan: text('bpjs_ketenagakerjaan'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const payrollPeriod = sqliteTable(
  'payroll_period',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bulan: integer('bulan').notNull(),
    tahun: integer('tahun').notNull(),
    status: text('status').notNull().default('draft'),
    totalBruto: integer('total_bruto').notNull().default(0),
    totalPotongan: integer('total_potongan').notNull().default(0),
    totalNetPay: integer('total_net_pay').notNull().default(0),
    processedById: text('processed_by_id').references(() => user.id),
    processedAt: integer('processed_at'),
    createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  }
);

export const payrollDetail = sqliteTable('payroll_detail', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  periodId: integer('period_id')
    .notNull()
    .references(() => payrollPeriod.id, { onDelete: 'cascade' }),
  employeeId: integer('employee_id')
    .notNull()
    .references(() => employee.id, { onDelete: 'cascade' }),
  gajiPokok: integer('gaji_pokok').notNull(),
  tunjanganTetap: integer('tunjangan_tetap').notNull().default(0),
  tunjanganTransport: integer('tunjangan_transport').notNull().default(0),
  lembur: integer('lembur').notNull().default(0),
  bonus: integer('bonus').notNull().default(0),
  bruto: integer('bruto').notNull(),
  bpjsKesehatan: integer('bpjs_kesehatan').notNull().default(0),
  bpjsKetenagakerjaan: integer('bpjs_ketenagakerjaan').notNull().default(0),
  pph21: integer('pph21').notNull().default(0),
  potonganKhusus: integer('potongan_khusus').notNull().default(0),
  totalPotongan: integer('total_potongan').notNull(),
  netPay: integer('net_pay').notNull(),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const income = sqliteTable('income', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tanggal: text('tanggal').notNull(),
  deskripsi: text('deskripsi').notNull(),
  kategori: text('kategori').notNull(),
  jumlah: integer('jumlah').notNull(),
  bukti: text('bukti'),
  createdById: text('created_by_id').references(() => user.id),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const expense = sqliteTable('expense', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tanggal: text('tanggal').notNull(),
  deskripsi: text('deskripsi').notNull(),
  kategori: text('kategori').notNull(),
  jumlah: integer('jumlah').notNull(),
  vendorId: integer('vendor_id').references(() => vendor.id, {
    onDelete: 'set null',
  }),
  bukti: text('bukti'),
  createdById: text('created_by_id').references(() => user.id),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const vendor = sqliteTable('vendor', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kontak: text('kontak'),
  kategori: text('kategori'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});
