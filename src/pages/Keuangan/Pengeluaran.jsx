import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, TrendingDown, X, Loader, AlertCircle, Paperclip } from 'lucide-react';
import { kategoriPengeluaran } from '../../data/mockData';
import { formatCurrency, formatShortDate, formatInputNumber, parseInputNumber } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import '../Keuangan/Keuangan.css';

export default function Pengeluaran() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ id: null, tanggal: '', kategori: kategoriPengeluaran[0], deskripsi: '', jumlah: '', vendorId: '', bukti: '' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  const openBukti = async (url) => {
    setImageError(false);
    const isPdf = url.toLowerCase().includes('.pdf');
    setPreviewData({ url: null, originalUrl: url, type: isPdf ? 'pdf' : 'img', loading: true });

    if (isPdf) {
      try {
        // Obfuscate url to bypass aggressive IDM network interception
        let fetchUrl = url;
        if (url.startsWith('http://localhost:3001/public/uploads/')) {
           const filename = url.split('/').pop();
           const b64 = btoa(filename);
           fetchUrl = `http://localhost:3001/api/upload/preview/${b64}`;
        }
        
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('Fetch failed');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewData({ url: blobUrl, originalUrl: url, type: 'pdf', loading: false });
      } catch (err) {
        setPreviewData({ url: null, originalUrl: url, type: 'pdf', loading: false, error: true });
        setImageError(true);
      }
    } else {
      setPreviewData({ url, originalUrl: url, type: 'img', loading: false });
    }
  };

  const closeBukti = () => {
    if (previewData?.url && previewData.url.startsWith('blob:')) {
       URL.revokeObjectURL(previewData.url);
    }
    setPreviewData(null);
  };

  const handleDownloadBukti = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = url.split('/').pop() || 'bukti-transaksi';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const fetchData = async () => {
    try {
      const [expRes, vendRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/vendors')
      ]);
      const expJson = await expRes.json();
      const vendJson = await vendRes.json();
      
      if (expJson.success && vendJson.success) {
        const formatted = expJson.data.map(d => ({
          ...d.expense,
          vendor: d.vendorNama || '-'
        }));
        setData(formatted);
        setVendors(vendJson.data);
      } else {
        setErrorMsg('Gagal mengambil data pengeluaran');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (p) => {
    setFormData({ 
      id: p.id, 
      tanggal: p.tanggal, 
      kategori: p.kategori, 
      deskripsi: p.deskripsi, 
      jumlah: formatInputNumber(p.jumlah),
      vendorId: p.vendorId || '',
      bukti: p.bukti || ''
    });
    setFile(null);
    setShowModal(true);
  };

  const [deleteId, setDeleteId] = useState(null);

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
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
    if (!formData.tanggal || !formData.deskripsi || !formData.jumlah) {
      return alert('Tanggal, deskripsi, dan jumlah wajib diisi');
    }
    
    setIsSubmitting(true);
    try {
      let buktiUrl = formData.bukti;
      
      if (file) {
        const fileData = new FormData();
        fileData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileData
        });
        const uploadJson = await uploadRes.json();
        
        if (uploadJson.success) {
          buktiUrl = uploadJson.data.url;
        } else {
          setIsSubmitting(false);
          return alert(uploadJson.message || 'Gagal mengunggah file bukti');
        }
      }

      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/expenses/${formData.id}` : '/api/expenses';
      
      const payload = {
        tanggal: formData.tanggal,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        jumlah: parseInputNumber(formData.jumlah),
        vendorId: formData.vendorId ? Number(formData.vendorId) : null,
        bukti: buktiUrl
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchData();
        setFormData({ id: null, tanggal: '', kategori: kategoriPengeluaran[0], deskripsi: '', jumlah: '', vendorId: '', bukti: '' });
        setFile(null);
      } else {
        alert(json.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      alert('Error saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({ id: null, tanggal: new Date().toISOString().split('T')[0], kategori: kategoriPengeluaran[0], deskripsi: '', jumlah: '', vendorId: '', bukti: '' });
    setFile(null);
    setShowModal(true);
  };

  const filtered = data.filter(p => {
    const matchSearch = p.deskripsi.toLowerCase().includes(search.toLowerCase());
    const matchKategori = !filterKategori || p.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const total = filtered.reduce((sum, p) => sum + p.jumlah, 0);

  if (loading) {
    return (
      <div className="keuangan-page page-enter" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <Loader className="spinner" size={48} style={{ stroke: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="keuangan-page page-enter">
      <h1 className="page-title">Pengeluaran</h1>

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 8, alignItems: 'center', background: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8 }}>
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      <div className="keuangan-summary" style={{ color: 'var(--accent-red)' }}>
        <TrendingDown size={18} />
        Total: {formatCurrency(total)}
      </div>

      <div className="keuangan-toolbar">
        <div className="keuangan-filters">
          <div style={{ position: 'relative', minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 36, width: '100%' }}
              placeholder="Cari transaksi..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
            <option value="">Semua Kategori</option>
            {kategoriPengeluaran.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Pengeluaran
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Vendor</th>
              <th>Jumlah</th>
              <th>Bukti</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>{formatShortDate(p.tanggal)}</td>
                <td style={{ fontWeight: 500 }}>{p.deskripsi}</td>
                <td><span className="badge badge-red">{p.kategori}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.vendor}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-red)' }}>-{formatCurrency(p.jumlah)}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                  {p.bukti ? (
                     <button className="btn btn-ghost btn-sm" onClick={() => {
                        const fileUrl = p.bukti.startsWith('/public') ? `http://localhost:3001${p.bukti}` : p.bukti;
                        openBukti(fileUrl);
                     }} style={{ color: 'var(--accent-blue)', padding: '4px 8px' }}>
                        <Paperclip size={14} style={{ marginRight: 4 }}/> Lihat
                     </button>
                  ) : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}><Edit size={14} /></button>
                    {isAdmin && (
                      <button className="btn btn-ghost btn-sm" onClick={() => confirmDelete(p.id)} style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
               <tr>
                 <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>Belum ada data pengeluaran.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.id ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input className="form-input" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}>
                    {kategoriPengeluaran.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <input className="form-input" placeholder="Deskripsi pengeluaran" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah (Rp)</label>
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="0" 
                  value={formData.jumlah} 
                  onChange={e => setFormData({...formData, jumlah: formatInputNumber(e.target.value)})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor</label>
                <select className="form-select" value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                  <option value="">-- Pilih Vendor (Opsional) --</option>
                  {vendors.map(v => (
                     <option key={v.id} value={v.id}>{v.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                 <label className="form-label">Bukti Transaksi (URL atau Upload File)</label>
                 <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                   <input
                     type="text"
                     className="form-input"
                     placeholder="Masukkan URL bukti..."
                     value={formData.bukti || ''}
                     onChange={e => setFormData({...formData, bukti: e.target.value})}
                     style={{ flex: 1 }}
                   />
                 </div>
                 <input 
                    type="file" 
                    className="form-input" 
                    accept="image/png, image/jpeg, application/pdf" 
                    ref={fileInputRef}
                    onChange={e => setFile(e.target.files[0])}
                 />
                 <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Pilih salah satu: masukkan link URL atau upload file JPG/PNG/PDF (Max 5MB)</small>
                 
                 {formData.bukti && !file && formData.bukti.startsWith('/public') && (
                    <div style={{ marginTop: 8, fontSize: 'var(--fs-sm)' }}>
                      File tersimpan: <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-blue)', padding: 0, height: 'auto', background: 'transparent', textDecoration: 'underline' }} onClick={() => openBukti(`http://localhost:3001${formData.bukti}`)}>Buka file</button>
                    </div>
                 )}
                 {formData.bukti && !file && !formData.bukti.startsWith('/public') && (
                    <div style={{ marginTop: 8, fontSize: 'var(--fs-sm)' }}>
                      URL tersimpan: <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-blue)', padding: 0, height: 'auto', background: 'transparent', textDecoration: 'underline', wordBreak: 'break-all', textAlign: 'left' }} onClick={() => openBukti(formData.bukti)}>Buka link {formData.bukti}</button>
                    </div>
                 )}
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
              <h2 style={{ color: 'var(--accent-red)' }}>Hapus Pengeluaran</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-form">
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
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

      {previewData && (
        <div className="modal-overlay" onClick={closeBukti}>
          <div className="modal-content" style={{ maxWidth: 700, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bukti Transaksi</h2>
              <button className="modal-close" onClick={closeBukti}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '0 var(--space-4) var(--space-4)' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                {previewData.loading ? (
                   <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                     <p>Menyiapkan preview...</p>
                   </div>
                ) : previewData.type === 'pdf' ? (
                  <object data={previewData.url} type="application/pdf" width="100%" height="500px" style={{ borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>
                      <AlertCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                      <p>Browser Anda tidak mendukung preview PDF langsung.</p>
                      <p style={{ fontSize: 'var(--fs-sm)' }}>Gunakan tombol Unduh atau Lihat Penuh.</p>
                    </div>
                  </object>
                ) : imageError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', padding: 'var(--space-4)', textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p>Gagal memuat gambar (file mungkin corrupt atau format salah).</p>
                    <p style={{ fontSize: 'var(--fs-sm)' }}>Silakan coba unduh file tersebut.</p>
                  </div>
                ) : (
                  <img 
                    src={previewData.url} 
                    alt="Bukti Transaksi" 
                    style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} 
                    onError={() => setImageError(true)} 
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <a href={previewData.url || previewData.originalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ textDecoration: 'none', pointerEvents: previewData.loading ? 'none' : 'auto', opacity: previewData.loading ? 0.5 : 1 }}>
                  Lihat Penuh (Tab Baru)
                </a>
                <button className="btn btn-primary" onClick={() => handleDownloadBukti(previewData.originalUrl)} disabled={previewData.loading}>
                  Unduh File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
