import { eq, like, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { vendor, expense } from '../db/schema.js';

export const vendorService = {
  async getAll(search?: string) {
    if (search) {
      return db
        .select()
        .from(vendor)
        .where(like(vendor.nama, `%${search}%`))
        .orderBy(vendor.nama);
    }
    return db.select().from(vendor).orderBy(vendor.nama);
  },

  async getById(id: number) {
    const [result] = await db
      .select()
      .from(vendor)
      .where(eq(vendor.id, id));
    return result || null;
  },

  async create(data: typeof vendor.$inferInsert) {
    const [result] = await db.insert(vendor).values(data).returning();
    return result;
  },

  async update(id: number, data: Partial<typeof vendor.$inferInsert>) {
    const [result] = await db
      .update(vendor)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(vendor.id, id))
      .returning();
    return result;
  },

  async delete(id: number) {
    const [result] = await db
      .delete(vendor)
      .where(eq(vendor.id, id))
      .returning();
    return result;
  },

  async getWithTransactionTotal() {
    return db
      .select({
        id: vendor.id,
        nama: vendor.nama,
        kontak: vendor.kontak,
        kategori: vendor.kategori,
        totalTransaksi: sql<number>`COALESCE(SUM(${expense.jumlah}), 0)`.as(
          'total_transaksi'
        ),
      })
      .from(vendor)
      .leftJoin(expense, eq(vendor.id, expense.vendorId))
      .groupBy(vendor.id, vendor.nama, vendor.kontak, vendor.kategori)
      .orderBy(vendor.nama);
  },
};
