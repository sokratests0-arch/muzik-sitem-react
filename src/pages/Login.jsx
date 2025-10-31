import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // 1. Postacıyı import et

function Login() {
  const navigate = useNavigate(); // 2. Postacıyı hazırla
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      setMessage('Hata: ' + error.message);
      setIsError(true);
    } else {
      setMessage('Giriş başarılı! Hoş geldin, ' + data.user.email);
      setIsError(false);
      
      // 3. GÜNCELLEME: Giriş başarılıysa 1 saniye bekle ve anasayfaya yönlendir
      setTimeout(() => {
        navigate('/'); 
      }, 1000); // (Kullanıcı mesajı okusun diye 1sn bekletiyoruz)
    }
  };

  return (
    <div className="form-container">
      <h2>Giriş Yap</h2>
      
      {message && (
        <p className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>E-posta:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Şifre:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}

export default Login;