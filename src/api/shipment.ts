import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreeln-backend.vercel.app";

export const createLRApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createLR`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getLR`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRByPageApi = async (
  currentPage: number,
  itemsPerPage: number,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getLRByPage?page=${currentPage}&limit=${itemsPerPage}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRByPageForBranchApi = async (
  currentPage: number,
  itemsPerPage: number,
  branchId: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getLRByPageForBranch?page=${currentPage}&limit=${itemsPerPage}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRByLrNumberApi = async (lrNumber: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getLRByLrNumber/${lrNumber}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteLRApi = async (id: string) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/v1/deleteLR/${id}`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateLRDetailsApi = async (data: any, id: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateLR/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const sendLREmailApi = async (email: string, file: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/sendLREmail/${email}`,
      file,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createFMApi = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/createFM`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getFMApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/getFM`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getFMByPageApi = async (
  currentPage: number,
  itemsPerPage: number,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getFMByPage?page=${currentPage}&limit=${itemsPerPage}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getFMByPageForBranchApi = async (
  currentPage: number,
  itemsPerPage: number,
  branchId: string,
) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getFMByPageForBranch?page=${currentPage}&limit=${itemsPerPage}&branchId=${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteFMApi = async (id: string) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/v1/deleteFM/${id}`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateFMApi = async (data: any) => {
  try {
    const response = await axios.patch(`${BASE_URL}/api/v1/updateFM`, data);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const sendFMEmailApi = async (email: string, file: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/sendFMEmail/${email}`,
      file,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const addPaymentRecordToFMApi = async (data: any, fmNumber: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/addPaymentRecordToFM/${fmNumber}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deletePaymentRecordFromFMApi = async (
  fmNumber: string,
  id: string,
) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deletePaymentRecordFromFM/${fmNumber}/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMBymonthApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/filterFMBymonth`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMBymonthForBranchApi = async (data: any, branchId: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/filterFMBymonthForBranch/${branchId}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getFmByBranchId = async (branchId: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getFMByBranchId/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getLRByBranchId = async (branchId: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/getLRByBranchId/${branchId}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateLRByNotificationApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateLRByNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateFMByNotificationApi = async (id: string, data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateFMByNotification/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteFMByNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deleteFMByNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteLRByNotificationApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/deleteLRByNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateRecordPaymentByNotificationApi = async (
  id: string,
  LRnumber: string,
  data: any,
) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/updateRecordPaymentByNotification/${id}/${LRnumber}`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteFMRecordByNotificationApi = async (
  id: string,
  IDNumber: string,
) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/deleteFMRecordByNotification/${id}/${IDNumber}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterLRDetailsApi = async (text: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/filterLRDetails/${text}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterLRDetailsForBranchApi = async (branchId: string, text: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/filterLRDetailsForBranch/${branchId}/${text}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMDetailsApi = async (text: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/filterFMDetails/${text}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const filterFMDetailsForBranchApi = async (branchId: string, text: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/filterFMDetailsForBranch/${branchId}/${text}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};