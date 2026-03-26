import { eq, like, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { expense, vendor } from '../db/schema.js';

export const expenseService = {
  async getAll(filters?: { search?: string; kategori?: string }) {
    let conditions = [];

    if (filters?.search) {
      conditions.push(like(expense.deskripsi, `%${filters.search}%`));
    }

    if (filters?.kategori) {
      conditions.push(eq(expense.kategori, filters.kategori));
    }

    const query = db
      .select({
        expense: expense,
        vendorNama: vendor.nama,
      })
      .from(expense)
      .leftJoin(vendor, eq(expense.vendorId, vendor.id));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(expense.tanggal));
    }

    return query.orderBy(desc(expense.tanggal));
  },

  async getById(id: number) {
    const [result] = await db
      .select({
        expense: expense,
        vendorNama: vendor.nama,
      })
      .from(expense)
      .leftJoin(vendor, eq(expense.vendorId, vendor.id))
      .where(eq(expense.id, id));
    return result || null;
  },

  async create(data: typeof expense.$inferInsert) {
    const [result] = await db.insert(expense).values(data).returning();
    return result;
  },

  async update(id: number, data: Partial<typeof expense.$inferInsert>) {
    const [result] = await db
      .update(expense)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(expense.id, id))
      .returning();
    return result;
  },

  async delete(id: number) {
    const [exp] = await db
      .select()
      .from(expense)
      .where(eq(expense.id, id));

    if (!exp) return null;

    // If it's a salary payment, also delete the corresponding payroll period
    if (exp.kategori === 'Gaji') {
      const match = exp.deskripsi.match(/Pembayaran Gaji (\d{2})\/(\d{4})/);
      if (match) {
        const bulan = parseInt(match[1], 10);
        const tahun = parseInt(match[2], 10);

        const { payrollPeriod } = await import('../db/schema.js');
        await db
          .delete(payrollPeriod)
          .where(
            and(eq(payrollPeriod.bulan, bulan), eq(payrollPeriod.tahun, tahun))
          );
      }
    }

    const [result] = await db
      .delete(expense)
      .where(eq(expense.id, id))
      .returning();
    return result;
  },

  async getByPeriod(bulan: number, tahun: number) {
    const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`;
    return db
      .select({
        expense: expense,
        vendorNama: vendor.nama,
      })
      .from(expense)
      .leftJoin(vendor, eq(expense.vendorId, vendor.id))
      .where(like(expense.tanggal, `${monthStr}%`))
      .orderBy(desc(expense.tanggal));
  },

  async getByKategori(bulan?: number, tahun?: number) {
    let baseQuery;
    if (bulan && tahun) {
      const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`;
      baseQuery = db
        .select({
          kategori: expense.kategori,
          total: sql<number>`SUM(${expense.jumlah})`.as('total'),
        })
        .from(expense)
        .where(like(expense.tanggal, `${monthStr}%`))
        .groupBy(expense.kategori);
    } else {
      baseQuery = db
        .select({
          kategori: expense.kategori,
          total: sql<number>`SUM(${expense.jumlah})`.as('total'),
        })
        .from(expense)
        .groupBy(expense.kategori);
    }
    return baseQuery;
  },
};
