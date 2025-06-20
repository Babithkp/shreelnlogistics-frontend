import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const createExpenseApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/expenses/create`, data);
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
    const response = await axios.delete(`${BASE_URL}/api/v1/expenses/delete/${id}`);
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
}


export const deleteExpenseByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/expenses/deleteByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
}