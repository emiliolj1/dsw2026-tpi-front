import { instance } from '../../shared/api/axiosInstance';

// Este archivo concentra TODOS los pedidos al backend de las pantallas
// del paciente. Las páginas no hablan con Axios directamente: llaman
// a estas funciones.

// Los listados del backend vienen como { pageSize, pageIndex, data, total }.
// Pedimos hasta 100 (el máximo permitido) y devolvemos solo el arreglo "data".
const firstPage = { pageSize: 100, pageIndex: 0 };

export async function getSpecialties() {
  const { data } = await instance.get('/api/specialties', {
    params: firstPage,
  });

  return data.data;
}

export async function getDoctors(specialtyId) {
  const { data } = await instance.get('/api/doctors', {
    params: { ...firstPage, specialtyId },
  });

  return data.data;
}

export async function getAvailableSlots(doctorId) {
  const { data } = await instance.get('/api/availabilities', {
    params: { doctorId },
  });

  return data;
}

export async function createAppointment({
  doctorId,
  availabilitySlotId,
  dni,
  reason,
}) {
  const { data } = await instance.post('/api/appointments', {
    doctorId,
    availabilitySlotId,
    patient: { dni },
    reason: reason.trim(),
  });

  return data;
}

export async function getMyAppointments(dni) {
  const { data } = await instance.get('/api/appointments/patient', {
    params: { dni },
  });

  return data;
}

export async function cancelAppointment(appointmentId) {
  // El backend responde con el texto "ok" (no es JSON),
  // por eso pedimos la respuesta como texto.
  await instance.delete(`/api/appointments/${appointmentId}`, {
    responseType: 'text',
  });
}
