import { instance } from '../../shared/api/axiosInstance';

export async function updateAppointmentStatus(appointmentId, status) {
  const response = await instance.patch(
    `/api/appointments/${encodeURIComponent(appointmentId)}/status`,
    { status }
  );

  return response.data;
}
