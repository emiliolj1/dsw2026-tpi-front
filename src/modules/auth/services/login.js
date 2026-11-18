import { instance } from '../../shared/api/axiosInstance';

export async function loginAdmin(email, password) {
  const { data } = await instance.post(
    '/api/auth/admin/login',
    { email, password },
    { skipAuth: true }
  );

  return data;
}

export async function loginPatient(email, dni) {
  const { data } = await instance.post(
    '/api/auth/patient/login',
    { email, dni },
    { skipAuth: true }
  );

  return data;
}

export async function logout(token) {
  await instance.post('/api/auth/logout', null, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 5000,
  });
}
