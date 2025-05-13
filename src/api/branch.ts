import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreelnlogistics-backend.vercel.app";

export const branchLoginApi = async (branchName: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/branch/login`, {
      branchName,
      password,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllBranchDetailsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/branch`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateBranchDetailsApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/updateBranch`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteBranchApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deleteBranch/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateClientDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateClient/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteClientApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deleteClient/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

