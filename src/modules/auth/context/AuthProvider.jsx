import {
  createContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  clearSession,
  getStoredSession,
  getTokenExpiration,
  parseSession,
  storeSession,
  subscribeToSession,
} from '../../shared/api/sessionStorage';
import { loginAdmin, loginPatient, logout } from '../services/login';

const AuthContext = createContext();

function AuthProvider({ children }) {
  const storedSession = useSyncExternalStore(
    subscribeToSession,
    getStoredSession
  );
  const session = parseSession(storedSession);
  const token = session?.token;
  const [signingOut, setSigningOut] = useState(false);
  const [logoutWarningRole, setLogoutWarningRole] = useState(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const expiresAt = getTokenExpiration(token);

    if (expiresAt === null) {
      return;
    }

    const timeout = window.setTimeout(
      () => clearSession(token),
      Math.max(0, expiresAt - Date.now())
    );

    return () => window.clearTimeout(timeout);
  }, [token]);

  async function signInAdmin(email, password) {
    setLogoutWarningRole(null);
    const { token, role } = await loginAdmin(email, password);

    if (!token || role !== 'ADMINISTRADOR') {
      throw new Error('Respuesta de inicio de sesión administrativo inválida');
    }

    storeSession({ token, role });
  }

  async function signInPatient(email, dni) {
    setLogoutWarningRole(null);
    const { token, role } = await loginPatient(email, dni);

    if (!token || role !== 'PACIENTE') {
      throw new Error('Respuesta de inicio de sesión de paciente inválida');
    }

    storeSession({ token, role, dni });
  }

  async function signOut() {
    if (!session || signingOut) {
      return;
    }

    setSigningOut(true);
    setLogoutWarningRole(null);

    try {
      await logout(session.token);
    } catch (error) {
      if (error.response?.status !== 401) {
        setLogoutWarningRole(session.role);
      }
    } finally {
      clearSession(session.token);
      setSigningOut(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        signInAdmin,
        signInPatient,
        signOut,
        signingOut,
        logoutWarningRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, AuthContext };
