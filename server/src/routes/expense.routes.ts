import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { expenseService } from '../services/expense.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// GET /api/expenses
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const { search, kategori } = req.query;
    const data = await expenseService.getAll({
      search: search as string,
      kategori: kategori as string,
    });
    res.json(apiResponse(data));
  })
);

// GET /api/expenses/:id
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await expenseService.getById(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json(apiResponse(data));
  })
);

// POST /api/expenses
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await expenseService.create({
      ...req.body,
      createdById: req.user!.id,
    });
    res.status(201).json(apiResponse(data, 'Expense created'));
  })
);

// PUT /api/expenses/:id
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await expenseService.update(Number(req.params.id), req.body);
    if (!data) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json(apiResponse(data, 'Expense updated'));
  })
);

// DELETE /api/expenses/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await expenseService.delete(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json(apiResponse(data, 'Expense deleted'));
  })
);

export default router;
