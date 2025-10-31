import { createClient } from '@supabase/supabase-js'

// 1. Kendi Supabase URL'ni buraya yapıştır
const supabaseUrl = 'https://tdtxfjlyjssdwqjtxerh.supabase.co' 

// 2. Kendi 'anon' key'ini (bir önceki mesajdaki) buraya yapıştır
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdHhmamx5anNzZHdxanR4ZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDE2OTAsImV4cCI6MjA3NzQ3NzY5MH0.AXE3v83ds0xhkAAc-jHYjF1ueafDiUMSiP4dnXQfvPE'

// 3. Bağlantıyı oluştur ve 'export' et (yani başka dosyalarda kullanıma aç)
export const supabase = createClient(supabaseUrl, supabaseKey)