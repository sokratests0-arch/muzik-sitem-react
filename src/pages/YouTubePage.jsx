import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player'; 

const YouTubePage = () => {
  // === AYARLAR ===
  const API_KEY = 'AIzaSyD6bWkZ8QO1KrY-UOjryjRZjH7JvffKT44'; 
  const apiKey = 'AIzaSyD6bWkZ8QO1KrY-UOjryjRZjH7JvffKT44'; 

  // === STATE'LER ===
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]); // Arama sonuçları
  
  // Oynatıcı ve Kuyruk Sistemi
  const [queue, setQueue] = useState([]); // Çalma listesi
  const [currentIndex, setCurrentIndex] = useState(-1); // Şu an çalanın sırası
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [playError, setPlayError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Şu an çalan şarkı verisi (Kuyruktan alınır)
  const currentTrack = currentIndex >= 0 && queue[currentIndex] ? queue[currentIndex] : null;

  const playerRef = useRef(null);

  // Safe play/pause helpers to swallow AbortError from play() promise
  const safePlay = async () => {
    try {
      setIsBuffering(true);
      const internal = playerRef.current?.getInternalPlayer?.();
      if (!internal) {
        setIsPlaying(true);
        setIsBuffering(false);
        return;
      }
      const p = internal.play?.();
      if (p && typeof p.then === 'function') {
        await p.catch(() => {});
      }
      setIsPlaying(true);
    } catch (e) {
      console.warn('safePlay error', e);
      setIsPlaying(false);
    } finally {
      setIsBuffering(false);
    }
  };

  const safePause = async () => {
    try {
      const internal = playerRef.current?.getInternalPlayer?.();
      const p = internal?.pause?.();
      if (p && typeof p.then === 'function') p.catch(() => {});
    } catch (e) { /* ignore */ }
    setIsPlaying(false);
  };

  // === ARAMA FONKSİYONU ===
  const searchYouTube = async (searchQuery) => {
    if (!searchQuery) return;

    // Link Kontrolü (Tekil Oynatma)
    if (ReactPlayer.canPlay(searchQuery) || searchQuery.startsWith('http')) {
      const videoData = {
        id: { videoId: searchQuery }, // Yapıyı YouTube API formatına uyduruyoruz
        snippet: { 
          title: 'Web İçeriği', 
          channelTitle: 'Harici Kaynak',
          thumbnails: { medium: { url: 'https://cdn-icons-png.flaticon.com/512/1250/1250680.png' } }
        },
        isExternal: true
      };
      // Tek şarkılık liste
      setQueue([videoData]);
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsPlayerVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${searchQuery}&type=video&key=${API_KEY}`
      );
      
      if (!response.ok) throw new Error('API Hatası');

      const data = await response.json();
      setVideos(data.items); // Sadece listeyi güncelle, hemen çalma
    } catch (err) {
      console.error(err);
      alert('Arama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchYouTube(query);
  };

  // === OYNATMA KONTROLLERİ ===
  
  // Listeden bir şarkıya tıklandığında
  const playFromList = (index) => {
    // Tıklanan şarkıdan sonrasını kuyruk yap (YT Music mantığı)
    // Veya tüm listeyi kuyruk yapıp indeksi seç:
    setQueue(videos);
    setCurrentIndex(index);
    setIsPlayerVisible(true);
    setPlayError(null);
    setIsPlaying(false);
    // start playback safely after player is ready/mounted
    setTimeout(() => { safePlay(); }, 120);
  };

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPlayError(null);
    }
  };

  const playPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPlayError(null);
    }
  };

  // === GEMINI AI ===
  const generatePlaylist = async () => {
    if (!mood) return;
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const prompt = `Bana "${mood}" modu için 5 şarkı öner. Cevabı SADECE JSON dizisi olarak ver: ["Sanatçı - Şarkı", "Sanatçı - Şarkı"]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (!response.ok) throw new Error('AI Hatası');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      setAiSuggestions(JSON.parse(cleanJson));
    } catch (err) {
      alert('Yapay zeka şu an meşgul.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '160px' }}>
      
      <header className="App-header">
        <h1>Müzik Stüdyosu</h1>
        <p style={{color: 'var(--text-muted)'}}>YouTube Music Deneyimi</p>
      </header>

      {/* --- AI ASİSTANI --- */}
      <section className="uploader" style={{background: 'linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%)', borderColor: '#3f3f46'}}>
        <h2 style={{fontSize: '1.2rem', color: 'var(--primary)', marginTop:0}}>✨ AI Mod Asistanı</h2>
        <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
          <input 
            type="text" 
            placeholder="Modun nasıl? (Örn: Hüzünlü, Parti...)" 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
          <button onClick={generatePlaylist} disabled={aiLoading} className="highlight-btn" style={{minWidth: '80px'}}>
            {aiLoading ? '...' : 'Öner'}
          </button>
        </div>
        {aiSuggestions.length > 0 && (
          <div style={{marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            {aiSuggestions.map((song, index) => (
              <button
                key={index}
                title={song}
                onClick={() => { setQuery(song); searchYouTube(song); }}
                className="mini-btn"
                style={{width: 'auto', padding: '5px 15px', borderRadius: '20px', fontSize: '0.85rem', borderColor: 'var(--border)', whiteSpace: 'normal'}}
              >
                🎵 {song}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* --- ARAMA --- */}
      <div className="uploader">
        <form onSubmit={handleSearchSubmit} style={{display: 'flex', gap: '15px'}}>
          <input 
            type="text" 
            placeholder="Şarkı veya sanatçı ara..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="upload-btn" disabled={loading}>
            {loading ? '...' : 'BUL'}
          </button>
        </form>
      </div>

      {/* --- LİSTE --- */}
          <div className="song-grid">
        {videos.map((item, index) => (
          <div 
            key={item.id?.videoId || index} 
            className="song-card" 
            onClick={() => playFromList(index)}
            style={{
              borderColor: currentTrack && currentTrack.id.videoId === item.id.videoId ? 'var(--primary)' : 'var(--border)',
              background: currentTrack && currentTrack.id.videoId === item.id.videoId ? 'var(--bg-hover)' : 'var(--bg-card)'
            }}
          >
            <div className="card-icon">
              <img src={item.snippet.thumbnails.medium.url} alt={item.snippet.title} />
              {currentTrack && currentTrack.id.videoId === item.id.videoId && isPlaying && (
                <div className="playing-indicator">ılılı</div>
              )}
            </div>
            <div className="song-info">
              <h3 title={item.snippet.title} style={{overflowWrap: 'anywhere'}}>{item.snippet.title}</h3>
              <p>{item.snippet.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- PLAYER BAR (Alt Çubuk) --- */}
      {isPlayerVisible && currentTrack && (
        <div className="music-player-bar">
          
          {/* Sol: Kapak ve Bilgi */}
          <div style={{display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '15px'}}>
            <div className="mp-cover" style={{position: 'relative'}}>
              <img src={currentTrack.snippet.thumbnails.medium.url} alt="Cover" />
              {isBuffering && (
                <div className="mp-spinner" aria-hidden style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)'}}>
                  <div style={{width:28,height:28,borderRadius:14,border:'4px solid rgba(255,255,255,0.15)', borderTopColor:'white', animation:'spin 1s linear infinite'}}></div>
                </div>
              )}
            </div>
            <div className="mp-info">
              <h4 title={currentTrack.snippet.title}>{currentTrack.snippet.title}</h4>
              <p title={currentTrack.snippet.channelTitle}>{currentTrack.snippet.channelTitle}</p>
              {playError && <span style={{color: '#ff4d4d', fontSize: '0.7rem'}}>⚠️ Çalınamıyor (Sıradakine geçiliyor...)</span>}
            </div>
          </div>

          {/* Orta: Kontroller */}
          <div className="mp-controls">
            <button className="mp-btn" onClick={playPrev} disabled={currentIndex === 0}>⏮</button>
            <button className="mp-btn play" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="mp-btn" onClick={playNext} disabled={currentIndex === queue.length - 1}>⏭</button>
          </div>

          {/* Sağ: Kapat */}
          <button className="mp-btn close" onClick={() => setIsPlayerVisible(false)}>×</button>

          {/* GİZLİ VİDEO OYNATICI */}
          <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}> 
            <ReactPlayer 
              ref={playerRef}
              url={currentTrack.isExternal ? currentTrack.id.videoId : `https://www.youtube.com/watch?v=${currentTrack.id.videoId}`}
              playing={isPlaying}
              controls={false}
              width="640px"
              height="360px"
              onEnded={playNext} // Şarkı bitince sonrakine geç
              onError={(e) => {
                console.log("Player Hatası:", e);
                // Hata verirse (150/153) otomatik sonrakine geçmeyi dene
                setPlayError(true);
                setTimeout(() => playNext(), 2000); 
              }}
              config={{ youtube: { playerVars: { origin: window.location.origin } } }}
            />
          </div>
        </div>
      )}

      {/* --- STİLLER --- */}
      <style>{`
        .music-player-bar {
          position: fixed; bottom: 0; left: 0; width: 100%; height: 90px;
          background: rgba(24, 24, 27, 0.95); backdrop-filter: blur(20px);
          border-top: 1px solid var(--border); display: flex; align-items: center;
          padding: 0 30px; z-index: 9999; animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          justify-content: space-between; gap: 20px;
        }
        .mp-cover {
          width: 60px; height: 60px; border-radius: 8px; overflow: hidden;
          background: #000; flex-shrink: 0; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .mp-cover img { width: 100%; height: 100%; object-fit: cover; }
        .mp-info { min-width: 0; }
        .mp-info h4 { margin: 0; font-size: 0.95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mp-info p { margin: 3px 0 0 0; font-size: 0.75rem; color: #a1a1aa; }
        
        .mp-controls { display: flex; align-items: center; gap: 15px; }
        .mp-btn {
          background: transparent; border: none; color: #fff; cursor: pointer;
          font-size: 1.5rem; display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%; transition: 0.2s;
        }
        .mp-btn:hover { background: rgba(255,255,255,0.1); }
        .mp-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .mp-btn.play {
          background: #fff; color: #000; width: 50px; height: 50px;
          font-size: 1.2rem; box-shadow: 0 0 20px rgba(255,255,255,0.2);
        }
        .mp-btn.play:hover { transform: scale(1.05); background: #fff; }
        .mp-btn.close { font-size: 2rem; color: #71717a; margin-left: 20px; }
        .mp-btn.close:hover { color: #fff; }

        .playing-indicator {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,0.7); color: var(--primary);
          padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;
        }

        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        
        @media (max-width: 768px) {
          .music-player-bar { height: 120px; flex-direction: column; padding: 15px; align-items: stretch; }
          .mp-controls { justify-content: space-around; width: 100%; margin-top: 10px; }
          .mp-btn.close { position: absolute; top: 10px; right: 10px; margin: 0; font-size: 1.5rem; }
        }
      `}</style>

    </div>
  );
};

export default YouTubePage;