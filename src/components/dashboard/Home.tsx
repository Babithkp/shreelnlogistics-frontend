import logo from "../../assets/logisticsLogo.svg";
import { HiHome } from "react-icons/hi";
import { PiPackage } from "react-icons/pi";
import { TbInvoice } from "react-icons/tb";
import { HiOutlineCurrencyRupee } from "react-icons/hi2";
import { RiTruckLine } from "react-icons/ri";
import { MdDashboard } from "react-icons/md";
import { TbRadar2 } from "react-icons/tb";
import { LiaNewspaperSolid } from "react-icons/lia";
import { FiSettings } from "react-icons/fi";
import Dashboard from "./Dashboard";
import { useEffect, useState } from "react";
import Branch, { CreateBranchInputs } from "./Branch";
import { motion, AnimatePresence } from "framer-motion";
import LRPage from "../shipment/LR/LRPage";
import { Button } from "../ui/button";
import { useNavigate } from "react-router";
import ClientManagement, { ClientInputs } from "../partner/ClientManagement";
import VendorManagement, {
  VehicleInputs,
  VendorInputs,
} from "../partner/VendorManagement";
import {
  getAllVehiclesApi,
  getAllVendorsApi,
} from "@/api/partner";
import { toast } from "react-toastify";
import { getAllClientsApi } from "@/api/admin";
import FMPage from "../shipment/FM/FMPage";
import { getAllBranchDetailsApi } from "@/api/branch";

type Section =
  | "dashboard"
  | "LR"
  | "FM"
  | "billing"
  | "outstanding"
  | "branch"
  | "expenses"
  | "vendor"
  | "client"
  | "pod"
  | "settings";

type SectionsState = Record<Section, boolean>;

type DropDowns = "shipment" | "partner";

type DropDownState = Record<DropDowns, boolean>;

export default function Home() {
  const [sections, setSections] = useState<SectionsState>({
    dashboard: true,
    LR: false,
    FM: false,
    billing: false,
    vendor: false,
    client: false,
    outstanding: false,
    branch: false,
    expenses: false,
    pod: false,
    settings: false,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const [dropDown, setDropDown] = useState({
    shipment: false,
    partner: false,
  });

  const navigate = useNavigate();
  const [branches, setBranches] = useState<CreateBranchInputs[]>([]);
  const [clients, setClients] = useState<ClientInputs[]>([]);
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInputs[]>([]);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

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

  const onRefresh = () => {
    getBranchDetails();
    getClientDetails();
    fetchVendors();
    fetchVehicles();
  };

  useEffect(() => {
    onRefresh();
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
      section !== "client"
    ) {
      setDropDown({ shipment: false, partner: false });
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
      <nav className="flex h-full w-[20rem] flex-col justify-between gap-10 bg-white p-3">
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
          <div
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("billing")}
          >
            <TbInvoice
              size={24}
              color={`${sections.billing ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.billing ? "text-black" : ""}`}>
              Billing & Incoice
            </p>
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
          {isAdmin && (
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
          <div
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
          </div>
          <div
            className="hover:bg-muted-foreground text-muted flex w-full cursor-pointer gap-3 rounded-md p-2 font-medium hover:text-white"
            onClick={() => sectionChangeHandler("pod")}
          >
            <LiaNewspaperSolid
              size={24}
              color={`${sections.pod ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.pod ? "text-black" : ""}`}>POD</p>
          </div>
          <div
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
          </div>
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
        {sections.dashboard && (
          <Dashboard
            branchLength={branches.length}
            clientLength={clients.length}
            vendorLength={vendors.length}
            refresh={onRefresh}
          />
        )}
        {isAdmin && sections.branch && <Branch data={branches} />}
        {sections.LR && <LRPage />}
        {sections.FM && <FMPage />}
        {sections.client && <ClientManagement data={clients} />}
        {sections.vendor && (
          <VendorManagement vendorsData={vendors} vehiclesData={vehicles} />
        )}
      </section>
    </main>
  );
}
