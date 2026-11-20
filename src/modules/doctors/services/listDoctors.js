import { instance } from '../../shared/api/axiosInstance';

export async function listDoctors(options = {}) {
  const {
    name = '',
    specialtyId,
    pageIndex = 0,
    pageSize = 10,
    signal,
  } = options;
  const searchName = name.trim();
  const params = { pageIndex, pageSize };

  if (searchName && (searchName.length < 3 || searchName.length > 100)) {
    throw new Error('Ingresá entre 3 y 100 caracteres para buscar.');
  }

  if (searchName) {
    params.name = searchName;
  }

  if (specialtyId) {
    params.specialtyId = specialtyId;
  }

  const response = await instance.get('/api/doctors', { params, signal });

  return response.data;
}
