// src/spotifyConfig.js

export const authEndpoint = "https://accounts.spotify.com/authorize";

// Hata mesajınızdan aldığım Client ID'niz:
export const clientId = "ae1074dd19074c6cabd78d23cfec8d64"; 

// Redirect URI (Paneldeki ile BİREBİR aynı olmalı)
// DİKKAT: Tarayıcınız 5174 portunu açtığı için burayı güncelledik.
// Ayrıca 'http' yerine 'https' yaptık.
// Runtime hesaplama: localhost için http ve doğru portu kullan
// Sabit redirect URI: geliştirme ortamında HTTPS ile 5174 portunu kullan
// (Spotify Dashboard'da aynı URI'yi eklediğinizden emin olun)
export const redirectUri = 'https://localhost:5174/spotify';

export const scopes = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-library-modify",
  "user-read-playback-state",
  "user-modify-playback-state"
];