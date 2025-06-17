import logo from "./assets/logisticsLogo.svg";
import { HiHome } from "react-icons/hi";
import { PiPackage } from "react-icons/pi";
import { TbInvoice } from "react-icons/tb";
import { HiOutlineCurrencyRupee } from "react-icons/hi2";
import { RiFileExcel2Line, RiTruckLine } from "react-icons/ri";
import { MdDashboard } from "react-icons/md";
import { TbRadar2 } from "react-icons/tb";
import { LiaNewspaperSolid } from "react-icons/lia";
import { FiSettings } from "react-icons/fi";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

import { getAllVehiclesApi, getAllVendorsApi } from "@/api/partner";
import { toast } from "react-toastify";
import { getAllClientsApi } from "@/api/admin";
import { getAllBranchDetailsApi } from "@/api/branch";
import Branch from "./components/branch/Branch";
import ClientManagement from "./components/partner/ClientManagement";
import VendorManagement from "./components/partner/VendorManagement";
import { Button } from "./components/ui/button";
import Dashboard from "./components/dashboard/Dashboard";
import LRPage from "./components/shipment/LR/LRPage";
import FMPage from "./components/shipment/FM/FMPage";
import GenerateBIll from "./components/billing/GenerateBIll";
import ViewBills from "./components/billing/ViewBills";
import Pod from "./components/pod/Pod";
import Settings, {
  BankDetailsInputs,
  ProfileInputs,
} from "./components/settings/Settings";
import Expenses from "./components/expenses/Expenses";
import {
  getBankDetailsApi,
  getCompanyProfileApi,
  getGeneralSettingsApi,
} from "./api/settings";
import OutStandingPage from "./components/outstanding/OutStandingPage";
import Statements from "./components/statements/Statements";
import { getBillByBranchIdApi, getBillDetailsApi } from "./api/billing";
import { getFMApi, getFmByBranchId } from "./api/shipment";
import {
  billInputs,
  BranchInputs,
  ClientInputs,
  FMInputs,
  generalSettings,
  Section,
  SectionsState,
  VehicleInputs,
  VendorInputs,
} from "./types";
import Header from "./components/Header";

type DropDowns = "shipment" | "partner" | "billing";

