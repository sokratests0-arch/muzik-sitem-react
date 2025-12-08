import React from 'react';
import SpotifySDKPlayer from '../components/SpotifySDKPlayer';
import './SpotifyPage.css'; // <--- BU SATIRI EKLEYİN

function SpotifyPage() {
  return (
    <div style={{ marginTop: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #1db954, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Spotify Premium Player
        </h1>
      </header>
      <SpotifySDKPlayer />
    </div>
  );
}

export default SpotifyPage;