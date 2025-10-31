import { useState } from 'react';
import { supabase } from '../supabaseClient';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); // Hata durumunu tutmak için

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data: _data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      setMessage('Hata: ' + error.message);
      setIsError(true); // Hata oldu
    } else {
      setMessage('Kayıt başarılı! Lütfen e-postanıza gelen onay linkine tıklayın.');
      setIsError(false); // Başarılı
    }
  };

  return (
    // CSS Sınıflarını ekliyoruz
    <div className="form-container">
      <h2>Kayıt Ol</h2>
      
      {/* Mesajı sadece varsa göster ve duruma göre stil ver */}
      {message && (
        <p className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleRegister}>
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
            minLength="6"
          />
        </div>
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Kayıt Ol'}
        </button>
      </form>
    </div>
  );
}

export default Register;