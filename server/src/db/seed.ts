import 'dotenv/config';
import { db, queryClient } from './index.js';
import {
  employee,
  income,
  expense,
  vendor,
  payrollPeriod,
  payrollDetail,
} from './schema.js';
import { auth } from '../auth/index.js';

async function seed() {
  console.log('🌱 Seeding database...\n');
  
  console.log('🧹 Clearing existing data...');
  // Delete in reverse order of dependencies, or just delete all
  await db.delete(payrollDetail).execute();
  await db.delete(payrollPeriod).execute();
  await db.delete(expense).execute();
  await db.delete(income).execute();
  await db.delete(employee).execute();
  await db.delete(vendor).execute();

  // -------------------------------------------------------
  // 1. Create users via Better Auth
  // -------------------------------------------------------
  console.log('\n👤 Creating users...');

  const users = [
    { name: 'Admin Utama', email: 'admin@perusahaan.com', password: 'admin123', role: 'admin' },
    { name: 'Siti Rahayu', email: 'siti@perusahaan.com', password: 'finance123', role: 'finance' },
    { name: 'Ahmad Rizki', email: 'ahmad@perusahaan.com', password: 'karyawan123', role: 'karyawan' },
  ];

  const createdUsers: any[] = [];
  for (const u of users) {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
        },
      });
      createdUsers.push(result.user);
      console.log(`  ✅ ${u.name} (${u.role})`);
    } catch (err: any) {
      console.log(`  ⚠️  ${u.name} — ${err.message || 'may already exist'}`);
    }
  }

  // -------------------------------------------------------
  // 2. Insert vendors
  // -------------------------------------------------------
  console.log('\n🏪 Inserting vendors...');

  const vendorRecords = await db
    .insert(vendor)
    .values([
      { nama: 'PT Gedung Megah', kontak: '021-5551234', kategori: 'Properti' },
      { nama: 'PLN & PAM', kontak: '123', kategori: 'Utilitas' },
      { nama: 'PT Telkom', kontak: '021-5557890', kategori: 'Teknologi' },
      { nama: 'Agency Digital', kontak: '081987654321', kategori: 'Marketing' },
      { nama: 'Toko ATK Jaya', kontak: '021-5554567', kategori: 'Supplies' },
      { nama: 'Catering Sehat', kontak: '081876543210', kategori: 'F&B' },
    ])
    .returning();

  console.log(`  ✅ ${vendorRecords.length} vendors inserted`);

  // Build vendor lookup
  const vendorMap: Record<string, number> = {};
  vendorRecords.forEach((v) => {
    vendorMap[v.nama] = v.id;
  });

  // -------------------------------------------------------
  // 3. Insert employees
  // -------------------------------------------------------
  console.log('\n👥 Inserting employees...');

  const employeeRecords = await db
    .insert(employee)
    .values([
      {
        nama: 'Budi Santoso', nik: '3201010101880001', jabatan: 'Manager IT',
        status: 'Aktif', email: 'budi@perusahaan.com', phone: '081234567890',
        tanggalMasuk: '2020-03-15', alamat: 'Jl. Merdeka No. 10, Jakarta',
        gajiPokok: 12000000, tunjanganTetap: 2000000, tunjanganTransport: 1000000,
        statusPTKP: 'K/1', npwp: '12.345.678.9-012.000', bank: 'BCA', noRek: '1234567890',
        bpjsKesehatan: '0001234567890', bpjsKetenagakerjaan: '0001234567891',
      },
      {
        nama: 'Siti Rahayu', nik: '3201010101900002', jabatan: 'Finance Staff',
        status: 'Aktif', email: 'siti@perusahaan.com', phone: '081234567891',
        tanggalMasuk: '2021-06-01', alamat: 'Jl. Sudirman No. 20, Jakarta',
        gajiPokok: 8000000, tunjanganTetap: 1500000, tunjanganTransport: 800000,
        statusPTKP: 'TK/0', npwp: '12.345.678.9-013.000', bank: 'Mandiri', noRek: '2345678901',
        bpjsKesehatan: '0001234567892', bpjsKetenagakerjaan: '0001234567893',
      },
      {
        nama: 'Ahmad Rizki', nik: '3201010101920003', jabatan: 'Developer',
        status: 'Aktif', email: 'ahmad@perusahaan.com', phone: '081234567892',
        tanggalMasuk: '2022-01-10', alamat: 'Jl. Gatot Subroto No. 5, Jakarta',
        gajiPokok: 10000000, tunjanganTetap: 1800000, tunjanganTransport: 900000,
        statusPTKP: 'K/0', npwp: '12.345.678.9-014.000', bank: 'BNI', noRek: '3456789012',
        bpjsKesehatan: '0001234567894', bpjsKetenagakerjaan: '0001234567895',
      },
      {
        nama: 'Dewi Lestari', nik: '3201010101950004', jabatan: 'HR Admin',
        status: 'Aktif', email: 'dewi@perusahaan.com', phone: '081234567893',
        tanggalMasuk: '2021-09-20', alamat: 'Jl. Thamrin No. 15, Jakarta',
        gajiPokok: 7500000, tunjanganTetap: 1200000, tunjanganTransport: 700000,
        statusPTKP: 'TK/0', npwp: '12.345.678.9-015.000', bank: 'BRI', noRek: '4567890123',
        bpjsKesehatan: '0001234567896', bpjsKetenagakerjaan: '0001234567897',
      },
      {
        nama: 'Rudi Hartono', nik: '3201010101870005', jabatan: 'Marketing Manager',
        status: 'Aktif', email: 'rudi@perusahaan.com', phone: '081234567894',
        tanggalMasuk: '2019-11-05', alamat: 'Jl. Kuningan No. 30, Jakarta',
        gajiPokok: 11000000, tunjanganTetap: 2000000, tunjanganTransport: 1000000,
        statusPTKP: 'K/2', npwp: '12.345.678.9-016.000', bank: 'BCA', noRek: '5678901234',
        bpjsKesehatan: '0001234567898', bpjsKetenagakerjaan: '0001234567899',
      },
      {
        nama: 'Rina Wulandari', nik: '3201010101930006', jabatan: 'Designer',
        status: 'Aktif', email: 'rina@perusahaan.com', phone: '081234567895',
        tanggalMasuk: '2023-02-14', alamat: 'Jl. Kemang No. 8, Jakarta',
        gajiPokok: 9000000, tunjanganTetap: 1500000, tunjanganTransport: 800000,
        statusPTKP: 'TK/0', npwp: '12.345.678.9-017.000', bank: 'Mandiri', noRek: '6789012345',
        bpjsKesehatan: '0001234567900', bpjsKetenagakerjaan: '0001234567901',
      },
      {
        nama: 'Agus Prasetyo', nik: '3201010101900007', jabatan: 'Accounting Staff',
        status: 'Nonaktif', email: 'agus@perusahaan.com', phone: '081234567896',
        tanggalMasuk: '2020-07-01', alamat: 'Jl. Senayan No. 12, Jakarta',
        gajiPokok: 7000000, tunjanganTetap: 1000000, tunjanganTransport: 600000,
        statusPTKP: 'K/1', npwp: '12.345.678.9-018.000', bank: 'BNI', noRek: '7890123456',
        bpjsKesehatan: '0001234567902', bpjsKetenagakerjaan: '0001234567903',
      },
    ])
    .returning();

  console.log(`  ✅ ${employeeRecords.length} employees inserted`);

  // -------------------------------------------------------
  // 4. Insert income (pemasukan)
  // -------------------------------------------------------
  console.log('\n💰 Inserting income records...');

  const incomeRecords = await db
    .insert(income)
    .values([
      { tanggal: '2026-03-01', deskripsi: 'Penjualan Produk A', kategori: 'Penjualan', jumlah: 45000000 },
      { tanggal: '2026-03-05', deskripsi: 'Jasa Konsultasi IT', kategori: 'Jasa', jumlah: 25000000 },
      { tanggal: '2026-03-10', deskripsi: 'Penjualan Produk B', kategori: 'Penjualan', jumlah: 32000000 },
      { tanggal: '2026-03-15', deskripsi: 'Pendapatan Investasi Q1', kategori: 'Investasi', jumlah: 8000000 },
      { tanggal: '2026-03-18', deskripsi: 'Kontrak Maintenance Server', kategori: 'Jasa', jumlah: 15000000 },
      { tanggal: '2026-02-02', deskripsi: 'Penjualan Produk A', kategori: 'Penjualan', jumlah: 40000000 },
      { tanggal: '2026-02-12', deskripsi: 'Jasa Konsultasi', kategori: 'Jasa', jumlah: 20000000 },
      { tanggal: '2026-02-20', deskripsi: 'Penjualan Online', kategori: 'Penjualan', jumlah: 28000000 },
      { tanggal: '2026-01-05', deskripsi: 'Penjualan Produk C', kategori: 'Penjualan', jumlah: 35000000 },
      { tanggal: '2026-01-15', deskripsi: 'Pendapatan Sewa Gedung', kategori: 'Sewa', jumlah: 12000000 },
    ])
    .returning();

  console.log(`  ✅ ${incomeRecords.length} income records inserted`);

  // -------------------------------------------------------
  // 5. Insert expenses (pengeluaran)
  // -------------------------------------------------------
  console.log('\n💸 Inserting expense records...');

  const expenseRecords = await db
    .insert(expense)
    .values([
      { tanggal: '2026-03-01', deskripsi: 'Sewa Kantor Maret', kategori: 'Sewa', jumlah: 15000000, vendorId: vendorMap['PT Gedung Megah'] },
      { tanggal: '2026-03-03', deskripsi: 'Listrik & Air', kategori: 'Utilitas', jumlah: 3500000, vendorId: vendorMap['PLN & PAM'] },
      { tanggal: '2026-03-05', deskripsi: 'Internet & Hosting', kategori: 'Teknologi', jumlah: 2500000, vendorId: vendorMap['PT Telkom'] },
      { tanggal: '2026-03-10', deskripsi: 'ATK & Supplies', kategori: 'Operasional', jumlah: 1200000, vendorId: vendorMap['Toko ATK Jaya'] },
      { tanggal: '2026-03-12', deskripsi: 'Marketing Digital Maret', kategori: 'Marketing', jumlah: 8000000, vendorId: vendorMap['Agency Digital'] },
      { tanggal: '2026-03-15', deskripsi: 'Makan Siang Team', kategori: 'Operasional', jumlah: 2000000, vendorId: vendorMap['Catering Sehat'] },
      { tanggal: '2026-02-01', deskripsi: 'Sewa Kantor Feb', kategori: 'Sewa', jumlah: 15000000, vendorId: vendorMap['PT Gedung Megah'] },
      { tanggal: '2026-02-05', deskripsi: 'Listrik & Air', kategori: 'Utilitas', jumlah: 3200000, vendorId: vendorMap['PLN & PAM'] },
      { tanggal: '2026-02-10', deskripsi: 'Marketing Digital', kategori: 'Marketing', jumlah: 7000000, vendorId: vendorMap['Agency Digital'] },
      { tanggal: '2026-01-03', deskripsi: 'Sewa Kantor Jan', kategori: 'Sewa', jumlah: 15000000, vendorId: vendorMap['PT Gedung Megah'] },
    ])
    .returning();

  console.log(`  ✅ ${expenseRecords.length} expense records inserted`);

  // -------------------------------------------------------
  // 6. Insert payroll history
  // -------------------------------------------------------
  console.log('\n📊 Inserting payroll history...');

  const periods = [
    { bulan: 2, tahun: 2026, totalBruto: 75500000, totalPotongan: 8500000, totalNetPay: 67000000 },
    { bulan: 1, tahun: 2026, totalBruto: 75500000, totalPotongan: 8200000, totalNetPay: 67300000 },
    { bulan: 12, tahun: 2025, totalBruto: 75500000, totalPotongan: 8300000, totalNetPay: 67200000 },
  ];

  for (const p of periods) {
    const [period] = await db
      .insert(payrollPeriod)
      .values({
        bulan: p.bulan,
        tahun: p.tahun,
        status: 'completed',
        totalBruto: p.totalBruto,
        totalPotongan: p.totalPotongan,
        totalNetPay: p.totalNetPay,
        processedAt: Date.now(),
      })
      .returning();

    // Insert simplified payroll details for active employees
    const activeEmps = employeeRecords.filter((e) => e.status === 'Aktif');
    const details = activeEmps.map((emp) => {
      const bruto = emp.gajiPokok + emp.tunjanganTetap + emp.tunjanganTransport;
      const bpjsKes = Math.round(emp.gajiPokok * 0.01);
      const bpjsTK = Math.round(emp.gajiPokok * 0.02);
      const pph21 = Math.round(bruto * 0.05);
      const totalPotongan = bpjsKes + bpjsTK + pph21;
      return {
        periodId: period.id,
        employeeId: emp.id,
        gajiPokok: emp.gajiPokok,
        tunjanganTetap: emp.tunjanganTetap,
        tunjanganTransport: emp.tunjanganTransport,
        lembur: 0,
        bonus: 0,
        bruto,
        bpjsKesehatan: bpjsKes,
        bpjsKetenagakerjaan: bpjsTK,
        pph21,
        potonganKhusus: 0,
        totalPotongan,
        netPay: bruto - totalPotongan,
      };
    });

    await db.insert(payrollDetail).values(details);
    console.log(`  ✅ Period ${p.bulan}/${p.tahun} — ${details.length} employees`);
  }

  console.log('\n✨ Seed completed!\n');
  console.log('Demo login credentials:');
  console.log('  Admin:    admin@perusahaan.com    / admin123');
  console.log('  Finance:  siti@perusahaan.com     / finance123');
  console.log('  Karyawan: ahmad@perusahaan.com    / karyawan123');

  queryClient.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
