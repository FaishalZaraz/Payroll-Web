import { eq, like, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { income } from '../db/schema.js';

export const incomeService = {
  async getAll(filters?: { search?: string; kategori?: string }) {
    let conditions = [];

    if (filters?.search) {
      conditions.push(like(income.deskripsi, `%${filters.search}%`));
    }

    if (filters?.kategori) {
      conditions.push(eq(income.kategori, filters.kategori));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(income)
        .where(and(...conditions))
        .orderBy(desc(income.tanggal));
    }

    return db.select().from(income).orderBy(desc(income.tanggal));
  },

  async getById(id: number) {
    const [result] = await db
      .select()
      .from(income)
      .where(eq(income.id, id));
    return result || null;
  },

  async create(data: typeof income.$inferInsert) {
    const [result] = await db.insert(income).values(data).returning();
    return result;
  },

  async update(id: number, data: Partial<typeof income.$inferInsert>) {
    const [result] = await db
      .update(income)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(income.id, id))
      .returning();
    return result;
  },

  async delete(id: number) {
    const [result] = await db
      .delete(income)
      .where(eq(income.id, id))
      .returning();
    return result;
  },

  async getByPeriod(bulan: number, tahun: number) {
    const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`;
    return db
      .select()
      .from(income)
      .where(like(income.tanggal, `${monthStr}%`))
      .orderBy(desc(income.tanggal));
  },
};
