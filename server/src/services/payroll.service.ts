import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  employee,
  payrollPeriod,
  payrollDetail,
  expense,
} from '../db/schema.js';

interface PayrollVariable {
  employeeId: number;
  lembur: number;
  bonus: number;
  potonganKhusus: number;
}

function calculateEmployeePayroll(
  emp: typeof employee.$inferSelect,
  vars: PayrollVariable
) {
  const gajiPokok = emp.gajiPokok;
  const tunjanganTetap = emp.tunjanganTetap;
  const tunjanganTransport = emp.tunjanganTransport;
  const lemburNominal = vars.lembur * 50000;
  const bonus = vars.bonus;
  const bruto =
    gajiPokok + tunjanganTetap + tunjanganTransport + lemburNominal + bonus;

  const bpjsKesehatan = Math.round(gajiPokok * 0.01);
  const bpjsKetenagakerjaan = Math.round(gajiPokok * 0.02);
  const pph21 = Math.round(bruto * 0.05);
  const potonganKhusus = vars.potonganKhusus;
  const totalPotongan =
    bpjsKesehatan + bpjsKetenagakerjaan + pph21 + potonganKhusus;
  const netPay = bruto - totalPotongan;

  return {
    gajiPokok,
    tunjanganTetap,
    tunjanganTransport,
    lembur: lemburNominal,
    bonus,
    bruto,
    bpjsKesehatan,
    bpjsKetenagakerjaan,
    pph21,
    potonganKhusus,
    totalPotongan,
    netPay,
  };
}

