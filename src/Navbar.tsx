import logo from "./assets/logisticsLogo.svg";
import { HiHome } from "react-icons/hi";
import { PiPackage } from "react-icons/pi";
import {
  TbInvoice,
  TbRadar2,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
} from "react-icons/tb";
import { HiOutlineCurrencyRupee } from "react-icons/hi2";
import { RiFileExcel2Line, RiTruckLine } from "react-icons/ri";
import { MdDashboard } from "react-icons/md";
import { LiaNewspaperSolid } from "react-icons/lia";
import { FiSettings } from "react-icons/fi";
import type { IconType } from "react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "antd";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getVersion } from "@tauri-apps/api/app";
import { Section, SectionsState } from "./types";
import { VscGraph } from "react-icons/vsc";

type DropDowns = "shipment" | "partner" | "statements";

type DropDownState = Record<DropDowns, boolean>;

const navItemClass =
  "group flex w-full cursor-pointer items-center gap-3 rounded-md p-2 font-medium text-muted transition-colors hover:bg-primary hover:text-white";

const subNavItemClass =
  "group flex w-full cursor-pointer items-center gap-3 rounded-md p-2 pl-[3rem] font-medium text-muted transition-colors hover:bg-primary hover:text-white";

const iconClass = (active: boolean) =>
  `shrink-0 transition-colors group-hover:text-white ${active ? "text-primary" : "text-muted"}`;

function NavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: IconType;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const button = (
    <button
      className={`${navItemClass} ${collapsed ? "justify-center" : ""}`}
      onClick={onClick}
    >
      <Icon size={24} className={iconClass(active)} />
      {!collapsed && (
        <p className={`${active ? "text-black group-hover:text-white" : ""}`}>
          {label}
        </p>
      )}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip title={label} placement="right">
      {button}
    </Tooltip>
  );
}

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
  const [collapsed, setCollapsed] = useState(false);
  const [dropDown, setDropDown] = useState({
    shipment: false,
    partner: false,
    statements: false,
  });
  const navigate = useNavigate();
  const onLogoutHandler = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("id");
    localStorage.removeItem("branchDetails");
    navigate("/");
  };

  const sectionDropChangeHandler = (section: DropDowns) => {
    if (collapsed) {
      setCollapsed(false);
    }
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
      section !== "reports" &&
      section !== "summary" &&
      section !== "cashStatement" &&
      section !== "Bill"
    ) {
      setDropDown({ shipment: false, partner: false, statements: false });
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

  useEffect(() => {
    if (collapsed) {
      setDropDown({ shipment: false, partner: false, statements: false });
    }
  }, [collapsed]);

  return (
    <nav
      className={`flex h-screen flex-col justify-between gap-2 overflow-y-auto overflow-x-hidden bg-white p-3 transition-all duration-300 ${
        collapsed ? "w-[5rem]" : "w-[20rem]"
      }`}
    >
      <div
        className={`flex w-full items-center pb-5 ${collapsed ? "flex-col gap-3" : "justify-between"}`}
      >
        <img
          src={logo}
          alt="logo"
          className={`object-contain transition-all duration-300 ${collapsed ? "w-10" : "w-[16rem]"}`}
        />
        <button
          className="cursor-pointer rounded-md p-1 text-muted hover:bg-muted/20"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? (
            <TbLayoutSidebarLeftExpand size={24} />
          ) : (
            <TbLayoutSidebarLeftCollapse size={24} />
          )}
        </button>
      </div>
      <div className="flex h-full flex-col items-start gap-5 max-xl:text-sm">
        <NavItem
          icon={HiHome}
          label="Dashboard"
          active={sections.dashboard}
          collapsed={collapsed}
          onClick={() => sectionChangeHandler("dashboard")}
        />
        <div className="w-full">
          <NavItem
            icon={PiPackage}
            label="Shipments"
            active={dropDown.shipment}
            collapsed={collapsed}
            onClick={() => sectionDropChangeHandler("shipment")}
          />
          {dropDown.shipment && !collapsed && (
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
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("LR")}
                >
                  <p className={`${sections.LR ? "text-black group-hover:text-white" : ""}`}>
                    Lorry Receipts (LRs)
                  </p>
                </button>
                <button
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("FM")}
                >
                  <p className={`${sections.FM ? "text-black group-hover:text-white" : ""}`}>
                    Freight Memos (FMs)
                  </p>
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <div className="w-full">
          <NavItem
            icon={TbInvoice}
            label="Billing"
            active={sections.Bill}
            collapsed={collapsed}
            onClick={() => sectionChangeHandler("Bill")}
          />
        </div>
        <NavItem
          icon={HiOutlineCurrencyRupee}
          label="Outstanding Payment"
          active={sections.outstanding}
          collapsed={collapsed}
          onClick={() => sectionChangeHandler("outstanding")}
        />
        <div className="w-full">
          <NavItem
            icon={RiTruckLine}
            label="Partner Management"
            active={dropDown.partner}
            collapsed={collapsed}
            onClick={() => sectionDropChangeHandler("partner")}
          />
          {dropDown.partner && !collapsed && (
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
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("vendor")}
                >
                  <p className={`${sections.vendor ? "text-black group-hover:text-white" : ""}`}>
                    Vendor management
                  </p>
                </button>
                <button
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("client")}
                >
                  <p className={`${sections.client ? "text-black group-hover:text-white" : ""}`}>
                    Client management
                  </p>
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {branch.isAdmin && (
          <NavItem
            icon={MdDashboard}
            label="Branch Management"
            active={sections.branch}
            collapsed={collapsed}
            onClick={() => sectionChangeHandler("branch")}
          />
        )}
        <NavItem
          icon={TbRadar2}
          label="Expenses"
          active={sections.expenses}
          collapsed={collapsed}
          onClick={() => sectionChangeHandler("expenses")}
        />
        <div className="w-full">
          <NavItem
            icon={RiFileExcel2Line}
            label="Statements"
            active={dropDown.statements}
            collapsed={collapsed}
            onClick={() => sectionDropChangeHandler("statements")}
          />
          {dropDown.statements && !collapsed && (
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
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("summary")}
                >
                  <p className={`${sections.summary ? "text-black group-hover:text-white" : ""}`}>
                    Summary
                  </p>
                </button>
                <button
                  className={subNavItemClass}
                  onClick={() => sectionChangeHandler("cashStatement")}
                >
                  <p
                    className={`${sections.cashStatement ? "text-black group-hover:text-white" : ""}`}
                  >
                    Cash Statement
                  </p>
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <NavItem
          icon={LiaNewspaperSolid}
          label="POD"
          active={sections.pod}
          collapsed={collapsed}
          onClick={() => sectionChangeHandler("pod")}
        />

        <NavItem
          icon={VscGraph}
          label="Reports"
          active={sections.reports}
          collapsed={collapsed}
          onClick={() => sectionChangeHandler("reports")}
        />

        {branch.isAdmin && (
          <NavItem
            icon={FiSettings}
            label="Settings"
            active={sections.settings}
            collapsed={collapsed}
            onClick={() => sectionChangeHandler("settings")}
          />
        )}
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        {collapsed ? (
          <Tooltip title="Logout" placement="right">
            <Button
              className="bg-primary rounded-2xl px-3 text-white"
              onClick={onLogoutHandler}
            >
              ⏻
            </Button>
          </Tooltip>
        ) : (
          <Button
            className="bg-primary rounded-2xl px-20 text-white"
            onClick={onLogoutHandler}
          >
            Logout
          </Button>
        )}
        {version && !collapsed && <p>v{version}</p>}
      </div>
    </nav>
  );
}
