import axios from "axios";
const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://shreeln-backend.vercel.app";

export const adminLoginApi = async (userName: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/admin/login`, {
      userName,
      password,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createBranchApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/createBranch`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBranchesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getBranches`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const changeBranchPasswordApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/changeBranchPassword`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const createClientApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/createClient`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllClientsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getClients`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const uploadLRFileApi = async (data: any) => {

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/lorryReceiptsUpload`,
      {
        filename: data.name,
        contentType: data.type,
      },
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const fetchAdminDataApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getAdminData`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getAllAdminNotificationsApi = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/getAllNotifications`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteNotificationApi = async (id: string) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/admin/deleteNotification/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateNotificationApi = async (id: string, status: string) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/admin/updateNotification/${id}/${status}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};
export const createNotificationApi = async (data: any) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/createNotification`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getExpenseIdApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getExpenseId`);
    return response;
  } catch (error) {
    console.log(error);
  }
};
export const getCreditIdApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getCreditId`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getBillIdApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/admin/getBillId`);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getOtherSettingsApi = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/getOtherSettings`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateOtherSettingsApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/admin/updateOtherSettings`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getDashboardDataApi = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/getDashboardData`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const getDashboardDataForBranchApi = async (id: string) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/getDashboardDataForBranch/${id}`,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};


export const changeAdminPasswordApi = async (data: any) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/v1/admin/changeAdminPassword`,
      data,
    );
    return response;
  } catch (error) {
    console.log(error);
  }
};