import axios from "axios";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://shreeln-backend.vercel.app";

export const createBillApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/createBill`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBillDetailsApi = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/getBillDetails`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteBillApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/billing/deleteBill/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const sendBillEmailApi = async (email: string, file: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/sendBillEmail/${email}`,
      file,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateBillDetailsApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/billing/updateBillDetails/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const addPaymentRecordToBillApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/addPaymentRecordToBill`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deletePaymentRecordFromBillApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/billing/deletePaymentRecordFromBill/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const checkBillExistsApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/checkBillExists`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillBymonthApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/sendBillEmail`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBillByBranchIdApi = async (data: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/getBillByBranchId/${data}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateBillByNotificationApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/billing/updateBillByNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteBillByNotificationApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/deleteBillByNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateBillRecordByNotificationApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/billing/updateBillRecordByNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteBillRecordByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/billing/deleteBillRecordByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};
