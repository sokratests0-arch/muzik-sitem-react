import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM ortamında __dirname elde etme
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // === SORUNU ÇÖZECEK OLAN BÖLÜM ===
  optimizeDeps: {
    include: ['jsmediatags'],
  },
  // YENİ EK: Sitemizin GitHub Pages veya repo alt dizini için base yolu
  base: "/muzik-sitem-react/",
  // jsmediatags'in package.json'unda "browser" alanı yanlış gösteriyor ve Vite
  // paket girişini çözemiyor. Bu yüzden paket içindeki çalışır hal dosyaya alias
  // ile işaret ediyoruz.
  resolve: {
    alias: {
      // node_modules içindeki dist dosyasını kullanıyoruz (UMD minified)
      'jsmediatags': path.resolve(__dirname, 'node_modules/jsmediatags/dist/jsmediatags.min.js')
    }
  },
  // ================================
})