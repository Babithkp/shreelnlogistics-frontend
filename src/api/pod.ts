import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const createPODApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/pod/createPOD`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllPODsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/pod/getAllPODs`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deletePODApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/pod/deletePOD/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updatePODDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/pod/updatePOD/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updatePODByNotificationApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/pod/updatePODByNotification/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const deletePODByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/pod/deletePODByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const getPodByPageApi = async (page: number, limit: number, branchId?: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/pod/getPodByPage?page=${page}&limit=${limit}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const filterPODByTextApi = async (text: string, branchId?: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/pod/filterPODByText/${text}/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};