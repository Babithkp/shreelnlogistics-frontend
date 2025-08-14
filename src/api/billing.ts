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

export const createBillsupplementaryApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/createBillsupplementary`,
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

export const getBillByPageApi = async (
  currentPage: number,
  itemsPerPage: number,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/getBillByPage?page=${currentPage}&limit=${itemsPerPage}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBillByPageForBranchApi = async (
  currentPage: number,
  itemsPerPage: number,
  branchId: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/getBillByPageForBranch?page=${currentPage}&limit=${itemsPerPage}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillDataApi = async (data: any) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/filterBillData/${data}`,
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
      `${BASE_URL}/api/v1/billing/filterBillBymonth`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillBymonthForBranchApi = async (
  data: any,
  branchId: string,
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/filterBillBymonthForBranch/${branchId}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterBillDetailsForBranchApi = async (
  branchId: string,
  text: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/billing/filterBillDetailsForBranch/${branchId}/${text}`,
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

export const updateTdsOfBillApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/billing/tds-update/${data.id}/${data.tds}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};
