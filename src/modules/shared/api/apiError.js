const fallbackMessages = {
  401: 'La sesión terminó. Volvé a iniciar sesión.',
  403: 'Tu usuario no tiene permiso para realizar esta acción.',
  429: 'Hubo demasiados intentos. Esperá un momento antes de volver a intentar.',
};

export function getApiError(error) {
  const status = error.response?.status;
  const body = error.response?.data;

  return {
    status,
    errorCode: body?.errorCode,
    message:
      body?.message ||
      fallbackMessages[status] ||
      (status
        ? 'No pudimos completar la solicitud.'
        : 'No pudimos conectarnos con Turno Norte. Intentá de nuevo.'),
    details: Array.isArray(body?.details) ? body.details : [],
  };
}
