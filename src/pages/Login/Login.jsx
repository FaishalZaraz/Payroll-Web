import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { signIn, signUp } from '../../lib/auth-client';
import './Login.css';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('karyawan');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        const { data, error } = await signUp.email({
          email,
          password,
          name: name || 'User Baru',
          role
        });
        
        if (error) {
          setErrorMsg(error.message || 'Gagal mendaftar. Silakan coba lagi.');
        } else {
          window.location.href = role === 'karyawan' ? '/slip-gaji' : '/dashboard';
        }
      } else {
        const { data, error } = await signIn.email({
          email,
          password,
        });
        
        if (error) {
          setErrorMsg(error.message || 'Email atau password salah.');
        } else {
          const userRole = data?.user?.role || 'karyawan';
          window.location.href = userRole === 'karyawan' ? '/slip-gaji' : '/dashboard';
        }
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan pada server. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (demoRole) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      // Demo credentials exactly as seeded in database
      const demoEmail = demoRole === 'admin' ? 'admin@perusahaan.com' : demoRole === 'finance' ? 'siti@perusahaan.com' : 'ahmad@perusahaan.com';
      const demoPassword = demoRole + '123';
      
      const { data, error } = await signIn.email({ email: demoEmail, password: demoPassword });
      if (error) {
        setErrorMsg('Data demo gagal login. ' + error.message);
      } else {
        window.location.href = demoRole === 'karyawan' ? '/slip-gaji' : '/dashboard';
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={28} />
          </div>
          <h1>PayrollPro</h1>
          <p>{isRegistering ? 'Daftar akun baru untuk melanjutkan' : 'Masuk ke akun Anda untuk melanjutkan'}</p>
        </div>
        
        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                className="form-input"
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={e => setName(e.target.value)}
                required={isRegistering}
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="email@perusahaan.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Role Akses</label>
              <select 
                className="form-select" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="karyawan">Karyawan</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Masuk')}
          </button>
        </form>
        
        <div className="login-forgot">
          {isRegistering ? (
            <span style={{ fontSize: 'var(--fs-sm)' }}>
              Sudah punya akun?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); setErrorMsg(''); }}>
                Masuk di sini
              </a>
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#">Lupa password?</a>
              <span style={{ fontSize: 'var(--fs-sm)' }}>
                Belum punya akun?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); setErrorMsg(''); }}>
                  Daftar sekarang
                </a>
              </span>
            </div>
          )}
        </div>
        
        {!isRegistering && (
          <div className="login-demo">
            <p>Demo login cepat:</p>
            <div className="login-demo-buttons">
              <button type="button" disabled={isLoading} className="login-demo-btn" onClick={() => handleDemo('admin')}>Admin</button>
              <button type="button" disabled={isLoading} className="login-demo-btn" onClick={() => handleDemo('finance')}>Finance</button>
              <button type="button" disabled={isLoading} className="login-demo-btn" onClick={() => handleDemo('karyawan')}>Karyawan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
