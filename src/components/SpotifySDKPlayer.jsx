import React, { useState, useEffect } from 'react';
import { authEndpoint, clientId, redirectUri, scopes } from '../spotifyConfig';

const SpotifySDKPlayer = () => {
  const [token, setToken] = useState(null);
  const [player, setPlayer] = useState(undefined);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);

  // 1. Token Alma
  useEffect(() => {
    const hash = window.location.hash;
    let storedToken = window.localStorage.getItem("spotify_token");

    if (!storedToken && hash) {
      const tokenParam = hash.substring(1).split("&").find(elem => elem.startsWith("access_token"));
      if (tokenParam) {
        storedToken = tokenParam.split("=")[1];
        window.location.hash = "";
        window.localStorage.setItem("spotify_token", storedToken);
      }
    }
    setToken(storedToken);
  }, []);

  // 2. Player Yükleme
  useEffect(() => {
    if (!token) return;

    let playerInstance = null;

    const initializePlayer = () => {
      playerInstance = new window.Spotify.Player({
        name: 'Müzik Sitem Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(playerInstance);

      playerInstance.addListener('ready', ({ device_id }) => {
        console.log('Cihaz hazır! ID:', device_id);
        setDeviceId(device_id);
        fetchPlaylist(token);
      });

      playerInstance.addListener('not_ready', ({ device_id }) => {
        console.log('Cihaz bağlantısı koptu:', device_id);
      });

      playerInstance.addListener('player_state_changed', (state => {
        if (!state) return;
        setTrack(state.track_window.current_track);
        setPaused(state.paused);
        playerInstance.getCurrentState().then(state => { 
          (!state) ? setActive(false) : setActive(true) 
        });
      }));

      playerInstance.connect();
    };

    if (window.Spotify) {
       initializePlayer();
    } else {
       window.onSpotifyWebPlaybackSDKReady = initializePlayer;
       if (!document.getElementById('spotify-player-script')) {
         const script = document.createElement("script");
         script.id = 'spotify-player-script';
         script.src = "https://sdk.scdn.co/spotify-player.js";
         script.async = true;
         document.body.appendChild(script);
       }
    }

    return () => {
      if (playerInstance) playerInstance.disconnect();
    };
  }, [token]);

  // 3. Playlist Çekme
  const fetchPlaylist = async (authToken) => {
    const playlistId = '37i9dQZEVXbIVYVBNw9D5K'; // Top 50 Turkey
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`, {
        headers: { 'Authorization': 'Bearer ' + authToken }
      });
      const data = await response.json();
      if (data && data.items) setPlaylistTracks(data.items);
    } catch (error) {
      console.error("Playlist hatası:", error);
    }
  };

  // 4. Şarkı Çal
  const playTrack = async (uri) => {
    if (!deviceId) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    } catch (error) {
      console.error("Çalma hatası:", error);
    }
  };

  if (!token) {
    // URL parametrelerini encodeURIComponent ile güvenli hale getiriyoruz
    const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=token&show_dialog=true`;

    if (typeof window !== 'undefined') console.log('Spotify authorize URL:', authUrl);

    return (
      <div className="uploader" style={{ textAlign: 'center' }}>
        <h2>Spotify'a Bağlan</h2>
        <a
          className="upload-btn"
          style={{ textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}
          href={authUrl}
        >
          Giriş Yap 🟢
        </a>
      </div>
    );
  }

  return (
    <div className="spotify-container">
      {current_track ? (
        <div className="now-playing-glass">
          <img src={current_track.album.images[0]?.url} className="now-playing-cover" alt="" />
          <div className="now-playing-info">
            <h3>{current_track.name}</h3>
            <p>{current_track.artists[0].name}</p>
          </div>
          <div className="controls">
             <button className="control-btn" onClick={() => player?.previousTrack()}>⏮</button>
             <button className="control-btn" onClick={() => player?.togglePlay()}>
               {is_paused ? "▶" : "⏸"}
             </button>
             <button className="control-btn" onClick={() => player?.nextTrack()}>⏭</button>
          </div>
        </div>
      ) : (
        <div className="now-playing-glass" style={{justifyContent:'center'}}>
           <p>Müzik seçilmedi. Listeden bir şarkı seçin!</p>
        </div>
      )}

      <h3 style={{color: '#1db954', marginTop: '30px'}}>Spotify Top 50</h3>
      <div className="song-grid">
        {playlistTracks.map((item) => {
           const track = item.track;
           if (!track) return null;
           return (
             <div key={track.id} className="song-card" onClick={() => playTrack(track.uri)} style={{cursor: 'pointer'}}>
                <div className="card-icon">
                  {track.album.images[0] && (
                    <img src={track.album.images[0].url} alt="" style={{width: '100%', borderRadius: '8px'}} />
                  )}
                </div>
                <div className="song-info">
                  <h3>{track.name}</h3>
                  <p>{track.artists[0].name}</p>
                </div>
             </div>
           )
        })}
      </div>
    </div>
  );
};

export default SpotifySDKPlayer;