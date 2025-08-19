import { useState } from "react";
import GenerateBIll from "./GenerateBIll";
import ViewBills from "./ViewBills";
import { BankDetailsInputs } from "../settings/Settings";
import { billInputs, ClientInputs } from "@/types";

export default function BillPage({
  bankDetails,
  clientData,
  billData
}: {
  bankDetails?: BankDetailsInputs;
  clientData: ClientInputs[];
  billData: billInputs[];
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
