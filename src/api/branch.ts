import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreeln-backend.vercel.app";

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

export const getAllRecordPaymentApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getAllRecordPayment`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getRecentPaymentsForPageApi = async (
  page: number,
  limit: number,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getAllRecordPaymentForPage?page=${page}&limit=${limit}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBranchBymonthApi = async (data: any) => {
  console.log("Filter Branch By Month");

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/filterBranchBymonth`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBranchNotificationsApi = async (branchId: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getBranchNotifications/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createNotificationForBranchApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/createNotificationForBranch`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterRecentPaymentsForPageApi = async (
  page: number,
  limit: number,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getAllRecordPaymentForPage?page=${page}&limit=${limit}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterRecentPaymentsForBranchPageApi = async (
  page: number,
  limit: number,
  branchId: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getAllRecordPaymentForBranchPage?page=${page}&limit=${limit}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};
export const GetRecentTransactionsApi = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/GetRecentTransactions`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterRecordPaymentByNameForBranchApi = async (
  name: string,
  branchId: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/filterRecordPaymentByNameForBranch/${name}/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const getAllStatementsApi = async (date: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getStatementsToExport/${date}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};