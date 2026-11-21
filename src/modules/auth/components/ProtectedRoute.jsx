import { Navigate } from 'react-router-dom';
import useAuth from '../hook/useAuth';

function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { session } = useAuth();

  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
