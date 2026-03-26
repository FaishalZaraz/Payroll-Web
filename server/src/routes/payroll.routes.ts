import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { payrollService } from '../services/payroll.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// POST /api/payroll/process
router.post(
  '/process',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const { bulan, tahun, variables } = req.body;

    if (!bulan || !tahun) {
      res
        .status(400)
        .json({ success: false, message: 'bulan and tahun are required' });
      return;
    }

    try {
      const result = await payrollService.processPayroll(
        bulan,
        tahun,
        variables || [],
        req.user!.id
      );
      res.status(201).json(apiResponse(result, 'Payroll processed'));
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  })
);

// GET /api/payroll/history
router.get(
  '/history',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (_req, res) => {
    const data = await payrollService.getHistory();
    res.json(apiResponse(data));
  })
);

// GET /api/payroll/period/:id
router.get(
  '/period/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await payrollService.getPeriodDetail(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Period not found' });
      return;
    }
    res.json(apiResponse(data));
  })
);

    // GET /api/payroll/slip?employeeId=&bulan=&tahun=
    router.get(
      '/slip',
      requireAuth,
      asyncHandler(async (req, res) => {
        let employeeId = Number(req.query.employeeId);
        const bulan = Number(req.query.bulan);
        const tahun = Number(req.query.tahun);
    
        // Karyawan can only see their own slip
        if (req.user!.role === 'karyawan') {
          const { db } = await import('../db/index.js');
          const { employee } = await import('../db/schema.js');
          const { eq, or } = await import('drizzle-orm');
          
          const [emp] = await db
            .select()
            .from(employee)
            .where(
              or(
                eq(employee.userId, req.user!.id),
                eq(employee.email, req.user!.email)
              )
            );
            
          if (emp) {
            employeeId = emp.id;
          } else {
            res.status(403).json({ success: false, message: 'Employee record not found for this user' });
            return;
          }
        }
    
        if (!employeeId || !bulan || !tahun) {
          res.status(400).json({
            success: false,
            message: 'employeeId, bulan, and tahun are required',
          });
          return;
        }
    
        const data = await payrollService.getSlipGaji(employeeId, bulan, tahun);
        if (!data) {
          res.status(404).json({ success: false, message: 'Data slip gaji tidak ditemukan' });
          return;
        }

        if (data.periodStatus === 'not_joined') {
          res.status(404).json({ success: false, message: 'Karyawan belum bergabung pada periode ini' });
          return;
        }

        if (data.periodStatus === 'not_processed') {
          res.status(404).json({ success: false, message: 'Belum ada riwayat penggajian untuk periode ini' });
          return;
        }

        if (data.periodStatus === 'not_included') {
          res.status(404).json({ success: false, message: 'Karyawan tidak terdaftar dalam proses payroll periode ini' });
          return;
        }

        res.json(apiResponse(data));
      })
    );

// DELETE /api/payroll/period/:id
router.delete(
  '/period/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    try {
      console.log('Deleting payroll period:', req.params.id);
      const data = await payrollService.deletePeriod(Number(req.params.id));
      res.json(apiResponse(data, 'Periode payroll berhasil dihapus'));
    } catch (err: any) {
      console.error('Delete payroll error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  })
);

export default router;
