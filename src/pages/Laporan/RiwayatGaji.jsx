import { useState, useEffect } from 'react';
import { formatCurrency, getMonthName, formatNumber } from '../../utils/format';
import { Eye, Loader, AlertCircle, X, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Laporan.css';

export default function RiwayatGaji() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periodDetail, setPeriodDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/payroll/history')
      .then(res => res.json())
      .then(body => {
        if (body.success) {
          setHistory(body.data);
        } else {
          setErrorMsg(body.message || 'Gagal memuat riwayat payroll');
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Terjadi kesalahan jaringan');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDetail = async (p) => {
    setSelectedPeriod(p);
    setLoadingDetail(true);
    setPeriodDetail(null);
    try {
      const res = await fetch(`/api/payroll/period/${p.id}`);
      const body = await res.json();
      if (body.success) {
        setPeriodDetail(body.data);
      } else {
        alert(body.message || 'Gagal memuat detail periode');
      }
    } catch (err) {
      alert('Terjadi kesalahan memuat detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportCSV = (detailData) => {
    if (!detailData || !detailData.period || !detailData.details) return;
    const { period, details } = detailData;
    const month = getMonthName(period.bulan);
    
    const csvRows = [];
    csvRows.push(['Rekap Transfer Gaji Karyawan', `Periode: ${month} ${period.tahun}`]);
    csvRows.push([]);
    csvRows.push(['No', 'Nama Karyawan', 'Jabatan', 'Bank', 'No. Rekening', 'Gaji Pokok', 'TunjanganTetap+Transport', 'Lembur+Bonus', 'Total Potongan', 'Net Pay (Jumlah Transfer)']);
    
    details.forEach((d, idx) => {
      const r = d.detail;
      const tunjanganDasar = r.tunjanganTetap + r.tunjanganTransport;
      const tambahan = r.lembur + r.bonus;
      
      // Karena detail bank/rekening tidak diset pada relasi ini jika tidak ada, default to '-'
      csvRows.push([
        idx + 1,
        `"${d.employeeName}"`,
        `"${d.employeeJabatan}"`,
        `"-"`, 
        `"-"`, 
        r.gajiPokok,
        tunjanganDasar,
        tambahan,
        r.totalPotongan,
        r.netPay
      ]);
    });
    
    csvRows.push([]);
    csvRows.push(['', '', '', '', '', '', '', '', 'TOTAL TRANSFER', period.totalNetPay]);

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transfer_Bank_HR_${period.tahun}_${String(period.bulan).padStart(2,'0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payroll/period/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      console.log('Delete response:', res.status, json);
      if (json.success) {
        setHistory(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(json.message || 'Gagal menghapus riwayat payroll');
      }
    } catch (err) {
      console.error('Delete fetch error:', err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="laporan-page page-enter">
      <h1 className="page-title">Riwayat Payroll</h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
          <Loader className="spinner" size={48} style={{ marginBottom: 16, stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
          <p>Memuat riwayat...</p>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={48} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Gagal Memuat Data</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '8px' }}>Belum Ada Riwayat</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Tidak ada riwayat payroll yang berhasil diproses.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Tanggal Proses</th>
                <th>Status</th>
                <th>Total Bruto</th>
                <th>Total Potongan</th>
                <th>Total Net Pay</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{getMonthName(p.bulan)} {p.tahun}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                    {new Date(p.processedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className="badge badge-green">Selesai</span>
                  </td>
                  <td>{formatCurrency(p.totalBruto)}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{formatCurrency(p.totalPotongan)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(p.totalNetPay)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDetail(p)} title="Lihat Detail">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => setDeleteTarget(p)} title="Hapus Riwayat">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPeriod && (
        <div className="modal-overlay" onClick={() => setSelectedPeriod(null)}>
          <div className="modal-content" style={{ maxWidth: 900, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ marginBottom: 4 }}>Detail Penggajian</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Periode: {getMonthName(selectedPeriod.bulan)} {selectedPeriod.tahun}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedPeriod(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '0 var(--space-4) var(--space-4)' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                  <Loader className="spinner" size={32} style={{ stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : periodDetail ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <div className="card" style={{ padding: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Total Karyawan</p>
                      <h3 style={{ fontSize: 'var(--fs-lg)' }}>{formatNumber(periodDetail.details.length)} <span style={{fontSize:'var(--fs-sm)', fontWeight: 'normal'}}>Orang</span></h3>
                    </div>
                    <div className="card" style={{ padding: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Total Bruto</p>
                      <h3 style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{formatCurrency(periodDetail.period.totalBruto)}</h3>
                    </div>
                    <div className="card" style={{ padding: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Total Potongan</p>
                      <h3 style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent-red)' }}>{formatCurrency(periodDetail.period.totalPotongan)}</h3>
                    </div>
                    <div className="card" style={{ padding: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>Total Net Pay (Transfer)</p>
                      <h3 style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent-green)' }}>{formatCurrency(periodDetail.period.totalNetPay)}</h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--fs-md)' }}>Rincian per Karyawan</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => handleExportCSV(periodDetail)}>
                       <Download size={14} style={{ marginRight: 4 }}/> Export CSV (Bank Transfer)
                    </button>
                  </div>

                  <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table className="table">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                        <tr>
                          <th>Nama Karyawan</th>
                          <th>Posisi</th>
                          <th>Bruto</th>
                          <th>Potongan</th>
                          <th>Net Pay</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodDetail.details.map(d => (
                          <tr key={d.detail.id}>
                            <td style={{ fontWeight: 600 }}>{d.employeeName}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{d.employeeJabatan}</td>
                            <td>{formatCurrency(d.detail.bruto)}</td>
                            <td style={{ color: 'var(--accent-red)' }}>{formatCurrency(d.detail.totalPotongan)}</td>
                            <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(d.detail.netPay)}</td>
                            <td>
                              <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/slip-gaji?employeeId=${d.detail.employeeId}&bulan=${selectedPeriod.bulan}&tahun=${selectedPeriod.tahun}`, '_blank')} style={{ color: 'var(--accent-blue)' }}>
                                Print Slip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>Detail tidak tersedia</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="var(--accent-red)" /> Hapus Riwayat
              </h2>
              <button className="modal-close" onClick={() => !deleting && setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)' }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                Apakah Anda yakin ingin menghapus riwayat payroll periode:
              </p>
              <div style={{ 
                background: 'var(--bg-hover)', 
                padding: 'var(--space-3) var(--space-4)', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-md)' }}>{getMonthName(deleteTarget.bulan)} {deleteTarget.tahun}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Diproses pada {new Date(deleteTarget.processedAt).toLocaleDateString('id-ID')}</div>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-red)', marginBottom: 'var(--space-4)' }}>
                ⚠️ Tindakan ini akan menghapus semua rincian gaji karyawan dan catatan pengeluaran terkait pada periode ini.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
                <button 
                  className="btn" 
                  style={{ background: 'var(--accent-red)', color: '#fff' }} 
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus Riwayat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
