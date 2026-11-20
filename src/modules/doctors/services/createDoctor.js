import { instance } from '../../shared/api/axiosInstance';

export async function createDoctor({ name, licenseNumber, specialtyId }) {
  const response = await instance.post('/api/doctors', {
    name,
    licenseNumber,
    specialtyId,
  });

  return response.data;
}
