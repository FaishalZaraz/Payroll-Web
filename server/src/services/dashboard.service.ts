import { eq, sql, desc, like, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { employee, income, expense, payrollPeriod } from '../db/schema.js';

export const dashboardService = {
  async getStats(bulan: number, tahun: number) {
    const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`;
    const prevMonth = bulan === 1 ? 12 : bulan - 1;
    const prevYear = bulan === 1 ? tahun - 1 : tahun;
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // Current month totals
    const [currentIncome] = await db
      .select({ total: sql<number>`COALESCE(SUM(${income.jumlah}), 0)` })
      .from(income)
      .where(like(income.tanggal, `${monthStr}%`));

    const [currentExpense] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expense.jumlah}), 0)` })
      .from(expense)
      .where(like(expense.tanggal, `${monthStr}%`));

    // Previous month totals (for percentage change)
    const [prevIncome] = await db
      .select({ total: sql<number>`COALESCE(SUM(${income.jumlah}), 0)` })
      .from(income)
      .where(like(income.tanggal, `${prevMonthStr}%`));

    const [prevExpense] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expense.jumlah}), 0)` })
      .from(expense)
      .where(like(expense.tanggal, `${prevMonthStr}%`));

    // Active employees count
    const [empCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(employee)
      .where(eq(employee.status, 'Aktif'));

    const totalPemasukan = Number(currentIncome.total);
    const totalPengeluaran = Number(currentExpense.total);
    const labaBersih = totalPemasukan - totalPengeluaran;
    const prevPemasukan = Number(prevIncome.total);
    const prevPengeluaran = Number(prevExpense.total);

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    return {
      totalPemasukan,
      totalPengeluaran,
      labaBersih,
      totalKaryawan: Number(empCount.count),
      changePemasukan: calcChange(totalPemasukan, prevPemasukan),
      changePengeluaran: calcChange(totalPengeluaran, prevPengeluaran),
      changeLabaBersih: calcChange(
        labaBersih,
        prevPemasukan - prevPengeluaran
      ),
    };
  },

  async getCashflowMonthly(months: number = 6) {
    const results = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthStr = `${y}-${String(m).padStart(2, '0')}`;

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ];

      const [inc] = await db
        .select({ total: sql<number>`COALESCE(SUM(${income.jumlah}), 0)` })
        .from(income)
        .where(like(income.tanggal, `${monthStr}%`));

      const [exp] = await db
        .select({ total: sql<number>`COALESCE(SUM(${expense.jumlah}), 0)` })
        .from(expense)
        .where(like(expense.tanggal, `${monthStr}%`));

      results.push({
        bulan: monthNames[m - 1],
        pemasukan: Number(inc.total),
        pengeluaran: Number(exp.total),
      });
    }

    return results;
  },

  async getExpenseByCategory(bulan?: number, tahun?: number) {
    const colors: Record<string, string> = {
      Gaji: '#3b82f6',
      Sewa: '#8b5cf6',
      Marketing: '#f59e0b',
      Utilitas: '#10b981',
      Teknologi: '#ec4899',
      Operasional: '#6366f1',
    };

    let query;
    if (bulan && tahun) {
      const monthStr = `${tahun}-${String(bulan).padStart(2, '0')}`;
      query = db
        .select({
          name: expense.kategori,
          value: sql<number>`SUM(${expense.jumlah})`.as('value'),
        })
        .from(expense)
        .where(like(expense.tanggal, `${monthStr}%`))
        .groupBy(expense.kategori);
    } else {
      query = db
        .select({
          name: expense.kategori,
          value: sql<number>`SUM(${expense.jumlah})`.as('value'),
        })
        .from(expense)
        .groupBy(expense.kategori);
    }

    const rows = await query;
    const categories = rows.map((r) => ({
      name: r.name as string,
      value: Number(r.value),
      color: colors[r.name as string] || '#94a3b8',
    }));
    
    return categories;
  },

  async getRecentActivities(limit: number = 10) {
    // Get recent incomes and expenses combined
    const recentIncome = await db
      .select({
        id: income.id,
        tanggal: income.tanggal,
        deskripsi: income.deskripsi,
        tipe: sql<string>`'pemasukan'`.as('tipe'),
        jumlah: income.jumlah,
      })
      .from(income)
      .orderBy(desc(income.tanggal))
      .limit(limit);

    const recentExpense = await db
      .select({
        id: expense.id,
        tanggal: expense.tanggal,
        deskripsi: expense.deskripsi,
        tipe: sql<string>`'pengeluaran'`.as('tipe'),
        jumlah: expense.jumlah,
      })
      .from(expense)
      .orderBy(desc(expense.tanggal))
      .limit(limit);

    // Merge and sort
    const combined = [...recentIncome, ...recentExpense]
      .sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);

    return combined;
  },
};
