// 1. Gerekli kütüphaneleri import ediyoruz
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Supabase bağlantımız

// 2. Sayfalarımızı import ediyoruz
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function App() {
  // 3. Hafıza Kutusu: 'session' bilgisi burada tutulacak
  const [session, setSession] = useState(null);
  
  // 4. Postacı: Yönlendirme için
  const navigate = useNavigate();

  // 5. Görevli & Nöbetçi: Sayfa yüklendiğinde ve auth durumu değiştiğinde çalışır
  useEffect(() => {
    // 5a. Mevcut oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 5b. Giriş/Çıkış olaylarını dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session); // Hafıza kutusunu güncelle
      }
    );

    // 5c. Temizlik
    return () => subscription.unsubscribe();
  }, []); // '[]' sayesinde bu sadece bir kez çalışır

  // 6. Çıkış Yapma Fonksiyonu
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Çıkış yaparken hata:', error);
    } else {
      // Çıkış başarılıysa anasayfaya yönlendir
      navigate('/');
    }
  };

  return (
    <div className="App">
      {/* 7. AKILLI NAVİGASYON BÖLÜMÜ */}
      <nav>
        <ul>
          <li>
            <Link to="/">Ana Sayfa</Link>
          </li>
          
          {/* 'session' YOKSA (giriş yapılmamışsa) */}
          {!session ? (
            <>
              <li>
                <Link to="/giris">Giriş Yap</Link>
              </li>
              <li>
                <Link to="/kayit">Kayıt Ol</Link>
              </li>
            </>
          ) : (
            /* 'session' VARSA (giriş yapılmışsa) */
            <>
              <li>
                {/* GÜNCELLEME: Link artık anasayfaya gidiyor */}
                <Link to="/">Müzik Yükle</Link>
              </li>
              <li>
                {/* Tıklandığında çıkış yapan 'sahte' link (buton) */}
                <button onClick={handleLogout} className="nav-logout-button">
                  Çıkış Yap
                </button>
              </li>
            </>
          )}

        </ul>
      </nav>

      {/* 8. Kalan Kısımlar (Başlık ve Rotalar) */}
      <header className="App-header">
        <h1>🎵 Benim Müzik Sitem 🎵</h1>
      </header>
      
      <main>
        <Routes>
          {/* GÜNCELLEME: Home componentine 'session' bilgisini yolluyoruz */}
          <Route path="/" element={<Home session={session} />} />
          
          <Route path="/giris" element={<Login />} />
          <Route path="/kayit" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;