// Ortak yükleme gösterge bileşeni
export function LoadingSpinner({ size = 'medium', inline = false, light = false }) {
  const sizeClass = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }[size] || 'w-8 h-8 border-3';

  return (
    <div
      className={`
        ${sizeClass}
        ${inline ? 'inline-block' : 'block mx-auto'}
        ${light ? 'border-white/30 border-t-white' : 'border-gray-300/30 border-t-primary'}
        rounded-full animate-spin
      `}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}

// Ortak mesaj bileşeni (başarı/hata/uyarı)
export function Message({ type = 'info', children, className = '' }) {
  const typeStyles = {
    success: 'bg-emerald-100/10 border-emerald-500 text-emerald-500',
    error: 'bg-red-100/10 border-red-500 text-red-500',
    warning: 'bg-yellow-100/10 border-yellow-500 text-yellow-500',
    info: 'bg-blue-100/10 border-blue-500 text-blue-500'
  }[type] || 'bg-blue-100/10 border-blue-500 text-blue-500';

  return (
    <div className={`px-4 py-3 mb-4 border rounded ${typeStyles} ${className}`}>
      {children}
    </div>
  );
}

// Ortak yükleme konteyner bileşeni
export function LoadingContainer({ loading, error, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <Message type="error">{error}</Message>;
  }

  return children;
}