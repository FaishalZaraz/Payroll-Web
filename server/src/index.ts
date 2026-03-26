import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import incomeRoutes from './routes/income.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'PayrollPro API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Static files (for uploads)
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 PayrollPro API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
