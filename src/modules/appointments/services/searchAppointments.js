import { instance } from '../../shared/api/axiosInstance';

export async function searchAppointments(query, signal) {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== '')
  );
  const response = await instance.get('/api/appointments/search', {
    params,
    signal,
  });

  return response.data;
}
