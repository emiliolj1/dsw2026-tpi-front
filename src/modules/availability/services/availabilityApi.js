import { instance } from '../../shared/api/axiosInstance';

// El catálogo es paginado: no asumir que solo existen los primeros 10 médicos.
export async function getAllDoctors(signal) {
  const doctors = [];
  const pageSize = 100;
  let pageIndex = 0;
  let total = 0;

  do {
    const { data } = await instance.get('/api/doctors', {
      params: { pageSize, pageIndex },
      signal,
    });

    if (!Array.isArray(data?.data)) {
      throw new Error('La API devolvió un listado de médicos inesperado.');
    }

    doctors.push(...data.data);
    total = Number(data.total) || 0;
    pageIndex += 1;
  } while (doctors.length < total && pageIndex < 100);

  return doctors;
}

export async function getMonthlyRules(doctorId, signal) {
  const { data } = await instance.get(
    `/api/doctors/${encodeURIComponent(doctorId)}/availabilities`,
    { signal }
  );

  if (!Array.isArray(data)) {
    throw new Error('La API devolvió una planificación inesperada.');
  }

  return data;
}

export async function saveMonthlyRules(payload, isEdition) {
  const { data } = await instance({
    method: isEdition ? 'put' : 'post',
    url: '/api/availabilities',
    data: payload,
  });

  return data;
}
