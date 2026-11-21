import { instance } from '../../shared/api/axiosInstance';

export async function getPage(path, params, signal) {
  const { data } = await instance.get(path, { params, signal });

  return data;
}
