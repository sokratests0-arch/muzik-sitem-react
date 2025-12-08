import { createClient } from '@supabase/supabase-js'

// .env dosyasından değişkenleri al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// URL ve key yoksa geliştiriciyi uyar
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Supabase URL veya Anon Key bulunamadı!\n' +
    'Lütfen .env dosyanızı kontrol edin.\n' +
    'Örnek .env içeriği:\n' +
    'VITE_SUPABASE_URL=your-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

// Bağlantıyı oluştur ve dışa aktar
export const supabase = createClient(supabaseUrl, supabaseKey)