type DropDownState = Record<DropDowns, boolean>;

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
    generateBill: false,
    viewBill: false,
    vendor: false,
    client: false,
    outstanding: false,
    branch: false,
    expenses: false,
    statements: false,
    pod: false,
    settings: false,
  });
  const [dropDown, setDropDown] = useState({
    shipment: false,
    partner: false,
    billing: false,
  });

  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchInputs[]>([]);
  const [clients, setClients] = useState<ClientInputs[]>([]);
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInputs[]>([]);
  const [selectedBillToEdit, setSelectedBillToEdit] =
    useState<billInputs | null>();
  const [settings, setSettings] = useState<Setting>();
  const [billData, setBillData] = useState<billInputs[]>([]);
  const [fmData, setFMData] = useState<FMInputs[]>([]);
  const [branch, setBranch] = useState({
    id: "",
    branchName: "",
    isAdmin: false,
  });

  const onLogoutHandler = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("id");
    navigate("/");
  };

  async function getBranchDetails() {
    const response = await getAllBranchDetailsApi();
    if (response?.status === 200) {
      setBranches(response.data.data);
    } else {
      toast.error("Failed to fetch Branch Details");
    }
  }

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

  const getBillDetailsByBranchId = async (branchId: string) => {
    const response = await getBillByBranchIdApi(branchId);
    if (response?.status === 200) {
      const data = response.data.data;
      setBillData(data);
    }
  };

  async function fetchFMs() {
    const response = await getFMApi();
    if (response?.status === 200) {
      const data = response.data.data;
      setFMData(data);
    }
  }

  async function fetchFMsByBranchId(branchId: string) {
    const response = await getFmByBranchId(branchId);
    if (response?.status === 200) {
      const data = response.data.data;
      setFMData(data);
    }
  }
  
  const onRefresh = async () => {
    if(branch.isAdmin){
      fetchFMs();
      getBillDetails()
    }else{
      fetchFMsByBranchId(branch.id);
      getBillByBranchIdApi(branch.id);
    }
  }

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const branchData = localStorage.getItem("branchDetails");
    if (branchData) {
      const branch = JSON.parse(branchData);
      if (isAdmin) {
        setBranch({
          id: branch.id,
          branchName: branch.branchName,
          isAdmin: true,
        });
        getBillDetails()
        fetchFMs();
      } else {
        setBranch({
          id: branch.id,
          branchName: branch.branchName,
          isAdmin: false,
        });
        getBillDetailsByBranchId(branch.id);
        fetchFMsByBranchId(branch.id);
      }
    }
    

    getBranchDetails();
    getClientDetails();
    fetchSettings();
    fetchVendors();
    fetchVehicles();
  }, []);

  const sectionDropChangeHandler = (section: DropDowns) => {
    setDropDown((prev) => {
      const updatedSections: DropDownState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as DropDowns] = key === section;
          return acc;
        },
        {} as DropDownState,
      );
      return updatedSections;
    });
  };
  const sectionChangeHandler = (section: Section) => {
    if (
      section !== "LR" &&
      section !== "FM" &&
      section !== "vendor" &&
      section !== "client" &&
      section !== "generateBill" &&
      section !== "viewBill"
    ) {
      setDropDown({ shipment: false, partner: false, billing: false });
    }
    setSections((prev) => {
      const updatedSections: SectionsState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as Section] = key === section;
          return acc;
        },
        {} as SectionsState,
      );
      return updatedSections;
    });
  };
  return (
    <main className="flex h-screen bg-[#F0F8FF]">
      <nav className="flex h-screen overflow-y-auto w-[20rem] flex-col justify-between gap-10 bg-white p-3">
        <div className="flex w-full justify-center">
          <img src={logo} alt="logo" className="w-[16rem]" />
        </div>
        <div className="flex h-full flex-col items-start gap-5 max-xl:text-sm">
          <button
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("dashboard")}
          >
            <HiHome
              size={24}
              color={`${sections.dashboard ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.dashboard ? "text-black" : ""}`}>
              Dashboard
            </p>
          </button>
          <div className="w-full">
            <button
              className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
              onClick={() => sectionDropChangeHandler("shipment")}
            >
              <PiPackage
                size={24}
                color={`${dropDown.shipment ? "#2196F3" : "#A3AED0"}`}
              />
              <p className={`${dropDown.shipment ? "text-black" : ""}`}>
                Shipment Management
              </p>
            </button>
            {dropDown.shipment && (
              <AnimatePresence>
                <motion.div
                  key="lr-section"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("LR")}
                  >
                    <p className={`${sections.LR ? "text-black" : ""}`}>
                      Lorry Receipts (LRs)
                    </p>
                  </button>
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("FM")}
                  >
                    <p className={`${sections.FM ? "text-black" : ""}`}>
                      Freight Memos (FMs)
                    </p>
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          <div className="w-full">
            <button
              className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
              onClick={() => sectionDropChangeHandler("billing")}
            >
              <TbInvoice
                size={24}
                color={`${dropDown.billing ? "#2196F3" : "#A3AED0"}`}
              />
              <p className={`${dropDown.billing ? "text-black" : ""}`}>
                Billing & Incoice
              </p>
            </button>
            {dropDown.billing && (
              <AnimatePresence>
                <motion.div
                  key="lr-section"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("generateBill")}
                  >
                    <p
                      className={`${sections.generateBill ? "text-black" : ""}`}
                    >
                      Generate Bill
                    </p>
                  </button>
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("viewBill")}
                  >
                    <p className={`${sections.viewBill ? "text-black" : ""}`}>
                      View Bill
                    </p>
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          <div
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("outstanding")}
          >
            <HiOutlineCurrencyRupee
              size={24}
              color={`${sections.outstanding ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.outstanding ? "text-black" : ""}`}>
              Outstanding Payment
            </p>
          </div>
          <div className="w-full">
            <button
              className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
              onClick={() => sectionDropChangeHandler("partner")}
            >
              <RiTruckLine
                size={24}
                color={`${dropDown.partner ? "#2196F3" : "#A3AED0"}`}
              />
              <p className={`${dropDown.partner ? "text-black" : ""}`}>
                Partner Management
              </p>
            </button>
            {dropDown.partner && (
              <AnimatePresence>
                <motion.div
                  key="lr-section"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("vendor")}
                  >
                    <p className={`${sections.vendor ? "text-black" : ""}`}>
                      Vendor management
                    </p>
                  </button>
                  <button
                    className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 pl-[3rem] font-medium hover:text-white"
                    onClick={() => sectionChangeHandler("client")}
                  >
                    <p className={`${sections.client ? "text-black" : ""}`}>
                      Client management
                    </p>
                  </button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          {branch.isAdmin && (
            <button
              className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
              onClick={() => sectionChangeHandler("branch")}
            >
              <MdDashboard
                size={24}
                color={`${sections.branch ? "#2196F3" : "#A3AED0"}`}
              />
              <p className={`${sections.branch ? "text-black" : ""}`}>
                Branch Management
              </p>
            </button>
          )}
          <button
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("expenses")}
          >
            <TbRadar2
              size={24}
              color={`${sections.expenses ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.expenses ? "text-black" : ""}`}>
              Expenses
            </p>
          </button>
          <button
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("statements")}
          >
            <RiFileExcel2Line
              size={24}
              color={`${sections.statements ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.statements ? "text-black" : ""}`}>
              Statements
            </p>
          </button>
          <button
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("pod")}
          >
            <LiaNewspaperSolid
              size={24}
              color={`${sections.pod ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.pod ? "text-black" : ""}`}>POD</p>
          </button>
          {branch.isAdmin && (
            <button
              className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
              onClick={() => sectionChangeHandler("settings")}
            >
              <FiSettings
                size={24}
                color={`${sections.settings ? "#2196F3" : "#A3AED0"}`}
              />
              <p className={`${sections.settings ? "text-black" : ""}`}>
                Settings
              </p>
            </button>
          )}
        </div>
        <div className="flex w-full justify-center">
          <Button
            className="bg-primary rounded-2xl px-20 text-white"
            onClick={onLogoutHandler}
          >
            Logout
          </Button>
        </div>
      </nav>
      <section className="flex h-full w-full flex-col gap-5 overflow-y-auto p-5">
        <Header title={sections} setSections={setSections} onFresh={onRefresh} />
        {sections.dashboard && (
          <Dashboard
            branchLength={branches.length}
            clientLength={clients.length}
            vendorLength={vendors.length}
            billData={billData}
            fmData={fmData}
            branchData={branches}
          />
        )}
        {sections.branch && <Branch  />}
        {sections.LR && <LRPage />}
        {sections.FM && <FMPage />}
        {sections.client && <ClientManagement data={clients} />}
        {sections.vendor && (
          <VendorManagement vendorsData={vendors} vehiclesData={vehicles} />
        )}
        {sections.generateBill && (
          <GenerateBIll
            selectedBillToEdit={selectedBillToEdit}
            sectionChangeHandler={sectionChangeHandler}
            setSelectedBillToEdit={setSelectedBillToEdit}
          />
        )}
        {sections.viewBill && (
          <ViewBills
            sectionChangeHandler={sectionChangeHandler}
            setSelectedBillToEdit={setSelectedBillToEdit}
            bankDetails={settings?.bankDetails}
          />
        )}
        {sections.pod && <Pod />}
        {sections.settings && <Settings data={settings} />}
        {sections.expenses && <Expenses />}
        {sections.outstanding && <OutStandingPage />}
        {sections.statements && <Statements />}
      </section>
    </main>
  );
}
