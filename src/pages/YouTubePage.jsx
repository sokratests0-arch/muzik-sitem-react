import React, { useState } from 'react';
import ReactPlayer from 'react-player'; 

const YouTubePage = () => {
  // === AYARLAR ===
  const API_KEY = 'AIzaSyB7KvGJU646tx4CbQoSHFpwVV-7q4e-6lk'; 
  const apiKey = 'AIzaSyB7KvGJU646tx4CbQoSHFpwVV-7q4e-6lk'; 

  // === STATE'LER ===
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  
  // Oynatıcı State'leri
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null); // Çalan şarkının detayları (Resim, Başlık)
  const [isPlaying, setIsPlaying] = useState(false); // Oynat/Duraklat kontrolü

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mood, setMood] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // === ARAMA FONKSİYONU ===
  const searchYouTube = async (searchQuery) => {
    // Direkt link kontrolü (Link yapıştırılırsa metadata olmadığı için standart player açılır)
    if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
      setSelectedVideo(searchQuery);
      setCurrentTrack(null); // Metadata yok
      setIsPlaying(true);
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${searchQuery}&type=video&key=${API_KEY}`
      );
      
      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error.message);
      }

      const data = await response.json();
      setVideos(data.items);
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (errorMsg.includes('YouTube Data API v3 has not been used')) {
        errorMsg = 'YouTube Data API henüz etkinleştirilmemiş. Google Cloud Console\'dan etkinleştirin.';
      } else if (errorMsg.includes('key not valid')) {
        errorMsg = 'YouTube API Anahtarı geçersiz.';
      }
      setError('YouTube Hatası: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query) return;
    searchYouTube(query);
  };

  // === GEMINI AI ASİSTANI ===
  const generatePlaylist = async () => {
    if (!mood) return;
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const prompt = `Bana şu ruh hali için 5 şarkı öner: "${mood}". 
      Cevabı SADECE saf bir JSON dizisi olarak ver. Örn: ["Sanatçı - Şarkı", "Sanatçı - Şarkı"].`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI servisine erişilemedi.');
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const songs = JSON.parse(cleanJson);

      setAiSuggestions(songs);
    } catch (err) {
      console.error(err);
      alert(`AI Hatası: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      
      <header className="App-header" style={{marginBottom: '30px'}}>
        <h1 style={{fontSize: '2.5rem', background: 'linear-gradient(to right, #ff0000, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          YouTube Music Stüdyo
        </h1>
      </header>

      {/* AI Asistanı */}
      <section className="uploader" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(200, 100, 255, 0.1) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginBottom: '40px'
      }}>
        <h2 style={{fontSize: '1.5rem', color: '#e0aaff', marginTop: 0}}>✨ AI Mod Asistanı</h2>
        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
          <input 
            type="text" 
            placeholder="Modun nasıl? (Örn: Yağmurlu hava...)" 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            style={{flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.3)', color: 'white'}}
          />
          <button 
            onClick={generatePlaylist}
            disabled={aiLoading}
            className="highlight-btn"
            style={{background: '#a020f0', color: 'white', minWidth: '120px', cursor: aiLoading ? 'wait' : 'pointer'}}
          >
            {aiLoading ? '...' : '✨ Öneri Al'}
          </button>
        </div>

        {aiSuggestions.length > 0 && (
          <div style={{marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            {aiSuggestions.map((song, index) => (
              <button
                key={index}
                onClick={() => { setQuery(song); searchYouTube(song); window.scrollTo({top: 400, behavior: 'smooth'}); }}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer'
                }}
              >
                🎵 {song}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* --- YENİ: MP3 TARZI OYNATICI --- */}
      {selectedVideo && (
        <div className="now-playing-glass" style={{
          position: 'sticky', top: '20px', zIndex: 100,
          background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px',
          padding: '20px', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)', marginBottom: '30px'
        }}>
          
          {/* Albüm Kapağı (Varsa) */}
          <div style={{width: '100px', height: '100px', borderRadius: '15px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}}>
            {currentTrack ? (
              <img src={currentTrack.snippet.thumbnails.medium.url} alt="Cover" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (
              <div style={{width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>🎵</div>
            )}
          </div>

          {/* Şarkı Bilgisi */}
          <div style={{flex: 1, minWidth: 0}}>
            <h3 style={{margin: '0 0 5px 0', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {currentTrack ? currentTrack.snippet.title : 'YouTube Video'}
            </h3>
            <p style={{margin: 0, color: '#aaa', fontSize: '0.9rem'}}>
              {currentTrack ? currentTrack.snippet.channelTitle : 'Oynatılıyor...'}
            </p>
          </div>

          {/* Kontroller */}
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '60px', height: '60px', borderRadius: '50%', border: 'none',
                background: '#ff0000', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255, 0, 0, 0.4)'
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* GİZLİ OYNATICI (Sadece sesi duyurmak için) */}
          <div style={{display: 'none'}}> 
            <ReactPlayer 
              url={selectedVideo}
              playing={isPlaying}
              controls={false}
              width="0"
              height="0"
              onEnded={() => setIsPlaying(false)}
              onError={(e) => console.log('Player hatası', e)}
            />
          </div>
        </div>
      )}

      {/* Arama Kutusu */}
      <div className="uploader">
        <form onSubmit={handleSearchSubmit} style={{display: 'flex', gap: '15px'}}>
          <input 
            type="text" 
            placeholder="Şarkı adı veya YouTube linki..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{flex: 1, padding: '15px', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.3)', color: 'white'}}
          />
          <button type="submit" className="upload-btn" disabled={loading} style={{background: '#ff0000', color: 'white', marginTop: 0}}>
            {loading ? '...' : 'BUL'}
          </button>
        </form>
        {error && <p style={{color: '#ff4d4d', marginTop: '15px'}}>{error}</p>}
      </div>

      {/* Sonuçlar (Liste) */}
      <div className="song-grid">
        {videos.map((item) => (
          <div 
            key={item.id.videoId} 
            className="song-card" 
            onClick={() => { 
              setSelectedVideo(`https://www.youtube.com/watch?v=${item.id.videoId}`); 
              setCurrentTrack(item); // Şarkı bilgilerini player'a gönder
              setIsPlaying(true);    // Otomatik başlat
              window.scrollTo({top: 0, behavior: 'smooth'}); 
            }}
            style={{cursor: 'pointer'}}
          >
            <div style={{position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px'}}>
              <img src={item.snippet.thumbnails.medium.url} alt={item.snippet.title} style={{width: '100%', display: 'block'}} />
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: '0.3s'
              }} className="hover-overlay">
                <span style={{fontSize: '3rem', color: 'white'}}>▶</span>
              </div>
            </div>
            <div className="song-info">
              <h3 style={{fontSize: '1rem', lineHeight: '1.4'}}>{item.snippet.title}</h3>
              <p style={{fontSize: '0.8rem', color: '#aaa'}}>{item.snippet.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .song-card:hover .hover-overlay { opacity: 1 !important; }
        .song-card:hover img { transform: scale(1.05); transition: transform 0.3s; }
      `}</style>

    </div>
  );
};

export default YouTubePage;