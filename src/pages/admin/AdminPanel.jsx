import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  title: yup.string().required('Şarkı başlığı gerekli'),
  artist: yup.string().required('Sanatçı adı gerekli'),
}).required();

export default function AdminPanel() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data);
    } catch (error) {
      console.error('Şarkılar yüklenirken hata:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (data) => {
    if (!selectedTrack) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('tracks')
        .update({
          title: data.title,
          artist: data.artist,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTrack.id);

      if (error) throw error;
      
      setSelectedTrack(null);
      reset();
      await fetchTracks();
    } catch (error) {
      console.error('Güncelleme hatası:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu şarkıyı silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTracks();
    } catch (error) {
      console.error('Silme hatası:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="admin-panel">
      <h2>Admin Paneli</h2>
      
      {selectedTrack && (
        <form onSubmit={handleSubmit(handleEdit)} className="edit-form">
          <h3>Şarkı Düzenle</h3>
          
          <div className="form-group">
            <label htmlFor="title">Başlık</label>
            <input
              id="title"
              defaultValue={selectedTrack.title}
              {...register('title')}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span>{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="artist">Sanatçı</label>
            <input
              id="artist"
              defaultValue={selectedTrack.artist}
              {...register('artist')}
              className={errors.artist ? 'error' : ''}
            />
            {errors.artist && <span>{errors.artist.message}</span>}
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              Güncelle
            </button>
            <button type="button" onClick={() => setSelectedTrack(null)}>
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="tracks-table">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Sanatçı</th>
              <th>Yüklenme Tarihi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map(track => (
              <tr key={track.id}>
                <td>{track.title}</td>
                <td>{track.artist}</td>
                <td>{new Date(track.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                  <button onClick={() => setSelectedTrack(track)}>
                    Düzenle
                  </button>
                  <button onClick={() => handleDelete(track.id)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}