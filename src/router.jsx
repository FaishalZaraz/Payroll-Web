import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import KaryawanList from './pages/Karyawan/KaryawanList';
import Payroll from './pages/Payroll/Payroll';
import Pemasukan from './pages/Keuangan/Pemasukan';
import Pengeluaran from './pages/Keuangan/Pengeluaran';
import Vendor from './pages/Keuangan/Vendor';
import LabaRugi from './pages/Laporan/LabaRugi';
import RiwayatGaji from './pages/Laporan/RiwayatGaji';
import SlipGaji from './pages/SlipGaji/SlipGaji';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'karyawan', element: <KaryawanList /> },
      { path: 'payroll', element: <Payroll /> },
      { path: 'keuangan/pemasukan', element: <Pemasukan /> },
      { path: 'keuangan/pengeluaran', element: <Pengeluaran /> },
      { path: 'keuangan/vendor', element: <Vendor /> },
      { path: 'laporan/laba-rugi', element: <LabaRugi /> },
      { path: 'laporan/riwayat-gaji', element: <RiwayatGaji /> },
      { path: 'slip-gaji', element: <SlipGaji /> },
    ],
  },
]);

export default router;
