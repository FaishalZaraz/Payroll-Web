import { eq, like, and, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { employee, payrollDetail } from '../db/schema.js';

export const employeeService = {
  async getAll(filters?: { search?: string; jabatan?: string }) {
    let conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          like(employee.nama, `%${filters.search}%`),
          like(employee.nik, `%${filters.search}%`)
        )
      );
    }

    if (filters?.jabatan) {
      conditions.push(eq(employee.jabatan, filters.jabatan));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(employee)
        .where(and(...conditions))
        .orderBy(employee.nama);
    }

    return db.select().from(employee).orderBy(employee.nama);
  },

  async getById(id: number) {
    const [result] = await db
      .select()
      .from(employee)
      .where(eq(employee.id, id));
    return result || null;
  },

  async getActive() {
    return db
      .select()
      .from(employee)
      .where(eq(employee.status, 'Aktif'))
      .orderBy(employee.nama);
  },

  async create(data: typeof employee.$inferInsert) {
    const [result] = await db.insert(employee).values(data).returning();
    return result;
  },

  async update(id: number, data: Partial<typeof employee.$inferInsert>) {
    const [result] = await db
      .update(employee)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(employee.id, id))
      .returning();
    return result;
  },

  async delete(id: number) {
    // Clean up related payroll records first
    await db.delete(payrollDetail).where(eq(payrollDetail.employeeId, id));
    
    const [result] = await db
      .delete(employee)
      .where(eq(employee.id, id))
      .returning();
    return result;
  },

  async toggleStatus(id: number) {
    const emp = await this.getById(id);
    if (!emp) return null;
    const newStatus = emp.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const [result] = await db
      .update(employee)
      .set({ status: newStatus, updatedAt: Date.now() })
      .where(eq(employee.id, id))
      .returning();
    return result;
  },
};
