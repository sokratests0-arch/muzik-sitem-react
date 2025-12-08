import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsmediatags from 'jsmediatags';
import './Home.css';

function Home({ session }) {
  // === STATE'LER (Değişkenler) ===
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Form verileri
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);

  // Liste verileri
  const [tracks, setTracks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [tracksLoading, setTracksLoading] = useState(true);
  
  // Sayfalama (Opsiyonel olarak bıraktım, basitlik için tümünü çekiyoruz şimdilik)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // === VERİ ÇEKME FONKSİYONU ===
  const fetchTracks = async () => {
    setTracksLoading(true);
    
    // 'tracks' tablosundan verileri çek
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      setFetchError('Şarkılar yüklenemedi: ' + error.message);
      setTracks([]);
    } else {
      setTracks(data);
      setFetchError(null);
    }
    setTracksLoading(false);
  };

  // Sayfa açılınca verileri çek
  useEffect(() => {
    fetchTracks();
  }, []);

  // === DOSYA SEÇME VE METADATA OKUMA ===
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Otomatik doldurma için temizlik
      setTitle(''); 
      setArtist('');

      // MP3 Etiketlerini (ID3 Tags) Oku
      new jsmediatags.Reader(selectedFile)
        .read({
          onSuccess: (tag) => {
            const { title, artist } = tag.tags;
            if (title) setTitle(title);
            if (artist) setArtist(artist);
          },
          onError: (error) => {
            console.log('Metadata okunamadı (normal), manuel girilecek.', error);
          }
        });
    }
  };

  // === YÜKLEME İŞLEMİ ===
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Lütfen bir müzik dosyası seçin.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // 1. Dosya Adı Temizliği (Türkçe karakter sorunu olmasın)
      const cleanFileName = file.name
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .replace(/[^a-zA-Z0-9._-]/g, '_');

      const fileName = `${Date.now()}_${cleanFileName}`;
      const filePath = `public/${fileName}`;

      // 2. Storage'a Yükle
      const { error: uploadError } = await supabase.storage
        .from('music-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Public URL'yi Al
      const { data: { publicUrl } } = supabase.storage
        .from('music-files')
        .getPublicUrl(filePath);

      // 4. Veritabanına Kaydet
      const { error: dbError } = await supabase
        .from('tracks')
        .insert({
          title: title || cleanFileName, // Başlık boşsa dosya adını kullan
          artist: artist || 'Bilinmeyen Sanatçı',
          track_url: publicUrl,
          user_id: session.user.id,
        });

      if (dbError) throw dbError;

      // 5. Başarılı
      setMessage('✅ Müzik başarıyla yayınlandı!');
      setIsError(false);
      setTitle('');
      setArtist('');
      setFile(null);
      e.target.reset();
      fetchTracks(); // Listeyi yenile

    } catch (error) {
      setMessage('❌ Hata: ' + error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // === RENDER (GÖRÜNÜM) ===
  return (
    <div className="home-page">
      
      {/* BÖLÜM 1: Yükleme Alanı veya Karşılama */}
      {!session ? (
        // GİRİŞ YAPILMAMIŞSA: Modern Karşılama Kartı
        <div className="uploader" style={{textAlign: 'center', display: 'block'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '10px'}}>👋 Hoş Geldin!</h2>
          <p style={{color: 'var(--text-sec)', fontSize: '1.1rem'}}>
            Müzik dünyasına katılmak, kendi parçalarını yüklemek ve paylaşmak için lütfen giriş yap.
          </p>
          <div style={{marginTop: '20px', fontSize: '3rem'}}>🎧</div>
        </div>
      ) : (
        // GİRİŞ YAPILMIŞSA: Modern Yükleme Formu
        <section className="uploader">
          <h2>+ Yeni Parça Ekle</h2>
          
          {/* Durum Mesajı */}
          {message && (
            <div style={{
              width: '100%', 
              padding: '10px', 
              marginBottom: '15px', 
              borderRadius: '8px', 
              background: isError ? 'rgba(255, 77, 77, 0.1)' : 'rgba(29, 185, 84, 0.1)',
              border: `1px solid ${isError ? '#ff4d4d' : '#1db954'}`,
              color: isError ? '#ff4d4d' : '#1db954'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpload} style={{display:'flex', width:'100%', gap:'20px', flexWrap:'wrap'}}>
            
            <div className="input-group">
              <label>Şarkı Adı</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="Örn: Yıldızların Altında"
              />
            </div>

            <div className="input-group">
              <label>Sanatçı</label>
              <input 
                type="text" 
                value={artist} 
                onChange={(e) => setArtist(e.target.value)} 
                required 
                placeholder="Örn: Kargo"
              />
            </div>

            <div className="input-group" style={{flexBasis: '100%'}}>
              <label>
                Dosya Seçimi {file && <span style={{color: 'var(--primary)'}}> - {file.name}</span>}
              </label>
              {/* Standart dosya inputu yerine stilize edilmiş yapı */}
              <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                required
                style={{padding: '10px'}}
              />
            </div>

            <button type="submit" className="upload-btn" disabled={loading} style={{width: '100%'}}>
              {loading ? 'YÜKLENİYOR...' : 'YAYINLA 🚀'}
            </button>
          </form>
        </section>
      )}

      {/* BÖLÜM 2: Şarkı Listesi (Grid Yapısı) */}
      <section className="song-list-container" style={{marginTop: '50px'}}>
        <h2 style={{borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', color: 'var(--text-sec)'}}>
          🔥 Son Eklenenler
        </h2>

        {fetchError && <p style={{color: '#ff4d4d'}}>{fetchError}</p>}

        {tracksLoading ? (
          <div className="loading">
            <div className="spinner">💿</div>
            <p>Yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="song-grid">
              {tracks.map((track) => (
                <div key={track.id} className="song-card">
                  <div className="card-icon">🎵</div>
                  
                  <div className="song-info">
                    <h3 title={track.title}>{track.title}</h3>
                    <p title={track.artist}>{track.artist}</p>
                  </div>

                  <audio controls src={track.track_url} controlsList="nodownload">
                    Tarayıcınız desteklemiyor.
                  </audio>
                </div>
              ))}
            </div>
            
            {tracks.length === 0 && (
              <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-sec)'}}>
                <p>Henüz hiç parça yüklenmemiş. İlk sen ol!</p>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}

export default Home;