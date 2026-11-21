import { Navigate } from 'react-router-dom';
import useAuth from '../hook/useAuth';

const homeByRole = new Map([
  ['PACIENTE', '/'],
  ['ADMINISTRADOR', '/admin/home'],
]);

function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const { session } = useAuth();

  if (session && allowedRoles.includes(session.role)) {
    return children;
  }

  const destination = homeByRole.get(session?.role) ?? redirectTo;

  return <Navigate to={destination} replace />;
}

export default ProtectedRoute;
