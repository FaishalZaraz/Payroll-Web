import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { employeeService } from '../services/employee.service.js';
import { asyncHandler, apiResponse } from '../lib/utils.js';

const router = Router();

// GET /api/employees
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const { search, jabatan } = req.query;
    const data = await employeeService.getAll({
      search: search as string,
      jabatan: jabatan as string,
    });
    res.json(apiResponse(data));
  })
);

// GET /api/employees/:id
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'finance'),
  asyncHandler(async (req, res) => {
    const data = await employeeService.getById(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json(apiResponse(data));
  })
);

// POST /api/employees
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await employeeService.create(req.body);
    res.status(201).json(apiResponse(data, 'Employee created'));
  })
);

// PUT /api/employees/:id
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await employeeService.update(Number(req.params.id), req.body);
    if (!data) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json(apiResponse(data, 'Employee updated'));
  })
);

// DELETE /api/employees/:id
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    try {
      const data = await employeeService.delete(Number(req.params.id));
      if (!data) {
        res.status(404).json({ success: false, message: 'Employee not found' });
        return;
      }
      res.json(apiResponse(data, 'Employee deleted'));
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Gagal menghapus karyawan' });
    }
  })
);

// PATCH /api/employees/:id/toggle-status
router.patch(
  '/:id/toggle-status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const data = await employeeService.toggleStatus(Number(req.params.id));
    if (!data) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json(apiResponse(data, `Employee ${data.status === 'Aktif' ? 'activated' : 'deactivated'}`));
  })
);

export default router;
