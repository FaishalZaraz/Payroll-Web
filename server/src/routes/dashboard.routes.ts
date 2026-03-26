import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { dashboardService } from '../services/dashboard.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// GET /api/dashboard/stats?bulan=3&tahun=2026
router.get(
  '/stats',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const bulan = Number(req.query.bulan) || new Date().getMonth() + 1;
    const tahun = Number(req.query.tahun) || new Date().getFullYear();
    const data = await dashboardService.getStats(bulan, tahun);
    res.json(apiResponse(data));
  })
);

// GET /api/dashboard/cashflow?months=6
router.get(
  '/cashflow',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const months = Number(req.query.months) || 6;
    const data = await dashboardService.getCashflowMonthly(months);
    res.json(apiResponse(data));
  })
);

// GET /api/dashboard/expense-distribution?bulan=3&tahun=2026
router.get(
  '/expense-distribution',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const bulan = Number(req.query.bulan) || undefined;
    const tahun = Number(req.query.tahun) || undefined;
    const data = await dashboardService.getExpenseByCategory(bulan, tahun);
    res.json(apiResponse(data));
  })
);

// GET /api/dashboard/recent-activities?limit=10
router.get(
  '/recent-activities',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const data = await dashboardService.getRecentActivities(limit);
    res.json(apiResponse(data));
  })
);

export default router;
