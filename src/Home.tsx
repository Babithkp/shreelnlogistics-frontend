import { useEffect, useState } from "react";

import { getAllVehiclesApi, getAllVendorsApi } from "@/api/partner";
import { toast } from "react-toastify";
import {
  getAllClientsApi,
  getDashboardDataApi,
  getDashboardDataForBranchApi,
} from "@/api/admin";
import Branch from "./components/branch/Branch";
import ClientManagement from "./components/partner/ClientManagement";
import VendorManagement from "./components/partner/VendorManagement";

import Dashboard, { DashboardData } from "./components/dashboard/Dashboard";
import LRPage from "./components/shipment/LR/LRPage";
import FMPage from "./components/shipment/FM/FMPage";
import Pod, { PODInputs } from "./components/pod/Pod";
import Settings, {
  BankDetailsInputs,
  ProfileInputs,
} from "./components/settings/Settings";
import Expenses from "./components/expenses/ExpensePage";
import {
  getBankDetailsApi,
  getCompanyProfileApi,
  getGeneralSettingsApi,
} from "./api/settings";
import OutStandingPage from "./components/outstanding/OutStandingPage";
import Statements from "./components/statements/Statements";
import { getBillByBranchIdApi, getBillDetailsApi } from "./api/billing";
import {
  billInputs,
  ClientInputs,
  ExpensesInputs,
  FMInputs,
  generalSettings,
  LrInputs,
  SectionsState,
  VehicleInputs,
  VendorInputs,
} from "./types";
import Header from "./components/Header";

import BillPage from "./components/billing/BillPage";
import Navbar from "./Navbar";
import {
  getFMByPageApi,
  getFMByPageForBranchApi,
  getLRByPageApi,
  getLRByPageForBranchApi,
} from "./api/shipment";
import { getExpenseByPageApi } from "./api/expense";
import { getPodByPageApi } from "./api/pod";
import ReportPage from "./components/reports/ReportPage";

export interface Setting {
  ProfileInputs: ProfileInputs;
  generalSettings: generalSettings;
  bankDetails: BankDetailsInputs;
}

