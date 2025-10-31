import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import jsmediatags from "jsmediatags";
function Home({ session }) {
  // Yükleme Formu State'leri
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [readingTags, setReadingTags] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  // Şarkı Listesi State'leri
  const [tracks, setTracks] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [tracksLoading, setTracksLoading] = useState(true);

  // Veritabanından şarkıları çeken fonksiyon (Değişiklik yok)
  const fetchTracks = async () => {
    setTracksLoading(true);
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setFetchError('Şarkılar yüklenemedi: ' + error.message);
      setTracks([]);
    } else {
      setTracks(data);
      setFetchError(null);
    }
    setTracksLoading(false);
  };

  // Sayfa yüklendiğinde şarkıları çek (Değişiklik yok)
  useEffect(() => {
    fetchTracks();
  }, []);

  // Müzik yükleme fonksiyonu (Değişiklik yok)
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
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `public/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('music-files').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('music-files').getPublicUrl(filePath);
      if (!publicUrl) throw new Error('Dosya URLsi alınamadı.');
  const insertPayload = { title: title, artist: artist, track_url: publicUrl, user_id: session.user.id };
  if (coverUrl) insertPayload.cover_url = coverUrl;
  const { error: dbError } = await supabase.from('tracks').insert(insertPayload);
      if (dbError) throw dbError;
      setMessage('Müzik başarıyla yüklendi!');
      setIsError(false);
      setTitle('');
      setArtist('');
      setFile(null);
  setCoverUrl('');
      e.target.reset();
      fetchTracks();
    } catch (error) {
      setMessage('Hata: ' + error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // === 2. GÜNCELLENEN FONKSİYON BURASI ===
  // Dosya seçildiğinde etiketleri okur
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      // 1. Önce dosyayı hafızaya al (yükleme için)
      setFile(selectedFile);

      // 2. Formu temizle ki eski bilgide kalmasın
      setTitle('');
      setArtist('');

      // 3. Şimdi etiketleri okumayı dene
      // Kullanıcıyı bilgilendirelim
  setMessage('Etiketler okunuyor...');
  setReadingTags(true);
      setIsError(false);

      const tryFillFromTags = (tags) => {
        // jsmediatags genelde { title, artist } döner; ancak bazen farklı frame'ler de bulunur.
        const candidates = {};
        if (!tags) return candidates;
        // Yaygın alanlar
        candidates.title = tags.title || tags.TIT2 || tags.TITL || tags['\u007Fname'] || '';
        candidates.artist = tags.artist || tags.TPE1 || tags.TPE2 || tags['\u007Fartist'] || '';
        // Temizle
        if (candidates.title) candidates.title = String(candidates.title).trim();
        if (candidates.artist) candidates.artist = String(candidates.artist).trim();
        return candidates;
      };

      const parseFilenameFallback = (fileObj) => {
        // Dosya adı örnekleri: "Artist - Title.mp3", "Title - Artist.mp3", "Title.mp3"
        try {
          const name = fileObj.name.replace(/\.[^/.]+$/, ''); // uzantıyı kaldır
          // "Artist - Title" kalıbı
          const dashParts = name.split(' - ');
          if (dashParts.length >= 2) {
            const maybeArtist = dashParts[0].trim();
            const maybeTitle = dashParts.slice(1).join(' - ').trim();
            return { title: maybeTitle, artist: maybeArtist };
          }
          // "Title (Artist)" veya "Title [Artist]"
          const parenMatch = name.match(/^(.+?)\s*\((.+)\)$/) || name.match(/^(.+?)\s*\[(.+)\]$/);
          if (parenMatch) {
            const title = parenMatch[1];
            const artist = parenMatch[2];
            return { title: title.trim(), artist: artist.trim() };
          }
          // Tek parça -> başlık olarak al
          return { title: name.trim(), artist: '' };
        } catch {
          return { title: '', artist: '' };
        }
      };

      new jsmediatags.Reader(selectedFile).read({
        onSuccess: (tag) => {
          console.log('Bulunan Etiketler:', tag.tags);
          const found = tryFillFromTags(tag.tags);
          // Kapak varsa hemen upload etmeye çalış
          if (tag.tags && tag.tags.picture) {
            (async () => {
              try {
                setCoverUploading(true);
                setMessage('Kapak işleniyor...');
                const picture = tag.tags.picture;
                const byteArray = new Uint8Array(picture.data);
                const blob = new Blob([byteArray], { type: picture.format || 'image/jpeg' });
                const safeName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
                const ext = (picture.format && picture.format.split('/')[1]) || 'jpg';
                const coverPath = `covers/${Date.now()}_${safeName}_cover.${ext}`;
                const { error: uploadErr } = await supabase.storage.from('covers').upload(coverPath, blob, { upsert: true, contentType: picture.format });
                if (uploadErr) {
                  console.error('Kapak upload hatası:', uploadErr);
                  setMessage('Kapak yüklenemedi.');
                } else {
                  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(coverPath);
                  setCoverUrl(publicUrl);
                  setMessage('Kapak yüklendi ve önizleme ayarlandı.');
                }
              } catch (err) {
                console.error('Kapak işleme hatası:', err);
                setMessage('Kapak işlenemedi.');
              } finally {
                setCoverUploading(false);
              }
            })();
          }
          
          // Eğer hem title hem artist yoksa filename'dan dene
          if (!found.title && !found.artist) {
            const f = parseFilenameFallback(selectedFile);
            if (f.title) setTitle(f.title);
            if (f.artist) setArtist(f.artist);
            setMessage('Etiket bulunamadı, dosya adından dolduruldu.');
            setReadingTags(false);
            return;
          }

          // Öncellenmiş bilgileri uygula (boşsa filename fallback)
          if (found.title) setTitle(found.title);
          if (found.artist) setArtist(found.artist);
          // Eksik olanı filename ile tamamla
          const fallback = parseFilenameFallback(selectedFile);
          if (!found.title && fallback.title) setTitle(fallback.title);
          if (!found.artist && fallback.artist) setArtist(fallback.artist);
          setMessage('Etiketler başarıyla okundu.');
          setReadingTags(false);
        },
        onError: (error) => {
          console.error('Metadata okuma hatası:', error.type, error.info);
          const f = parseFilenameFallback(selectedFile);
          if (f.title) setTitle(f.title);
          if (f.artist) setArtist(f.artist);
          setMessage('Etiket okunamadı — dosya adından dolduruldu.');
          setIsError(false);
          setReadingTags(false);
        }
      });
    }
  };

  // Arayüz (Render) - (Değişiklik yok)
  return (
    <div>
      {/* BÖLÜM 1: Giriş Yapılmamışsa Mesaj, Yapılmışsa Yükleme Formu */}
      {!session ? (
        <div className="home-content">
          <h2>Ana Sayfa</h2>
          <p>Müzik sitemize hoş geldiniz!</p>
          <p>Müzik yüklemek veya dinlemek için lütfen giriş yapın veya kayıt olun.</p>
        </div>
      ) : (
        <div className="form-container">
          <h2>Müzik Yükle</h2>
          {message && (
            <p className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </p>
          )}
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Şarkı Adı:</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Sanatçı (Siz):</label>
              <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Müzik Dosyası (MP3, WAV):</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                required
                id="music-file-input"
                className="hidden-file-input"
              />
              <label htmlFor="music-file-input" className="form-button-secondary">
                🎵 Dosya Seç
              </label>
              <span className="file-name-display">
                {file ? file.name : "Henüz bir dosya seçilmedi..."}
              </span>
              {readingTags && (
                <span title="Etiket okunuyor" className="inline-spinner" aria-hidden="true"></span>
              )}
              {coverUploading && (
                <span title="Kapak yükleniyor" className="inline-spinner" aria-hidden="true" style={{ marginLeft: '0.5rem' }}></span>
              )}
              {coverUrl && (
                <div>
                  <img src={coverUrl} alt="Kapak önizlemesi" className="cover-preview" />
                </div>
              )}
            </div>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Şimdi Yükle'}
            </button>
          </form>
        </div>
      )}

      {/* BÖLÜM 2: Şarkı Listesi (Herkese Görünür) */}
      <div className="track-list-container">
        <h2>Son Eklenenler</h2>
        {tracksLoading && <p style={{ textAlign: 'center' }}>Müzikler yükleniyor...</p>}
        {fetchError && <p className="message error">{fetchError}</p>}
        
        {tracks && tracks.length > 0 && (
          <div className="track-list">
            {tracks.map((track) => (
              <div key={track.id} className="track-item">
                <div className="track-info">
                  <h3 className="track-title">{track.title}</h3>
                  <p className="track-artist">{track.artist}</p>
                </div>
                <audio controls src={track.track_url} className="track-player">
                  Tarayıcınız audio elementini desteklemiyor.
                </audio>
              </div>
            ))}
          </div>
        )}

        {!tracksLoading && tracks && tracks.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            Henüz hiç müzik yüklenmemiş. İlk yükleyen sen ol!
          </p>
        )}
      </div>

    </div>
  );
}

export default Home;