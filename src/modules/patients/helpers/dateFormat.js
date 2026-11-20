// El backend manda la fecha como "2026-11-23" y la hora como "09:00:00".
// Estas funciones la convierten a texto lindo para mostrar.

// Se arma la fecha con año, mes y día por separado para que la zona
// horaria no la corra un día.
export function parseDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function formatLongDate(isoDate) {
  const text = parseDate(isoDate).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(time) {
  return time.slice(0, 5);
}
