import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Download, UserPlus, Filter, CheckCircle2, ChevronRight, Briefcase, Mail, Phone, MapPin, CreditCard, Building2, Landmark, ShieldCheck, Wallet, FileText, Loader, Power, AlertTriangle } from 'lucide-react';
import { jabatanList } from '../../data/mockData';
import { formatCurrency, formatInputNumber, parseInputNumber } from '../../utils/format';
import './Karyawan.css';

export default function KaryawanList() {
  const [employeeList, setEmployeeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [activeTab, setActiveTab] = useState('pribadi');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const initialFormData = {
    nama: '', nik: '', email: '', phone: '', jabatan: '', tanggalMasuk: '', alamat: '',
    gajiPokok: '', tunjanganTetap: '', tunjanganTransport: '', bank: '', noRek: '',
    statusPTKP: '', npwp: '', bpjsKesehatan: '', bpjsKetenagakerjaan: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.success) setEmployeeList(json.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employeeList.filter(k => {
    const matchSearch = k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.nik.includes(search);
    const matchJabatan = !filterJabatan || k.jabatan === filterJabatan;
    return matchSearch && matchJabatan;
  });

  const handleEdit = (k) => {
    setEditData(k);
    setFormData({ 
       ...initialFormData, 
       id: k.id, // Ensure ID is passed for PUT request
       nama: k.nama,
       nik: k.nik,
       email: k.email || '',
       phone: k.phone || '',
       jabatan: k.jabatan,
       tanggalMasuk: k.tanggalMasuk ? new Date(k.tanggalMasuk).toISOString().split('T')[0] : '',
       alamat: k.alamat || '',
       gajiPokok: formatInputNumber(k.gajiPokok),
       tunjanganTetap: formatInputNumber(k.tunjanganTetap || 0),
       tunjanganTransport: formatInputNumber(k.tunjanganTransport || 0),
       bank: k.bank || '',
       noRek: k.noRek || '',
       statusPTKP: k.statusPTKP || 'TK/0',
       npwp: k.npwp || '',
       bpjsKesehatan: k.bpjsKesehatan || '',
       bpjsKetenagakerjaan: k.bpjsKetenagakerjaan || ''
    });
    setShowForm(true);
    setActiveTab('pribadi');
  };

  const handleAdd = () => {
    setEditData(null);
    setFormData(initialFormData);
    setShowForm(true);
    setActiveTab('pribadi');
  };

  const handleInputChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.nama || !formData.nik || !formData.jabatan || !formData.gajiPokok) {
       return alert('Mohon lengkapi Nama, NIK, Jabatan, dan Gaji Pokok');
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        gajiPokok: parseInputNumber(formData.gajiPokok),
        tunjanganTetap: parseInputNumber(formData.tunjanganTetap),
        tunjanganTransport: parseInputNumber(formData.tunjanganTransport)
      };
      
      const method = editData ? 'PUT' : 'POST';
      const url = editData ? `/api/employees/${editData.id}` : '/api/employees';
      
      const res = await fetch(url, {
         method,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
         setShowForm(false);
         fetchEmployees();
      } else {
         alert(json.message || 'Gagal menyimpan data karyawan');
      }
    } catch(err) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/employees/${id}/toggle-status`, { method: 'PATCH' });
      const json = await res.json();
      if (json.success) {
        setEmployeeList(prev => prev.map(k => k.id === id ? json.data : k));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDelete = (karyawan) => {
    setDeleteTarget(karyawan);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setEmployeeList(prev => prev.filter(k => k.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(json.message || 'Gagal menghapus karyawan');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setDeleting(false);
    }
  };

  if (showForm) {
    return (
      <div className="karyawan-form-page page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {editData ? 'Edit Karyawan' : 'Tambah Karyawan'}
          </h1>
        </div>

        <div className="card-static">
          <div className="form-tabs">
            <button className={`form-tab ${activeTab === 'pribadi' ? 'active' : ''}`} onClick={() => setActiveTab('pribadi')}>Data Pribadi</button>
            <button className={`form-tab ${activeTab === 'gaji' ? 'active' : ''}`} onClick={() => setActiveTab('gaji')}>Data Gaji</button>
            <button className={`form-tab ${activeTab === 'pajak' ? 'active' : ''}`} onClick={() => setActiveTab('pajak')}>Pajak & BPJS</button>
          </div>

          {activeTab === 'pribadi' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input className="form-input" value={formData.nama} onChange={e => handleInputChange(e, 'nama')} placeholder="Nama lengkap" />
              </div>
              <div className="form-group">
                <label className="form-label">NIK</label>
                <input className="form-input" value={formData.nik} onChange={e => handleInputChange(e, 'nik')} placeholder="Nomor Induk Kependudukan" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={formData.email} onChange={e => handleInputChange(e, 'email')} placeholder="email@perusahaan.com" />
              </div>
              <div className="form-group">
                <label className="form-label">No. HP</label>
                <input className="form-input" value={formData.phone} onChange={e => handleInputChange(e, 'phone')} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <select className="form-select" value={formData.jabatan} onChange={e => handleInputChange(e, 'jabatan')}>
                  <option value="">Pilih jabatan</option>
                  {jabatanList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Masuk</label>
                <input className="form-input" type="date" value={formData.tanggalMasuk} onChange={e => handleInputChange(e, 'tanggalMasuk')} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Alamat</label>
                <input className="form-input" value={formData.alamat} onChange={e => handleInputChange(e, 'alamat')} placeholder="Alamat lengkap" />
              </div>
            </div>
          )}

          {activeTab === 'gaji' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Gaji Pokok</label>
                <input className="form-input" type="text" placeholder="0" value={formData.gajiPokok} onChange={e => setFormData({...formData, gajiPokok: formatInputNumber(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tunjangan Tetap</label>
                <input className="form-input" type="text" placeholder="0" value={formData.tunjanganTetap} onChange={e => setFormData({...formData, tunjanganTetap: formatInputNumber(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tunjangan Transport</label>
                <input className="form-input" type="text" placeholder="0" value={formData.tunjanganTransport} onChange={e => setFormData({...formData, tunjanganTransport: formatInputNumber(e.target.value)})} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank</label>
                <select className="form-select" value={formData.bank} onChange={e => handleInputChange(e, 'bank')}>
                  <option value="">Pilih bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">No. Rekening</label>
                <input className="form-input" value={formData.noRek} onChange={e => handleInputChange(e, 'noRek')} placeholder="Nomor rekening" />
              </div>
            </div>
          )}

          {activeTab === 'pajak' && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Status PTKP</label>
                <select className="form-select" value={formData.statusPTKP} onChange={e => handleInputChange(e, 'statusPTKP')}>
                  <option value="">Pilih status</option>
                  {['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">NPWP</label>
                <input className="form-input" value={formData.npwp} onChange={e => handleInputChange(e, 'npwp')} placeholder="XX.XXX.XXX.X-XXX.XXX" />
              </div>
              <div className="form-group">
                <label className="form-label">No. BPJS Kesehatan</label>
                <input className="form-input" value={formData.bpjsKesehatan} onChange={e => handleInputChange(e, 'bpjsKesehatan')} placeholder="Nomor BPJS Kesehatan" />
              </div>
              <div className="form-group">
                <label className="form-label">No. BPJS Ketenagakerjaan</label>
                <input className="form-input" value={formData.bpjsKetenagakerjaan} onChange={e => handleInputChange(e, 'bpjsKetenagakerjaan')} placeholder="Nomor BPJS TK" />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={isSubmitting}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : (editData ? 'Simpan Perubahan' : 'Tambah Karyawan')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="karyawan-page page-enter" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <Loader className="spinner" size={48} style={{ stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="karyawan-page page-enter">
      <h1 className="page-title">Manajemen Karyawan</h1>

      <div className="karyawan-toolbar">
        <div className="karyawan-filters">
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36, width: '100%' }}
              placeholder="Cari nama atau NIK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)}>
            <option value="">Semua Jabatan</option>
            {jabatanList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className="karyawan-actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={18} /> Tambah Karyawan
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>NIK</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>Gaji Pokok</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => (
              <tr key={k.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: k.status === 'Aktif'
                        ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                        : 'var(--bg-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: k.status === 'Aktif' ? '#fff' : 'var(--text-muted)', flexShrink: 0,
                      opacity: k.status === 'Aktif' ? 1 : 0.6,
                    }}>
                      {k.nama.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ opacity: k.status === 'Aktif' ? 1 : 0.5 }}>
                      <div style={{ fontWeight: 500 }}>{k.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)', opacity: k.status === 'Aktif' ? 1 : 0.5 }}>{k.nik}</td>
                <td style={{ opacity: k.status === 'Aktif' ? 1 : 0.5 }}>{k.jabatan}</td>
                <td>
                  <span className={`badge ${k.status === 'Aktif' ? 'badge-green' : 'badge-red'}`}>
                    {k.status}
                  </span>
                </td>
                <td style={{ fontWeight: 600, opacity: k.status === 'Aktif' ? 1 : 0.5 }}>{formatCurrency(k.gajiPokok)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleToggleStatus(k.id)} 
                      title={k.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <Power size={14} color={k.status === 'Aktif' ? 'var(--text-muted)' : 'var(--accent-green)'} />
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(k)} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Hapus" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(k)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="var(--accent-red)" /> Hapus Karyawan
              </h2>
              <button className="modal-close" onClick={() => !deleting && setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)' }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                Apakah Anda yakin ingin menghapus karyawan:
              </p>
              <div style={{ 
                background: 'var(--bg-hover)', 
                padding: 'var(--space-3) var(--space-4)', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-md)' }}>{deleteTarget.nama}</div>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{deleteTarget.jabatan} — {deleteTarget.nik}</div>
              </div>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent-red)', marginBottom: 'var(--space-4)' }}>
                ⚠️ Tindakan ini tidak dapat dibatalkan. Semua data gaji terkait karyawan ini juga akan dihapus.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Batal</button>
                <button 
                  className="btn" 
                  style={{ background: 'var(--accent-red)', color: '#fff' }} 
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
