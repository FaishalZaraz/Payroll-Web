import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { incomeService } from '../services/income.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// GET /api/income
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const { search, kategori } = req.query;
    const data = await incomeService.getAll({
      search: search as string,
      kategori: kategori as string,
    });
    res.json(apiResponse(data));
  })
);

// GET /api/income/:id
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await incomeService.getById(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Income not found' });
      return;
    }
    res.json(apiResponse(data));
  })
);

// POST /api/income
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await incomeService.create({
      ...req.body,
      createdById: req.user!.id,
    });
    res.status(201).json(apiResponse(data, 'Income created'));
  })
);

// PUT /api/income/:id
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await incomeService.update(Number(req.params.id), req.body);
    if (!data) {
      res.status(404).json({ success: false, message: 'Income not found' });
      return;
    }
    res.json(apiResponse(data, 'Income updated'));
  })
);

// DELETE /api/income/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await incomeService.delete(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Income not found' });
      return;
    }
    res.json(apiResponse(data, 'Income deleted'));
  })
);

export default router;