export const payrollService = {
  async processPayroll(
    bulan: number,
    tahun: number,
    variables: PayrollVariable[],
    processedById: string
  ) {
    // Check if payroll already processed for this period
    const existing = await db
      .select()
      .from(payrollPeriod)
      .where(and(eq(payrollPeriod.bulan, bulan), eq(payrollPeriod.tahun, tahun)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Payroll untuk periode ini sudah diproses dan tidak dapat diduplikasi.`);
    }

    // Get active employees
    const activeEmployees = await db
      .select()
      .from(employee)
      .where(eq(employee.status, 'Aktif'));

    // Calculate payroll for each employee
    const details = activeEmployees.map((emp) => {
      const vars = variables.find((v) => v.employeeId === emp.id) || {
        employeeId: emp.id,
        lembur: 0,
        bonus: 0,
        potonganKhusus: 0,
      };
      return {
        employee: emp,
        ...calculateEmployeePayroll(emp, vars),
      };
    });

    // Calculate totals
    const totalBruto = details.reduce((sum, d) => sum + d.bruto, 0);
    const totalPotongan = details.reduce((sum, d) => sum + d.totalPotongan, 0);
    const totalNetPay = details.reduce((sum, d) => sum + d.netPay, 0);

    // Create period
    const [period] = await db
      .insert(payrollPeriod)
      .values({
        bulan,
        tahun,
        status: 'completed',
        totalBruto,
        totalPotongan,
        totalNetPay,
        processedById,
        processedAt: Date.now(),
      })
      .returning();

    // Create details
    const detailRecords = details.map((d) => ({
      periodId: period.id,
      employeeId: d.employee.id,
      gajiPokok: d.gajiPokok,
      tunjanganTetap: d.tunjanganTetap,
      tunjanganTransport: d.tunjanganTransport,
      lembur: d.lembur,
      bonus: d.bonus,
      bruto: d.bruto,
      bpjsKesehatan: d.bpjsKesehatan,
      bpjsKetenagakerjaan: d.bpjsKetenagakerjaan,
      pph21: d.pph21,
      potonganKhusus: d.potonganKhusus,
      totalPotongan: d.totalPotongan,
      netPay: d.netPay,
    }));

    await db.insert(payrollDetail).values(detailRecords);

    // Create an expense record for the dashboard and financial history
    const tanggalExpense = new Date().toISOString().split('T')[0];
    await db.insert(expense).values({
      tanggal: tanggalExpense,
      deskripsi: `Pembayaran Gaji ${String(bulan).padStart(2, '0')}/${tahun}`,
      kategori: 'Gaji',
      jumlah: totalNetPay,
      createdById: processedById,
      bukti: null,
    });

    return { period, detailCount: detailRecords.length };
  },

  async getHistory() {
    return db
      .select()
      .from(payrollPeriod)
      .orderBy(desc(payrollPeriod.tahun), desc(payrollPeriod.bulan));
  },

  async getPeriodDetail(periodId: number) {
    const [period] = await db
      .select()
      .from(payrollPeriod)
      .where(eq(payrollPeriod.id, periodId));

    if (!period) return null;

    const details = await db
      .select({
        detail: payrollDetail,
        employeeName: employee.nama,
        employeeJabatan: employee.jabatan,
      })
      .from(payrollDetail)
      .innerJoin(employee, eq(payrollDetail.employeeId, employee.id))
      .where(eq(payrollDetail.periodId, periodId));

    return { period, details };
  },

  async getSlipGaji(employeeId: number, bulan: number, tahun: number) {
    const [emp] = await db
      .select()
      .from(employee)
      .where(eq(employee.id, employeeId));

    if (!emp) return null;

    // Check if employee had joined by this period
    const joinDate = new Date(emp.tanggalMasuk);
    const joinMonth = joinDate.getMonth() + 1;
    const joinYear = joinDate.getFullYear();

    if (tahun < joinYear || (tahun === joinYear && bulan < joinMonth)) {
      return { employee: emp, periodStatus: 'not_joined' };
    }

    // Find existing payroll period
    const periods = await db
      .select()
      .from(payrollPeriod)
      .where(
        and(eq(payrollPeriod.bulan, bulan), eq(payrollPeriod.tahun, tahun))
      );

    if (periods.length === 0) {
      // No processed payroll at all for the company, calculate on the fly for preview
      const calc = calculateEmployeePayroll(emp, {
        employeeId: emp.id,
        lembur: 0,
        bonus: 0,
        potonganKhusus: 0,
      });
      return { employee: emp, ...calc, periodStatus: 'not_processed' };
    }

    const [detail] = await db
      .select()
      .from(payrollDetail)
      .where(
        and(
          eq(payrollDetail.periodId, periods[0].id),
          eq(payrollDetail.employeeId, employeeId)
        )
      );

    if (!detail) {
      // If the overall period is already COMPLETED but this specific employee is NOT in the detail,
      // it means they were either joined late or intentionally excluded. No slip should be shown.
      if (periods[0].status === 'completed') {
        return { employee: emp, periodStatus: 'not_included' };
      }

      // If it's still in draft or other status, we can show a preview calculation
      const calc = calculateEmployeePayroll(emp, {
        employeeId: emp.id,
        lembur: 0,
        bonus: 0,
        potonganKhusus: 0,
      });
      return { employee: emp, ...calc, periodStatus: 'draft' };
    }

    return {
      employee: emp,
      ...detail,
      periodStatus: periods[0].status,
    };
  },

  async deletePeriod(periodId: number) {
    const [period] = await db
      .select()
      .from(payrollPeriod)
      .where(eq(payrollPeriod.id, periodId));
    
    if (!period) throw new Error('Periode payroll tidak ditemukan.');

    // Look for the associated expense record by matching description and category
    const descrip = `Pembayaran Gaji ${String(period.bulan).padStart(2, '0')}/${period.tahun}`;
    
    await db.delete(expense).where(
      and(
        eq(expense.kategori, 'Gaji'),
        eq(expense.deskripsi, descrip)
      )
    );

    // Delete payroll period (payrollDetail will be deleted via cascade)
    await db.delete(payrollPeriod).where(eq(payrollPeriod.id, periodId));

    return period;
  },
};
