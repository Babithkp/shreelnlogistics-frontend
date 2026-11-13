import { useEffect, useState } from "react";
import FmReport from "./FmReport";
import BillReport from "./BillReport";
import { ClientInputs, VendorInputs } from "@/types";
import LRReport from "./LRReport";
import ExpenseReport from "./ExpenseReport";
import CreditReport from "./CreditReport";
import Writeoff from "./Writeoff";
import { getAllBranchDetailsApi } from "@/api/branch";
import {
  Truck,
  Package,
  Receipt,
  Radar,
  CreditCard,
  FileX2,
} from "lucide-react";

type Sections = "LRs" | "FMs" | "Bills" | "Expenses" | "Credits" | "Writeoffs";

export default function ReportPage({
  clients,
  vendors,
}: {
  clients: ClientInputs[];
  vendors: VendorInputs[];
}) {
  const [branchName, setBranchName] = useState("");
  const [branchList, setBranchList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [branch, setBranch] = useState({
    branchId: "",
    adminId: "",
  });

  const [section, setSection] = useState({
    LRs: true,
    FMs: false,
    Bills: false,
    Expenses: false,
    Credits: false,
    Writeoffs: false,
  });

  function sectionChangeHandler(section: Sections) {
    setSection({
      LRs: false,
      FMs: false,
      Bills: false,
      Expenses: false,
      Credits: false,
      Writeoffs: false,
      [section]: true,
    });
  }

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);
      setBranchName(branchDetails.branchName);
      if (isAdmin === "true") {
        setIsAdmin(true);
        setBranch({
          branchId: "",
          adminId: branchDetails.id,
        });
      } else {
        setIsAdmin(false);
        setBranch({
          branchId: branchDetails.id,
          adminId: "",
        });
      }
    }

    async function getBranchList() {
      const response = await getAllBranchDetailsApi();
      if (response?.status === 200) {
        setBranchList(response.data.data);
      }
    }
    getBranchList();
  }, []);

  const tabs: { key: Sections; label: string; icon: typeof Truck }[] = [
    { key: "LRs", label: "LRs", icon: Truck },
    { key: "FMs", label: "FMs", icon: Package },
    { key: "Bills", label: "Bills", icon: Receipt },
    { key: "Expenses", label: "Expenses", icon: Radar },
    { key: "Credits", label: "Credits", icon: CreditCard },
    { key: "Writeoffs", label: "Write offs", icon: FileX2 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = section[key];
          return (
            <button
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              onClick={() => sectionChangeHandler(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
      {section.FMs && (
        <FmReport
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          vendor={vendors}
          branchList={branchList}
        />
      )}
      {section.Bills && (
        <BillReport
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          client={clients}
          branchList={branchList}
        />
      )}
      {section.LRs && (
        <LRReport
          client={clients}
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          branchList={branchList}
        />
      )}
      {section.Expenses && (
        <ExpenseReport
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          branchList={branchList}
        />
      )}
      {section.Credits && (
        <CreditReport
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          branchList={branchList}
        />
      )}
      {section.Writeoffs && (
        <Writeoff
          branchName={branchName}
          isAdmin={isAdmin}
          branch={branch}
          clients={clients}
          vendors={vendors}
          branchList={branchList}
        />
      )}
    </div>
  );
}
