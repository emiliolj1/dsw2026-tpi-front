import { instance } from '../../shared/api/axiosInstance';

export async function updateSpecialty(id, { name, description }) {
  const response = await instance.put(
    `/api/specialties/${encodeURIComponent(id)}`,
    { name, description }
  );

  return response.data;
}
