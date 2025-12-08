import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  title: yup.string().required('Şarkı başlığı gerekli'),
  artist: yup.string().required('Sanatçı adı gerekli'),
  file: yup.mixed()
    .required('Bir müzik dosyası seçin')
    .test('fileType', 'Sadece MP3 dosyaları kabul edilir', 
      value => value && ['audio/mpeg'].includes(value.type)),
}).required();

export default function TrackUploadForm({ onSubmit, isLoading }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  const processSubmit = async (data) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form gönderimi sırasında hata:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="upload-form">
      <div className="form-group">
        <label htmlFor="title">Şarkı Başlığı</label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
        />
        {errors.title && <span className="error-message">{errors.title.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="artist">Sanatçı</label>
        <input
          id="artist"
          type="text"
          {...register('artist')}
          className={`form-control ${errors.artist ? 'is-invalid' : ''}`}
        />
        {errors.artist && <span className="error-message">{errors.artist.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="file">Müzik Dosyası (MP3)</label>
        <input
          id="file"
          type="file"
          accept="audio/mpeg"
          {...register('file')}
          className={`form-control ${errors.file ? 'is-invalid' : ''}`}
        />
        {errors.file && <span className="error-message">{errors.file.message}</span>}
      </div>

      <button 
        type="submit" 
        disabled={isLoading} 
        className="submit-button"
      >
        {isLoading ? 'Yükleniyor...' : 'Yükle'}
      </button>
    </form>
  );
}