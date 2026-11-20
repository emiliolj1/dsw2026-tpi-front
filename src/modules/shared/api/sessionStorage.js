const sessionKey = 'turno-norte.session';
const sessionChanged = 'turno-norte:session-changed';

export function getStoredSession() {
  return window.localStorage.getItem(sessionKey);
}

export function getTokenExpiration(token) {
  try {
    const payload = token
      .split('.')[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const { exp } = JSON.parse(atob(payload));

    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function parseStoredSession(value) {
  try {
    const session = JSON.parse(value);

    if (typeof session?.token !== 'string' || !session.token) {
      return null;
    }

    if (
      session.role === 'ADMINISTRADOR' ||
      (session.role === 'PACIENTE' &&
        Number.isInteger(session.dni) &&
        session.dni >= 1_000_000 &&
        session.dni <= 99_999_999)
    ) {
      return session;
    }

    return null;
  } catch {
    return null;
  }
}

export function parseSession(value) {
  const session = parseStoredSession(value);

  if (!session) {
    return null;
  }

  const expiresAt = getTokenExpiration(session.token);

  return expiresAt !== null && expiresAt <= Date.now() ? null : session;
}

export function storeSession(session) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new Event(sessionChanged));
}

export function clearSession(token) {
  const value = getStoredSession();

  // A response from an earlier session must not invalidate a newer login.
  if (!token || parseStoredSession(value)?.token !== token) {
    return;
  }

  window.localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event(sessionChanged));
}

export function subscribeToSession(listener) {
  function onStorage(event) {
    if (
      event.storageArea === window.localStorage &&
      (event.key === sessionKey || event.key === null)
    ) {
      listener();
    }
  }

  window.addEventListener('storage', onStorage);
  window.addEventListener(sessionChanged, listener);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(sessionChanged, listener);
  };
}
