import { useEffect, useState } from "react";
import FmReport from "./FmReport";
import BillReport from "./BillReport";
import { ClientInputs, VendorInputs } from "@/types";
import LRReport from "./LRReport";
import ExpenseReport from "./ExpenseReport";
import CreditReport from "./CreditReport";
import Writeoff from "./Writeoff";

type Sections = "LRs" | "FMs" | "Bills" | "Expenses" | "Credits" | "Writeoffs";

export default function ReportPage({ clients, vendors }: { clients: ClientInputs[], vendors: VendorInputs[] }) {
  const [branchName, setBranchName] = useState("");
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
  }, []);

  return (
    <div className="flex flex-col gap-5 rounded-lg bg-white p-5">
      <nav className="flex gap-2 font-medium">
        <p
          className={`cursor-pointer px-10 ${section.LRs ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("LRs")}
        >
          LRs
        </p>
        <p
          className={`cursor-pointer px-10 ${section.FMs ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("FMs")}
        >
          FMs
        </p>
        <p
          className={`cursor-pointer px-10 ${section.Bills ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("Bills")}
        >
          Bills
        </p>
        <p
          className={`cursor-pointer px-10 ${section.Expenses ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("Expenses")}
        >
          Expenses
        </p>
        <p
          className={`cursor-pointer px-10 ${section.Credits ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("Credits")}
        >
          Credits
        </p>
        <p
          className={`cursor-pointer px-10 ${section.Writeoffs ? "border-b border-black text-black" : "text-slate-500"} `}
          onClick={() => sectionChangeHandler("Writeoffs")}
        >
          Write offs
        </p>
      </nav>
      {section.FMs && (
        <FmReport branchName={branchName} isAdmin={isAdmin} branch={branch}  vendor={vendors}  />
      )} 
      {section.Bills && <BillReport branchName={branchName} isAdmin={isAdmin} branch={branch} client={clients}/>}
      {section.LRs && <LRReport client={clients} branchName={branchName} isAdmin={isAdmin} branch={branch}/>}
      {section.Expenses && <ExpenseReport branchName={branchName} isAdmin={isAdmin} branch={branch}/>}
      {section.Credits && <CreditReport branchName={branchName} isAdmin={isAdmin} branch={branch}/>} 
      {section.Writeoffs && <Writeoff branchName={branchName} isAdmin={isAdmin} branch={branch} clients={clients} vendors={vendors} />} 
    </div>
  );
}
