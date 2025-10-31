import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// DEĞİŞİKLİK: BrowserRouter yerine HashRouter
import { HashRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* DEĞİŞİKLİK: BrowserRouter yerine HashRouter */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)