import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const getAllVendorsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/partner/getAllvendors`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createVendorApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/partner/createVendor`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createVehicleApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/partner/createVehicle`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllVehiclesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/partner/getVehicles`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateVendorDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/partner/updateVendor/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteVendorApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/partner/deleteVendor/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateVehicleDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/partner/updateVehicle/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteVehicleApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/partner/deleteVehicle/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getVehicleByIdApi = async (id: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/partner/getVehicleById/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillByClientApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/partner/getBillLRForClient`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMLRByVendorApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/partner/filterFMLRByVendor`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMLRByVendorForBranchApi = async (data: any, branchId?: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/partner/filterFMLRByVendor/${branchId}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getVendorForPageApi = async (page: number, limit: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/partner/getVendorForPage?page=${page}&limit=${limit}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterVendorByNameApi = async (name: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/partner/filterVendorByName/${name}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getClientForPageApi = async (page: number, limit: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/partner/getClientForPage?page=${page}&limit=${limit}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterClientByNameApi = async (name: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/partner/filterClientByName/${name}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};