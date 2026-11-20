import { instance } from '../../shared/api/axiosInstance';

const PAGE_SIZE = 100;

async function getAllPages(url, extraParams = {}) {
  const all = [];
  let pageIndex = 0;

  while (true) {
    const { data } = await instance.get(url, {
      params: { ...extraParams, pageSize: PAGE_SIZE, pageIndex },
    });

    all.push(...data.data);

    if (data.data.length === 0 || all.length >= data.total) break;

    pageIndex += 1;
  }

  return all;
}

export function getSpecialties() {
  return getAllPages('/api/specialties');
}

export function getDoctors(specialtyId) {
  return getAllPages('/api/doctors', { specialtyId });
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
  await instance.delete(`/api/appointments/${appointmentId}`, {
    responseType: 'text',
  });
}
