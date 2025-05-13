import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreelnlogistics-backend.vercel.app";


export const adminLoginApi = async (userName: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/admin/login`, {
      userName,
      password,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createBranchApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/admin/createBranch`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBranchesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getBranches`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const changeBranchPasswordApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/changeBranchPassword`,
      data
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createClientApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/admin/createClient`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllClientsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getClients`);
    return response;
  } catch (error) {
    console.log(error);
  }
};
