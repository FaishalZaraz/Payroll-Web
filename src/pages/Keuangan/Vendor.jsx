import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Store, X, Loader, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import '../Keuangan/Keuangan.css';

export default function Vendor() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, nama: '', kontak: '', kategori: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setErrorMsg(json.message || 'Gagal mengambil data vendor');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleEdit = (v) => {
    setFormData({ id: v.id, nama: v.nama, kontak: v.kontak || '', kategori: v.kategori || '' });
    setShowModal(true);
  };

  const [deleteId, setDeleteId] = useState(null);

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/vendors/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchVendors();
      } else {
        alert(json.message || 'Gagal menghapus');
      }
    } catch (err) {
      alert('Error saat menghapus');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama) return alert('Nama vendor wajib diisi');
    setIsSubmitting(true);
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/vendors/${formData.id}` : '/api/vendors';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          kontak: formData.kontak,
          kategori: formData.kategori
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchVendors();
        setFormData({ id: null, nama: '', kontak: '', kategori: '' });
      } else {
        alert(json.message || 'Gagal menyimpan vendor');
      }
    } catch (err) {
      alert('Error saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({ id: null, nama: '', kontak: '', kategori: '' });
    setShowModal(true);
  };

  const filtered = data.filter(v =>
    v.nama.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="keuangan-page page-enter" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <Loader className="spinner" size={48} style={{ stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="keuangan-page page-enter">
      <h1 className="page-title">Manajemen Vendor</h1>
      
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 8, alignItems: 'center', background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8 }}>
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      <div className="keuangan-toolbar">
        <div className="keuangan-filters">
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 36, width: '100%' }}
              placeholder="Cari vendor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Vendor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {filtered.map(v => (
          <div key={v.id} className="card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-purple-soft)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)',
                }}>
                  <Store size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.nama}</div>
                  {v.kategori && <span className="badge badge-blue" style={{ marginTop: 4 }}>{v.kategori}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(v)}><Edit size={14} /></button>
                {isAdmin && (
                  <button className="btn btn-ghost btn-sm" onClick={() => confirmDelete(v.id)} style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              <span>📞 {v.kontak || '-'}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(v.totalTransaksi || 0)}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            Belum ada data vendor.
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.id ? 'Edit Vendor' : 'Tambah Vendor'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Nama Vendor</label>
                <input 
                  className="form-input" 
                  placeholder="Nama perusahaan / individu" 
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kontak</label>
                  <input 
                    className="form-input" 
                    placeholder="No. telepon" 
                    value={formData.kontak}
                    onChange={e => setFormData({...formData, kontak: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <input 
                    className="form-input" 
                    placeholder="Misal: Properti, F&B" 
                    value={formData.kategori}
                    onChange={e => setFormData({...formData, kategori: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--accent-red)' }}>Hapus Vendor</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                Apakah Anda yakin ingin menghapus vendor ini? Data pengeluaran yang terkait akan kehilangan referensi nama vendor. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Batal</button>
                <button className="btn btn-primary" style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }} onClick={handleDelete}>
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
