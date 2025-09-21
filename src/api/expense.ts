import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const createExpenseApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/expenses/create`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllExpensesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/expenses/getAll`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteExpenseApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/expenses/delete/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateExpenseDetailsApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/expenses/update/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateExpenseByNotificationApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/expenses/updateByNotification/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteExpenseByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/expenses/deleteByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getExpenseByPageApi = async (
  page: number,
  limit: number,
  branchId?: any,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/expenses/getByPage?page=${page}&limit=${limit}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterExpensesByTitleApi = async (text: string, branchId: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/expenses/filterByTitle/${text}/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createCreditApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/expenses/credits/create`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getCreditByPageApi = async (
  page: number,
  limit: number,
  branchId?: any,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/credits/getByPage?page=${page}&limit=${limit}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateCreditDetailsApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/credit/update/${id}`,
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
      `${BASE_URL}/api/v1/credit/delete/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterCreditsApi = async (text: string, branchId: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/credits/filterByTitle/${text}/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteCreditByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/credit/deleteByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateCreditByNotificationApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/credit/updateByNotification/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllCreditApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/credits/getAll`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterExpensesByDateApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/expenses/filterExpensesByDate`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const filterExpensesByDateForBranchApi = async (data: any, branchId: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/expenses/filterExpensesByDateForBranch/${branchId}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterCreditByDateApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/credit/filterCreditByDate`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const filterCreditByDateForBranchApi = async (
  data: any,
  branchId: any,
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/credit/filterCreditByDateForBranch/${branchId}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};