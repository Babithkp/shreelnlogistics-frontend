import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const createFMWriteOffApi = async (data: any) => {
  return await axios.post(`${BASE_URL}/api/v1/FMwriteOff/create`, data);
};

export const getAllWriteOffApi = async () => {
  return await axios.get(`${BASE_URL}/api/v1/writeOff/getAll`);
};

export const createBillWriteOffApi = async (data: any) => {
  return await axios.post(`${BASE_URL}/api/v1/BillwriteOff/create`, data);
};

export const deleteFmWriteOffApi = async (id: string) => {
  return await axios.delete(`${BASE_URL}/api/v1/FMwriteOff/delete/${id}`);
};

export const deleteBillWriteOffApi = async (id: string) => {
  return await axios.post(`${BASE_URL}/api/v1/BillwriteOff/delete`, {
    id: id,
  });
};

export const filterWriteOffApi = async (data: any) => {
  return await axios.post(`${BASE_URL}/api/v1/writeOff/filter`, data);
};