export default function Home() {
  const [sections, setSections] = useState<SectionsState>({
    dashboard: true,
    LR: false,
    FM: false,
    Bill: false,
    vendor: false,
    client: false,
    outstanding: false,
    branch: false,
    expenses: false,
    statements: false,
    pod: false,
    settings: false,
    reports: false,
  });

  const [clients, setClients] = useState<ClientInputs[]>([]);
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInputs[]>([]);
  const [settings, setSettings] = useState<Setting>();
  const [billData, setBillData] = useState<billInputs[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>();
  const [LRData, setLRData] = useState<{
    data: LrInputs[];
    count: number;
  }>({
    data: [],
    count: 0,
  });
  const [FMData, setFMData] = useState<{
    data: FMInputs[];
    count: number;
  }>({
    data: [],
    count: 0,
  });
  const [branch, setBranch] = useState({
    id: "",
    branchName: "",
    isAdmin: false,
  });
  const [expenseData, setExpenseData] = useState<{
    data: ExpensesInputs[];
    count: number;
  }>({
    data: [],
    count: 0,
  });
  const [pods, setPods] = useState<{
    data: PODInputs[];
    count: number;
  }>({
    data: [],
    count: 0,
  });

  async function getClientDetails() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setClients(response.data.data);
    } else {
      toast.error("Failed to fetch Client Details");
    }
  }

  async function fetchVendors() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setVendors(response.data.data);
    }
  }

  async function fetchVehicles() {
    const response = await getAllVehiclesApi();
    if (response?.status === 200) {
      setVehicles(response.data.data);
    }
  }

  async function fetchLRDataForPage() {
    const response = await getLRByPageApi(0, 50);
    if (response?.status === 200) {
      const allLRs = response.data.data;
      setLRData({
        data: allLRs.LRData,
        count: allLRs.LRCount,
      });
    }
  }

  async function fetchLRDataForPageForBranch(branchId: string) {
    const response = await getLRByPageForBranchApi(0, 50, branchId);
    if (response?.status === 200) {
      const allLRs = response.data.data;
      setLRData({
        data: allLRs.LRData,
        count: allLRs.LRCount,
      });
    }
  }

  async function fetchFMDataForPage() {
    const response = await getFMByPageApi(0, 50);
    if (response?.status === 200) {
      const allFMs = response.data.data;
      setFMData({
        data: allFMs.FMData,
        count: allFMs.FMCount,
      });
    }
  }

  async function fetchFMDataForPageForBranch(branchId: string) {
    const response = await getFMByPageForBranchApi(0, 50, branchId);
    if (response?.status === 200) {
      const allFMs = response.data.data;
      setFMData({
        data: allFMs.FMData,
        count: allFMs.FMCount,
      });
    }
  }
  async function fetchExpense(branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await getExpenseByPageApi(0, 50, branchIdToBeUsed);
    if (response?.status === 200) {
      const allExpenses = response.data.data;
      setExpenseData({
        data: allExpenses.ExpenseData,
        count: allExpenses.ExpenseCount,
      });
    }
  }
  async function getPODByPage(branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await getPodByPageApi(0, 50, branchIdToBeUsed);
    if (response?.status === 200) {
      const allPods = response.data.data;
      setPods({
        data: allPods.PODData,
        count: allPods.PODCount,
      });
    }
  }

  async function fetchDashboardData() {
    const dashboardData = localStorage.getItem("dashboardData");
    if (dashboardData) {
      const data = JSON.parse(dashboardData);
      setDashboardData(data);
    }
    const response = await getDashboardDataApi();
    if (response?.status === 200) {
      setDashboardData(response.data.data);
      localStorage.setItem("dashboardData", JSON.stringify(response.data.data));
    }
  }

  async function fetchDashboardDataForBranch(branchId: string) {
    const dashboardData = localStorage.getItem("dashboardData");
    if (dashboardData) {
      const data = JSON.parse(dashboardData);
      setDashboardData(data);
    }
    const response = await getDashboardDataForBranchApi(branchId);
    if (response?.status === 200) {
      setDashboardData(response.data.data);
      localStorage.setItem("dashboardData", JSON.stringify(response.data.data));
    }
  }

  async function fetchSettings() {
    const response = await getGeneralSettingsApi();
    if (response?.status === 200) {
      const generalSettings = response.data.data;
      const profileData = await getCompanyProfileApi();
      const bankDetailsData = await getBankDetailsApi();
      if (profileData?.status === 200 && bankDetailsData?.status === 200) {
        setSettings({
          ProfileInputs: profileData.data.data,
          generalSettings,
          bankDetails: bankDetailsData.data.data,
        });
      }
    }
  }

  const getBillDetails = async () => {
    const response = await getBillDetailsApi();
    if (response?.status === 200) {
      const data = response.data.data;
      setBillData(data);
    }
  };

  const getBillDetailsForBranchs = async (branchId: string) => {
    const response = await getBillByBranchIdApi(branchId);
    if (response?.status === 200) {
      const data = response.data.data;
      setBillData(data);
    }
  };

  const onRefresh = async () => {
    if (branch.isAdmin) {
      getBillDetails();
      fetchLRDataForPage();
      fetchFMDataForPage();
      fetchExpense();
      getPODByPage();
      fetchDashboardData();
    } else if (branch.id) {
      getBillDetailsForBranchs(branch.id);
      fetchLRDataForPageForBranch(branch.id);
      fetchFMDataForPageForBranch(branch.id);
      fetchExpense(branch.id);
      getPODByPage(branch.id);
      fetchDashboardDataForBranch(branch.id);
    }
    fetchVendors();
    fetchVehicles();
    getClientDetails();
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const branchData = localStorage.getItem("branchDetails");
    if (branchData) {
      const branch = JSON.parse(branchData);
      if (isAdmin) {
        setBranch({
          id: "",
          branchName: branch.branchName,
          isAdmin: true,
        });
        getBillDetails();
        fetchLRDataForPage();
        fetchFMDataForPage();
        fetchExpense();
        getPODByPage();
        fetchDashboardData();
      } else {
        setBranch({
          id: branch.id,
          branchName: branch.branchName,
          isAdmin: false,
        });
        getBillDetailsForBranchs(branch.id);
        fetchLRDataForPageForBranch(branch.id);
        fetchFMDataForPageForBranch(branch.id);
        fetchExpense(branch.id);
        getPODByPage(branch.id);
        fetchDashboardDataForBranch(branch.id);
      }
    }

    fetchSettings();
    fetchVendors();
    fetchVehicles();
    getClientDetails();
  }, []);

  return (
    <main className="flex h-screen bg-[#F0F8FF]">
      <Navbar setSections={setSections} sections={sections} branch={branch} />
      <div className="flex h-full w-full flex-col overflow-y-auto p-5">
        <Header
          title={sections}
          setSections={setSections}
          onFresh={onRefresh}
        />
        {sections.dashboard && <Dashboard data={dashboardData} />}
        {sections.branch && <Branch />}
        {sections.LR && <LRPage lrData={LRData} />}
        {sections.FM && <FMPage FMData={FMData} vendors={vendors} onRefresh={onRefresh}/>}
        {sections.client && <ClientManagement data={clients} />}
        {sections.vendor && (
          <VendorManagement vendorsData={vendors} vehiclesData={vehicles} onRefresh={onRefresh}/>
        )}
        {sections.Bill && (
          <BillPage
            bankDetails={settings?.bankDetails}
            clientData={clients}
            billData={billData}
            clients={clients}
            onRefresh={onRefresh}
          />
        )}

        {sections.pod && <Pod data={pods} onRefresh={onRefresh}/>}
        {sections.settings && <Settings data={settings} />}
        {sections.expenses && <Expenses expenseData={expenseData} />}
        {sections.outstanding && <OutStandingPage clients={clients} vendors={vendors} />}
        {sections.statements && <Statements />}
        {sections.reports && <ReportPage clients={clients} vendors={vendors} />} 
      </div>
    </main>
  );
}
