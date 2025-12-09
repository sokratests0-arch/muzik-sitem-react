import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // SSL Eklentisi
import path from 'path'
import { fileURLToPath } from 'url'

// ESM ortamında __dirname elde etme
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      basicSsl() // HTTPS için gerekli sertifika eklentisi
    ],
    
    server: {
      port: 5174,
      https: true // Geliştirme sunucusunu HTTPS ile başlat (kullanıcının istediği https://localhost:5174)
    },

    define: {
      // Geliştirme modunda eval kullanımını etkinleştir
      '__DEV__': command === 'serve'
    },
    
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'jsmediatags'],
          }
        }
      }
    },
    
    optimizeDeps: {
      include: ['jsmediatags'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    
    // DİKKAT: Spotify testi yaparken 'base' ayarını kapalı tutuyoruz.
    // Eğer GitHub Pages'e yüklerken tekrar açmanız gerekirse burayı aktif edin.
    // base: "/muzik-sitem-react/",
    
    // jsmediatags hatasını çözen alias ayarınız (Korundu)
    resolve: {
      alias: {
        'jsmediatags': path.resolve(__dirname, 'node_modules/jsmediatags/dist/jsmediatags.min.js')
      }
    }
  }
})