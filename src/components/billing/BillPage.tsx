import { useState } from "react";
import GenerateBIll from "./GenerateBIll";
import ViewBills from "./ViewBills";
import { BankDetailsInputs } from "../settings/Settings";
import { billInputs, ClientInputs } from "@/types";

export default function BillPage({
  bankDetails,
  clientData,
  billData,
  clients,
  onRefresh,
}: {
  bankDetails?: BankDetailsInputs;
  clientData: ClientInputs[];
  billData: billInputs[];
  clients: ClientInputs[];
  onRefresh: () => void;
}) {
  const [selectedForm, setSelectedForm] = useState({
    billList: true,
    createNew: false,
  });
  const [selectedBillToEdit, setSelectedBillToEdit] =
    useState<billInputs | null>(null);
    const [supplementary, setSupplementary] = useState(false);

  return (
    <>
      {selectedForm.billList && (
        <ViewBills
          bankDetails={bankDetails}
          sectionChangeHandler={setSelectedForm}
          setSelectedBillToEdit={setSelectedBillToEdit}
          data={billData}
          setSupplementary={setSupplementary}
          clients={clients}
          onRefresh={onRefresh}
        />
      )}
      {selectedForm.createNew && (
        <GenerateBIll
          selectedBillToEdit={selectedBillToEdit}
          clientData={clientData}
          sectionChangeHandler={setSelectedForm}
          setSelectedBillToEdit={setSelectedBillToEdit}
          supplementary={supplementary}
        />
      )}
    </>
  );
}
