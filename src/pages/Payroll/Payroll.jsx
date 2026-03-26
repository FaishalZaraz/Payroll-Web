import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, FileText, Loader } from 'lucide-react';
import { formatCurrency, getMonthName } from '../../utils/format';
import { useToast } from '../../context/ToastContext';
import './Payroll.css';

const steps = ['Pilih Periode', 'Input Variabel', 'Review & Konfirmasi', 'Selesai'];

export default function Payroll() {
  const [currentStep, setCurrentStep] = useState(0);
  const [periode, setPeriode] = useState('2026-03');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const tahun = parseInt(periode.split('-')[0]) || 2026;
  const bulan = parseInt(periode.split('-')[1]) || 3;

  const [activeEmployees, setActiveEmployees] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          const active = res.data.filter(k => k.status === 'Aktif');
          setActiveEmployees(active);
          setVariables(active.map(k => ({ employeeId: k.id, lembur: 0, bonus: 0, potonganKhusus: 0 })));
        } else {
          setError(res.message);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateVar = (id, field, value) => {
    setVariables(prev => prev.map(v =>
      v.employeeId === id ? { ...v, [field]: parseInt(value) || 0 } : v
    ));
  };

  const calculatePayroll = (karyawan) => {
    const v = variables.find(v => v.employeeId === karyawan.id) || { lembur: 0, bonus: 0, potonganKhusus: 0 };
    const gajiPokok = karyawan.gajiPokok;
    const tunjangan = karyawan.tunjanganTetap + karyawan.tunjanganTransport;
    const lemburNominal = v.lembur * 50000;
    const bruto = gajiPokok + tunjangan + lemburNominal + v.bonus;
    const bpjsKes = Math.round(gajiPokok * 0.01);
    const bpjsTK = Math.round(gajiPokok * 0.02);
    const pph21 = Math.round(bruto * 0.05);
    const totalPotongan = bpjsKes + bpjsTK + pph21 + v.potonganKhusus;
    const netPay = bruto - totalPotongan;
    return { gajiPokok, tunjangan, lemburNominal, bonus: v.bonus, bruto, bpjsKes, bpjsTK, pph21, potonganKhusus: v.potonganKhusus, totalPotongan, netPay };
  };

  const totalSummary = activeEmployees.reduce((acc, k) => {
    const p = calculatePayroll(k);
    acc.totalBruto += p.bruto;
    acc.totalPotongan += p.totalPotongan;
    acc.totalNetPay += p.netPay;
    return acc;
  }, { totalBruto: 0, totalPotongan: 0, totalNetPay: 0 });

  const handleProcess = async () => {
    setProcessLoading(true);
    try {
      const payload = {
        bulan,
        tahun,
        variables: variables.map(v => ({
          employeeId: v.employeeId,
          lembur: v.lembur,
          bonus: v.bonus,
          potonganKhusus: v.potonganKhusus
        }))
      };

      const res = await fetch('/api/payroll/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setCurrentStep(3);
        addToast(`Payroll ${getMonthName(bulan)} ${tahun} berhasil diproses!`, 'success');
      } else {
        addToast(`Gagal memproses: ${res.message}`, 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Terjadi kesalahan saat memproses payroll', 'error');
    } finally {
      setProcessLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="payroll-page page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader className="spinner" size={48} style={{ marginBottom: 16, stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
        <p>Memuat data karyawan aktif...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payroll-page page-enter">
        <h2 style={{ color: 'var(--accent-red)' }}>Error Memuat Karyawan</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="payroll-page page-enter">
      <h1 className="page-title">Siklus Penggajian</h1>

      {/* Wizard Steps */}
      <div className="wizard-steps">
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}>
              <div className="wizard-step-num">
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              <span className="wizard-step-label">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`wizard-connector ${i < currentStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card-static">
        {/* Step 1: Pilih Periode */}
        {currentStep === 0 && (
          <div>
            <h3 className="section-title">Pilih Periode Penggajian</h3>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div className="form-group" style={{ flex: 1, maxWidth: 250 }}>
                <label className="form-label">Periode</label>
                <input 
                  type="month" 
                  className="form-input" 
                  value={periode} 
                  onChange={e => setPeriode(e.target.value)} 
                />
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
              Karyawan aktif yang akan diproses: <strong>{activeEmployees.length} orang</strong>
            </p>
          </div>
        )}

        {/* Step 2: Input Variabel */}
        {currentStep === 1 && (
          <div>
            <h3 className="section-title">Input Variabel Bulanan — {getMonthName(bulan)} {tahun}</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Karyawan</th>
                    <th>Jabatan</th>
                    <th>Lembur (jam)</th>
                    <th>Bonus (Rp)</th>
                    <th>Potongan Khusus (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map(k => {
                    const v = variables.find(x => x.employeeId === k.id);
                    return (
                      <tr key={k.id}>
                        <td style={{ fontWeight: 500 }}>{k.nama}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{k.jabatan}</td>
                        <td>
                          <input className="inline-input" type="number" min="0"
                            value={v?.lembur || 0}
                            onChange={e => updateVar(k.id, 'lembur', e.target.value)} />
                        </td>
                        <td>
                          <input className="inline-input" type="number" min="0"
                            value={v?.bonus || 0}
                            onChange={e => updateVar(k.id, 'bonus', e.target.value)} />
                        </td>
                        <td>
                          <input className="inline-input" type="number" min="0"
                            value={v?.potonganKhusus || 0}
                            onChange={e => updateVar(k.id, 'potonganKhusus', e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 2 && (
          <div>
            <h3 className="section-title">Review Penggajian — {getMonthName(bulan)} {tahun}</h3>
            <div className="payroll-summary-row">
              <div className="payroll-summary-item">
                <div className="label">Karyawan</div>
                <div className="value" style={{ color: 'var(--accent-blue)' }}>{activeEmployees.length}</div>
              </div>
              <div className="payroll-summary-item">
                <div className="label">Total Bruto</div>
                <div className="value">{formatCurrency(totalSummary.totalBruto)}</div>
              </div>
              <div className="payroll-summary-item">
                <div className="label">Total Potongan</div>
                <div className="value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(totalSummary.totalPotongan)}</div>
              </div>
              <div className="payroll-summary-item">
                <div className="label">Total Net Pay</div>
                <div className="value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(totalSummary.totalNetPay)}</div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Gaji Pokok</th>
                    <th>Tunjangan</th>
                    <th>Lembur</th>
                    <th>Bonus</th>
                    <th>Potongan</th>
                    <th>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map(k => {
                    const p = calculatePayroll(k);
                    return (
                      <tr key={k.id}>
                        <td style={{ fontWeight: 500 }}>{k.nama}</td>
                        <td>{formatCurrency(p.gajiPokok)}</td>
                        <td>{formatCurrency(p.tunjangan)}</td>
                        <td>{formatCurrency(p.lemburNominal)}</td>
                        <td>{formatCurrency(p.bonus)}</td>
                        <td style={{ color: 'var(--accent-red)' }}>{formatCurrency(p.totalPotongan)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(p.netPay)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 4: Selesai */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10) 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-green-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)',
            }}>
              <Check size={32} color="var(--accent-green)" />
            </div>
            <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-2)' }}>Payroll Berhasil Diproses!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Gaji {getMonthName(bulan)} {tahun} telah diproses untuk {activeEmployees.length} karyawan.<br />
              Total pengeluaran gaji sebesar <strong>{formatCurrency(totalSummary.totalNetPay)}</strong> telah tercatat pada database.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setCurrentStep(0)}>
                Proses Ulang
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/slip-gaji')}>
                <FileText size={16} /> Lihat Slip Gaji
              </button>
            </div>
          </div>
        )}

        {/* Wizard Actions */}
        {currentStep < 3 && (
          <div className="wizard-actions">
            <button className="btn btn-ghost" disabled={currentStep === 0 || processLoading}
              onClick={() => setCurrentStep(prev => prev - 1)}>
              <ChevronLeft size={16} /> Kembali
            </button>
            {currentStep < 2 ? (
              <button className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleProcess} disabled={processLoading}>
                {processLoading ? <Loader className="spinner" size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                {processLoading ? ' Memproses...' : ' Proses Gaji'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
