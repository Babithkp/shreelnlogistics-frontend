import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreelnlogistics-backend.vercel.app";

export const getAllVendorsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getAllvendors`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createVendorApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createVendor`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createVehicleApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createVehicle`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllVehiclesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getVehicles`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateVendorDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateVendor/${id}`,
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
      `${BASE_URL}/api/v1/deleteVendor/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateVehicleDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateVehicle/${id}`,
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
      `${BASE_URL}/api/v1/deleteVehicle/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getVehicleByIdApi = async (id: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/getVehicleById/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillByClientApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/filterBillByClient`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};