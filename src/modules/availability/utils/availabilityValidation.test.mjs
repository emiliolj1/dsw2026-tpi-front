import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeDay,
  timeToMinutes,
  toFormDays,
  toRequestDays,
  validateDays,
} from './availabilityValidation.js';

const row = (day, startTime, endTime) => ({ day, startTime, endTime });

test('normaliza días del contrato en español e inglés', () => {
  assert.equal(normalizeDay('MIÉRCOLES'), 'MIÉRCOLES');
  assert.equal(normalizeDay('miercoles'), 'MIÉRCOLES');
  assert.equal(normalizeDay('Saturday'), 'SÁBADO');
  assert.equal(normalizeDay('Tuesday'), 'MARTES');
});

test('valida horas, duración y orden cronológico', () => {
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('25:00'), null);
  assert.equal(validateDays([row('LUNES', '09:00', '12:00')]).length, 0);
  assert.ok(validateDays([row('LUNES', '10:00', '09:00')]).length > 0);
  assert.ok(validateDays([row('LUNES', '09:00', '09:45')]).length > 0);
});

test('acepta franjas adyacentes y rechaza franjas solapadas', () => {
  assert.equal(
    validateDays([
      row('LUNES', '09:00', '10:00'),
      row('LUNES', '10:00', '11:00'),
    ]).length,
    0
  );
  assert.ok(
    validateDays([
      row('LUNES', '09:00', '11:00'),
      row('MONDAY', '10:00', '12:00'),
    ]).some((problem) => problem.message.includes('superpone'))
  );
  assert.equal(
    validateDays([
      row('LUNES', '09:00', '10:00'),
      row('MARTES', '09:00', '10:00'),
    ]).length,
    0
  );
});

test('conserva los campos del contrato y admite PUT vacío', () => {
  assert.deepEqual(
    toFormDays([
      {
        id: 'abc',
        day: 'Wednesday',
        startTime: '08:30:00',
        endTime: '09:30:00',
      },
    ]),
    [row('MIÉRCOLES', '08:30', '09:30')]
  );
  assert.deepEqual(toRequestDays([row('Lunes', '08:00', '09:00')]), [
    row('LUNES', '08:00', '09:00'),
  ]);
  assert.deepEqual(toRequestDays([]), []);
});
