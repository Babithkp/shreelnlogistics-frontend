import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const createCompanyProfileApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/settings/createCompanyProfile`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const getCompanyProfileApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/settings/getCompanyProfile`);
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const updateCompanyProfileApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/settings/updateCompanyProfile/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const createGeneralSettingsApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/settings/createGeneralSettings`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getGeneralSettingsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/settings/getGeneralSettings`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateGeneralSettingsApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/settings/updateGeneralSettings/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createBankDetailsApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/settings/createBankDetails`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBankDetailsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/settings/getBankDetails`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateBankDetailsApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/settings/updateBankDetails/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};