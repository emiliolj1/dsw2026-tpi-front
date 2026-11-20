// Contrato de disponibilidad mensual de Turno Norte (API v1.7).
export const DAYS = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIÉRCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SÁBADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' },
];

const ENGLISH_DAYS = {
  monday: 'LUNES',
  tuesday: 'MARTES',
  wednesday: 'MIÉRCOLES',
  thursday: 'JUEVES',
  friday: 'VIERNES',
  saturday: 'SÁBADO',
  sunday: 'DOMINGO',
};

const SPANISH_DAYS = new Map(
  DAYS.map(({ value }) => [
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
    value,
  ])
);

export function normalizeDay(day) {
  const key = String(day ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return SPANISH_DAYS.get(key) || ENGLISH_DAYS[key] || '';
}

export function timeToMinutes(time) {
  if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

export function validateDays(days) {
  const errors = [];
  const byDay = new Map();

  days.forEach((row, index) => {
    const day = normalizeDay(row.day);
    const from = timeToMinutes(row.startTime);
    const to = timeToMinutes(row.endTime);

    if (!day) {
      errors.push({ index, field: 'day', message: 'Elegí un día válido.' });
    }

    if (from === null) {
      errors.push({
        index,
        field: 'startTime',
        message: 'Ingresá una hora válida (HH:mm).',
      });
    }

    if (to === null) {
      errors.push({
        index,
        field: 'endTime',
        message: 'Ingresá una hora válida (HH:mm).',
      });
    }

    if (from === null || to === null) {
      return;
    }

    if (to <= from) {
      errors.push({
        index,
        field: 'endTime',
        message: 'La hora de fin debe ser posterior al inicio.',
      });

      return;
    }

    if ((to - from) % 30 !== 0) {
      errors.push({
        index,
        field: 'endTime',
        message: 'La duración debe ser múltiplo de 30 minutos.',
      });
    }

    if (day) {
      const intervals = byDay.get(day) || [];

      intervals.push({ from, to, index });
      byDay.set(day, intervals);
    }
  });

  byDay.forEach((ranges) => {
    ranges.sort((a, b) => a.from - b.from || a.to - b.to);

    for (let i = 1; i < ranges.length; i += 1) {
      if (ranges[i].from < ranges[i - 1].to) {
        errors.push({
          index: ranges[i].index,
          field: 'startTime',
          message: 'Esta franja se superpone con otra del mismo día.',
        });
      }
    }
  });

  return errors;
}

export function toFormDays(rules) {
  return rules.map((rule) => ({
    day: normalizeDay(rule.day),
    startTime: String(rule.startTime ?? '').slice(0, 5),
    endTime: String(rule.endTime ?? '').slice(0, 5),
  }));
}

export function toRequestDays(days) {
  return days.map((row) => ({
    day: normalizeDay(row.day),
    startTime: row.startTime,
    endTime: row.endTime,
  }));
}
