import { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { pemasukanData, pengeluaranData } from '../../data/mockData';
import { formatCurrency, getMonthName } from '../../utils/format';
import './Laporan.css';

export default function LabaRugi() {
  const [periode, setPeriode] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [tahunStr, bulanStr] = periode.split('-');
  const bulan = parseInt(bulanStr, 10);
  const tahun = parseInt(tahunStr, 10);
  const monthStr = periode;

  const pemasukanBulan = pemasukanData.filter(p => p.tanggal.startsWith(monthStr));
  const pengeluaranBulan = pengeluaranData.filter(p => p.tanggal.startsWith(monthStr));

  const totalPemasukan = pemasukanBulan.reduce((s, p) => s + p.jumlah, 0);
  const totalPengeluaran = pengeluaranBulan.reduce((s, p) => s + p.jumlah, 0);
  const labaRugi = totalPemasukan - totalPengeluaran;

  // Group by kategori
  const groupBy = (data) => {
    const group = {};
    data.forEach(item => {
      if (!group[item.kategori]) group[item.kategori] = 0;
      group[item.kategori] += item.jumlah;
    });
    return Object.entries(group);
  };

  const pemasukanGrouped = groupBy(pemasukanBulan);
  const pengeluaranGrouped = groupBy(pengeluaranBulan);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(['Laporan Laba Rugi', `Periode: ${getMonthName(bulan)} ${tahun}`]);
    csvRows.push([]);
    csvRows.push(['Keterangan', 'Jumlah']);
    
    csvRows.push(['PEMASUKAN', '']);
    pemasukanGrouped.forEach(([kat, jumlah]) => {
      csvRows.push([kat, jumlah]);
    });
    csvRows.push(['Total Pemasukan', totalPemasukan]);
    
    csvRows.push([]);
    csvRows.push(['PENGELUARAN', '']);
    pengeluaranGrouped.forEach(([kat, jumlah]) => {
      csvRows.push([kat, jumlah]);
    });
    csvRows.push(['Total Pengeluaran', totalPengeluaran]);
    
    csvRows.push([]);
    csvRows.push([labaRugi >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH', Math.abs(labaRugi)]);

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laba_Rugi_${tahun}_${String(bulan).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="laporan-page page-enter">
      <h1 className="page-title">Laporan Laba Rugi</h1>

      <div className="laporan-toolbar">
        <div className="laporan-filters">
          <input 
            type="month" 
            className="form-input" 
            value={periode} 
            onChange={e => setPeriode(e.target.value)} 
            style={{ width: 'auto'}}
          />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={handleExportPDF}>
            <Download size={16} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card-static">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <BarChart3 size={20} color="var(--accent-blue)" />
            <h2 style={{ fontSize: 'var(--fs-lg)' }}>Laporan Laba Rugi</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
            Periode: {getMonthName(bulan)} {tahun}
          </p>
        </div>

        <div className="table-container">
          <table className="table laporan-table">
            <thead>
              <tr>
                <th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {/* Pemasukan */}
              <tr className="row-header">
                <td>PEMASUKAN</td>
                <td></td>
              </tr>
              {pemasukanGrouped.map(([kat, jumlah]) => (
                <tr key={kat}>
                  <td className="indent">{kat}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>{formatCurrency(jumlah)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <td style={{ paddingLeft: 'var(--space-4)' }}>Total Pemasukan</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(totalPemasukan)}</td>
              </tr>

              {/* Pengeluaran */}
              <tr className="row-header">
                <td>PENGELUARAN</td>
                <td></td>
              </tr>
              {pengeluaranGrouped.map(([kat, jumlah]) => (
                <tr key={kat}>
                  <td className="indent">{kat}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-red)' }}>{formatCurrency(jumlah)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <td style={{ paddingLeft: 'var(--space-4)' }}>Total Pengeluaran</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)' }}>{formatCurrency(totalPengeluaran)}</td>
              </tr>

              {/* Laba/Rugi */}
              <tr className="row-total">
                <td>{labaRugi >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}</td>
                <td style={{ textAlign: 'right', color: labaRugi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {formatCurrency(Math.abs(labaRugi))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
