import { useState, useEffect } from 'react';
import { Download, Loader, AlertCircle } from 'lucide-react';
import { formatCurrency, getMonthName } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import '../Laporan/Laporan.css';

export default function SlipGaji() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  const [periode, setPeriode] = useState('2026-03');
  const [selectedId, setSelectedId] = useState('');
  
  const [employees, setEmployees] = useState([]);
  const [slipData, setSlipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tahun = parseInt(periode.split('-')[0]) || 2026;
  const bulan = parseInt(periode.split('-')[1]) || 3;

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/employees')
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            const active = res.data.filter(k => k.status === 'Aktif');
            setEmployees(active);
            if (active.length > 0 && !selectedId) {
              setSelectedId(active[0].id);
            }
          }
        })
        .catch(err => console.error(err));
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchSlip = async () => {
      // Admin needs to select an employee first
      if (isAdmin && !selectedId) return;
      
      setLoading(true);
      setErrorMsg('');
      setSlipData(null);
      
      try {
        const url = isAdmin 
          ? `/api/payroll/slip?employeeId=${selectedId}&bulan=${bulan}&tahun=${tahun}`
          : `/api/payroll/slip?bulan=${bulan}&tahun=${tahun}`;
          
        const res = await fetch(url);
        const body = await res.json();
        
        if (res.ok && body.success) {
          setSlipData(body.data);
        } else {
          setErrorMsg(body.message || 'Gagal memuat slip gaji');
        }
      } catch (err) {
        setErrorMsg('Terjadi kesalahan jaringan rpc');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlip();
  }, [periode, selectedId, isAdmin, bulan, tahun]);

  const handlePrint = () => {
    if (!slipData) return;
    const originalTitle = document.title;
    const month = getMonthName(bulan);
    const employeeName = slipData.employee.nama.replace(/\s+/g, '_');
    
    document.title = `Slip_Gaji_${employeeName}_${month}_${tahun}`;
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="slip-page page-enter">
      <h1 className="page-title">{isAdmin ? 'Slip Gaji' : 'Slip Gaji Saya'}</h1>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {isAdmin && (
          <div className="form-group" style={{ minWidth: 220 }}>
            <label className="form-label">Karyawan</label>
            <select className="form-select" value={selectedId} onChange={e => setSelectedId(+e.target.value)}>
              {employees.map(k => (
                <option key={k.id} value={k.id}>{k.nama} — {k.jabatan}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="form-label">Periode</label>
          <input 
            type="month" 
            className="form-input" 
            value={periode} 
            onChange={e => setPeriode(e.target.value)} 
          />
        </div>
        <button className="btn btn-primary btn-print-hide" disabled={!slipData} onClick={handlePrint}>
          <Download size={16} /> Download PDF
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
          <Loader className="spinner" size={48} style={{ marginBottom: 16, stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
          <p>Memuat slip gaji...</p>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
          <AlertCircle size={48} color="var(--accent-red)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ marginBottom: '8px', fontSize: 'var(--fs-lg)' }}>Slip Gaji Belum Tersedia</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
        </div>
      ) : slipData ? (
        <div className="slip-preview">
          <div className="slip-header">
            <h2>PT. PERUSAHAAN CONTOH</h2>
            <p>Jl. Sudirman No. 1, Jakarta Pusat 10220</p>
            <p style={{ marginTop: 12, fontWeight: 600, fontSize: 'var(--fs-md)', color: '#1a1a2e' }}>
              SLIP GAJI — {getMonthName(bulan).toUpperCase()} {tahun}
            </p>
          </div>

          <div className="slip-info-grid">
            <div>
              <span className="label">Nama Karyawan:</span>{' '}
              <span className="value">{slipData.employee.nama}</span>
            </div>
            <div>
              <span className="label">Jabatan:</span>{' '}
              <span className="value">{slipData.employee.jabatan}</span>
            </div>
            <div>
              <span className="label">NIK:</span>{' '}
              <span className="value">{slipData.employee.nik}</span>
            </div>
            <div>
              <span className="label">Status PTKP:</span>{' '}
              <span className="value">{slipData.employee.statusPTKP}</span>
            </div>
            <div>
              <span className="label">Bank / Rekening:</span>{' '}
              <span className="value">{slipData.employee.bank || '-'} — {slipData.employee.noRek || '-'}</span>
            </div>
            <div>
              <span className="label">Tanggal Masuk:</span>{' '}
              <span className="value">{new Date(slipData.employee.tanggalMasuk).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          <table className="slip-table">
            <thead>
              <tr>
                <th>Pendapatan</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gaji Pokok</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.gajiPokok)}</td>
              </tr>
              <tr>
                <td>Tunjangan Tetap</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.tunjanganTetap)}</td>
              </tr>
              <tr>
                <td>Tunjangan Transport</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.tunjanganTransport)}</td>
              </tr>
              {slipData.lembur > 0 && (
                <tr>
                  <td>Lembur</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.lembur)}</td>
                </tr>
              )}
              {slipData.bonus > 0 && (
                <tr>
                  <td>Bonus</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.bonus)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 600 }}>
                <td>Total Pendapatan</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.bruto)}</td>
              </tr>
            </tbody>
          </table>

          <table className="slip-table">
            <thead>
              <tr>
                <th>Potongan</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>BPJS Kesehatan (1%)</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.bpjsKesehatan)}</td>
              </tr>
              <tr>
                <td>BPJS Ketenagakerjaan (2%)</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.bpjsKetenagakerjaan)}</td>
              </tr>
              <tr>
                <td>PPh 21</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.pph21)}</td>
              </tr>
              {slipData.potonganKhusus > 0 && (
                <tr>
                  <td>Potongan Khusus / Lain-lain</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(slipData.potonganKhusus)}</td>
                </tr>
              )}
              <tr style={{ fontWeight: 600 }}>
                <td>Total Potongan</td>
                <td style={{ textAlign: 'right', color: '#c0392b' }}>{formatCurrency(slipData.totalPotongan)}</td>
              </tr>
            </tbody>
          </table>

          <table className="slip-table">
            <tbody>
              <tr className="total-row">
                <td>GAJI BERSIH (Take Home Pay)</td>
                <td style={{ textAlign: 'right', color: '#27ae60' }}>{formatCurrency(slipData.netPay)}</td>
              </tr>
            </tbody>
          </table>

          <div className="slip-footer">
            <div>
              <p>Diterbitkan secara otomatis oleh sistem PayrollPro</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>Jakarta, {new Date().toLocaleDateString('id-ID')}</p>
              <p style={{ marginTop: 32, fontWeight: 600, color: '#333' }}>HRD Manager</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
