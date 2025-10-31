import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 1. Adres defterini (Router) buraya import et
import { BrowserRouter } from 'react-router-dom'

// (Buradaki supabaseClient.js importunu silebilirsin, artık App.jsx yönetecek)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Uygulamamızı <BrowserRouter> ile sarıyoruz */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)