import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreelnlogistics-backend.vercel.app";

export const createLRApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createLR`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getLR`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteLRApi = async (id: string) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/v1/deleteLR/${id}`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateLRDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateLR/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const sendLREmailApi = async (email: string, file: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/sendLREmail/${email}`,
      file,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createFMApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createFM`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getFMApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getFM`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteFMApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deleteFM/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateFMApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateFM`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};