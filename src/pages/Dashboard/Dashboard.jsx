import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  ArrowUpRight, ArrowDownRight, Loader
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../../utils/format';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [cashflowMonthly, setCashflowMonthly] = useState([]);
  const [pengeluaranByKategori, setPengeluaranByKategori] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentDate = new Date();
        const bulan = currentDate.getMonth() + 1;
        const tahun = currentDate.getFullYear();
        
        const [resStats, resCashflow, resExpense, resRecent] = await Promise.all([
          fetch(`/api/dashboard/stats?bulan=${bulan}&tahun=${tahun}`).then(r => r.json()),
          fetch('/api/dashboard/cashflow').then(r => r.json()),
          fetch(`/api/dashboard/expense-distribution?bulan=${bulan}&tahun=${tahun}`).then(r => r.json()),
          fetch('/api/dashboard/recent-activities').then(r => r.json())
        ]);
        
        if (!resStats.success) throw new Error(resStats.message || 'Unauthorized');

        setStatsData(resStats.data);
        setCashflowMonthly(resCashflow.data || []);
        setPengeluaranByKategori(resExpense.data || []);
        setRecentActivities(resRecent.data || []);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data dashboard (pastikan Anda memiliki akses yang tepat).');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', color: 'var(--text-secondary)' }}>
        <Loader className="spinner" size={48} style={{ marginBottom: 16, stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
        <p>Memuat dan menghitung data Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard page-enter" style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-red)' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('id-ID', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const stats = [
    { label: 'Total Pemasukan', value: statsData.totalPemasukan, change: statsData.changePemasukan, icon: TrendingUp, color: 'green' },
    { label: 'Total Pengeluaran', value: statsData.totalPengeluaran, change: statsData.changePengeluaran, icon: TrendingDown, color: 'red' },
    { label: 'Laba Bersih', value: statsData.labaBersih, change: statsData.changeLabaBersih, icon: DollarSign, color: 'blue' },
    { label: 'Karyawan Aktif', value: statsData.totalKaryawan, change: 0, icon: Users, color: 'amber', isCount: true },
  ];

  return (
    <div className="dashboard page-enter">
      <div className="dashboard-header">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h1>
        <span className="badge badge-blue">{`${currentMonthName} ${currentYear}`}</span>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <div className={`stat-icon ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              {stat.change !== 0 && (
                <span className={`stat-change ${stat.change > 0 ? 'positive' : 'negative'}`}>
                  {stat.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(stat.change)}%
                </span>
              )}
            </div>
            <div className="stat-value">
              {stat.isCount ? stat.value : formatCurrency(stat.value)}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Tren Cashflow (6 Bulan)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashflowMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="bulan" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12}
                tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pemasukan" name="Pemasukan"
                stroke="var(--accent-green)" strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--accent-green)' }}
                activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="pengeluaran" name="Pengeluaran"
                stroke="var(--accent-red)" strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--accent-red)' }}
                activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Distribusi Pengeluaran</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pengeluaranByKategori}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pengeluaranByKategori.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 13,
                }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center' }}>
            {pengeluaranByKategori.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-card">
        <div className="activity-header">
          <h3 className="chart-card-title">Aktivitas Terbaru</h3>
          <a href="/keuangan/pemasukan" className="btn btn-ghost btn-sm">Lihat Semua</a>
        </div>
        <div className="activity-list">
          {recentActivities.map((item, index) => (
            <div key={`${item.tipe}-${item.id || index}`} className="activity-item">
              <div className="activity-info">
                <span className="activity-desc">{item.deskripsi}</span>
                <span className="activity-date">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <span className={`activity-amount ${item.tipe === 'pemasukan' ? 'income' : 'expense'}`}>
                {item.tipe === 'pemasukan' ? '+' : '-'}{formatCurrency(item.jumlah)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
