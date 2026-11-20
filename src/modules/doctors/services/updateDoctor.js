import { instance } from '../../shared/api/axiosInstance';

export async function updateDoctor(id, values) {
  const response = await instance.put(`/api/doctors/${id}`, values);

  return response.data;
}
