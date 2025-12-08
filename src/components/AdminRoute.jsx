import { Navigate } from 'react-router-dom';
import { LoadingContainer } from './ui/LoadingStates';

function AdminRoute({ userRole, children }) {
  // null -> henüz yükleniyor
  const loading = userRole === null;
  
  // admin değilse -> anasayfaya yönlendir
  if (!loading && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <LoadingContainer 
      loading={loading}
      error={null}
    >
      {children}
    </LoadingContainer>
  );
}

export default AdminRoute;