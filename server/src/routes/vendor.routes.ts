import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { vendorService } from '../services/vendor.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// GET /api/vendors
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const data = search
      ? await vendorService.getAll(search as string)
      : await vendorService.getWithTransactionTotal();
    res.json(apiResponse(data));
  })
);

// GET /api/vendors/:id
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await vendorService.getById(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }
    res.json(apiResponse(data));
  })
);

// POST /api/vendors
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await vendorService.create(req.body);
    res.status(201).json(apiResponse(data, 'Vendor created'));
  })
);

// PUT /api/vendors/:id
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await vendorService.update(Number(req.params.id), req.body);
    if (!data) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }
    res.json(apiResponse(data, 'Vendor updated'));
  })
);

// DELETE /api/vendors/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await vendorService.delete(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }
    res.json(apiResponse(data, 'Vendor deleted'));
  })
);

export default router;
