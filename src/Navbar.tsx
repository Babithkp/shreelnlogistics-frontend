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
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getVersion } from "@tauri-apps/api/app";
import { Section, SectionsState } from "./types";

type DropDowns = "shipment" | "partner" | "billing";

type DropDownState = Record<DropDowns, boolean>;

export default function Navbar({
  setSections,
  sections,
  branch,
}: {
  setSections: any;
  sections: SectionsState;
  branch: {
    id: string;
    branchName: string;
    isAdmin: boolean;
  };
}) {
  const [version, setVersion] = useState("");
  const [dropDown, setDropDown] = useState({
    shipment: false,
    partner: false,
  });
  const navigate = useNavigate();
  const onLogoutHandler = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("id");
    localStorage.removeItem("branchDetails");
    navigate("/");
  };

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
      section !== "Bill"
    ) {
      setDropDown({ shipment: false, partner: false });
    }
    setSections((prev: any) => {
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

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);
  return (
    <nav className="flex h-screen w-[20rem] flex-col justify-between gap-10 overflow-y-auto bg-white p-3">
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
            onClick={() => sectionChangeHandler("Bill")}
          >
            <TbInvoice
              size={24}
              color={`${sections.Bill ? "#2196F3" : "#A3AED0"}`}
            />
            <p className={`${sections.Bill ? "text-black" : ""}`}>Billing</p>
          </button>
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
          <p className={`${sections.expenses ? "text-black" : ""}`}>Expenses</p>
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
      <div className="flex w-full flex-col items-center justify-center">
        <Button
          className="bg-primary rounded-2xl px-20 text-white"
          onClick={onLogoutHandler}
        >
          Logout
        </Button>
        {version && <p>v{version}</p>}
      </div>
    </nav>
  );
}
