import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 
import jsmediatags from 'jsmediatags';
import SpotifySDKPlayer from './components/SpotifySDKPlayer'; // Premium Player'ı dahil ettik
import YouTubePage from './pages/YouTubePage';
import './App.css';

// --- 1. YARDIMCI BİLEŞENLER ---

const LoadingContainer = ({ children }) => (
  <div className="loading-screen">
    {children || (
      <div className="loading">
         <div className="spinner">💿</div>
         <p>Yükleniyor...</p>
      </div>
    )}
  </div>
);

const AdminRoute = ({ userRole, children }) => {
  if (userRole !== 'admin') {
    return <div style={{textAlign:'center', marginTop:'50px', color:'white'}}>Bu sayfaya erişim yetkiniz yok.</div>;
  }
  return children;
};

// --- 2. SAYFALAR ---

// GİRİŞ SAYFASI
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else navigate('/');
  };

  return (
    <div className="auth-container">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <div className="input-group"><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="input-group"><input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button type="submit" className="auth-btn">Giriş Yap</button>
      </form>
    </div>
  );
};

// KAYIT SAYFASI
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert('Kayıt başarılı! Lütfen mailinizi onaylayın.');
      navigate('/giris');
    }
  };

  return (
    <div className="auth-container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
        <div className="input-group"><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="input-group"><input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button type="submit" className="auth-btn">Kayıt Ol</button>
      </form>
    </div>
  );
};

// ADMIN SAYFASI
const Admin = () => (
  <div className="uploader">
    <h2>👑 Admin Paneli</h2>
    <p>Burada site istatistikleri ve kullanıcı yönetimi yer alacak.</p>
  </div>
);

// SPOTIFY SAYFASI (GÜNCELLENDİ: Premium Player Kullanıyor)
const SpotifyPage = () => {
  return (
    <div style={{ marginTop: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #1db954, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Spotify Premium Player
        </h1>
      </header>
      {/* Artık ayarları spotifyConfig.js'den alan gelişmiş player'ı kullanıyoruz */}
      <SpotifySDKPlayer />
    </div>
  );
};

// ANA SAYFA (HOME)
const Home = ({ session }) => {
  const [tracks, setTracks] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTracks = async () => {
    const { data } = await supabase.from('tracks').select('*').order('created_at', { ascending: false });
    if (data) setTracks(data);
  };

  useEffect(() => { fetchTracks(); }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(''); setArtist('');
      new jsmediatags.Reader(selectedFile).read({
        onSuccess: (tag) => {
          if (tag.tags.title) setTitle(tag.tags.title);
          if (tag.tags.artist) setArtist(tag.tags.artist);
        },
        onError: () => {}
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      
      const { error: uploadError } = await supabase.storage.from('music-files').upload(`public/${fileName}`, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('music-files').getPublicUrl(`public/${fileName}`);
      
      await supabase.from('tracks').insert({
        title: title || cleanName,
        artist: artist || 'Bilinmiyor',
        track_url: publicUrl, 
        user_id: session.user.id
      });
      
      alert('Müzik yüklendi!');
      fetchTracks();
      e.target.reset();
      setFile(null); setTitle(''); setArtist('');
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!session ? (
        <div className="uploader" style={{textAlign:'center'}}>
          <h2>Hoş Geldin! 👋</h2>
          <p>Müzik yüklemek ve paylaşmak için giriş yap.</p>
        </div>
      ) : (
        <div className="uploader">
          <h2>+ Yeni Parça Ekle</h2>
          <form onSubmit={handleUpload}>
            <div className="input-group"><input placeholder="Şarkı Adı" value={title} onChange={e=>setTitle(e.target.value)} required /></div>
            <div className="input-group"><input placeholder="Sanatçı" value={artist} onChange={e=>setArtist(e.target.value)} required /></div>
            <div className="input-group" style={{color:'white'}}>
               <input type="file" accept="audio/*" onChange={handleFileChange} required />
            </div>
            <button className="upload-btn" disabled={loading}>{loading ? 'Yükleniyor...' : 'Yayınla'}</button>
          </form>
        </div>
      )}

      <div className="song-list-container">
        <h2 style={{borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px'}}>🔥 Son Eklenenler</h2>
        <div className="song-grid">
          {tracks.map(t => (
            <div key={t.id} className="song-card">
              <div className="card-icon">🎵</div>
              <div className="song-info">
                <h3>{t.title}</h3>
                <p>{t.artist}</p>
              </div>
              <audio controls src={t.track_url} controlsList="nodownload"></audio>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 3. ANA UYGULAMA (APP) ---

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase bağlantısı
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session) fetchRole(session.user.id);
      setLoading(false);
    }).catch(() => setLoading(false)); // Hata olsa da yüklemeyi bitir

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if(session) fetchRole(session.user.id);
      else setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) setUserRole(data.role);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <LoadingContainer />;

  return (
    <div className="App">
      <nav className="glass-nav">
        <div className="nav-logo">🎵 Müzik Kutusu</div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-item">Ana Sayfa</Link></li>
          <li>
            <span className="nav-item nav-spotify"> 
              Spotify <span className="nav-badge">(yakında)</span>
            </span>
          </li>
          <li><Link to="/youtube" className="nav-item" style={{color: '#ff0000'}}>YouTube</Link></li>
          {!session ? (
            <>
              <li><Link to="/giris" className="nav-item">Giriş</Link></li>
              <li><Link to="/kayit" className="nav-item highlight-btn">Kayıt Ol</Link></li>
            </>
          ) : (
            <>
              {userRole === 'admin' && <li><Link to="/admin" className="nav-item" style={{color:'#ffd700'}}>Admin</Link></li>}
              <li><button onClick={handleLogout} className="nav-logout-button">Çıkış</button></li>
            </>
          )}
        </ul>
      </nav>

      <header className="App-header">
        <h1>🎵 Benim Müzik Sitem 🎵</h1>
        <p style={{color:'var(--text-sec)'}}>Kendi ritmini keşfet ve paylaş.</p>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Register />} />
          <Route path="/spotify" element={<SpotifyPage />} />
          <Route path="/youtube" element={<YouTubePage />} />
          <Route path="/admin" element={<AdminRoute userRole={userRole}><Admin /></AdminRoute>} />
          {/* Yanlış adres girilirse ana sayfaya yönlendir */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;