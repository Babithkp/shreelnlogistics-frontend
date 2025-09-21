import { useEffect, useState } from "react";
import FMCreate from "./FMCreate";
import FMList from "./FMList";
import { getLRApi } from "@/api/shipment";
import { FMInputs, LrInputs, VendorInputs } from "@/types";

export type FMSection = "FMList" | "createNew";
type SectionState = Record<FMSection, boolean>;
export interface BranchDetails {
  id: string;
  branchName: string;
  branchManager: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  username: string;
  password: string;
  employeeCount: string;
  email: string;
}

export default function FMPage({
  FMData,
  vendors,
  onRefresh,
}: {
  FMData: {
    data: FMInputs[];
    count: number;
  };
  vendors: VendorInputs[];
  onRefresh: () => void;
}) {
  const [selectedForm, setSelectedForm] = useState({
    FMList: true,
    createNew: false,
  });
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [selectedFMData, setSelectedFMData] = useState<FMInputs>();
  const [branchDetails, setBranchDetails] = useState<BranchDetails>();
  const [formStatus, setFormStatus] = useState<"edit" | "create">("create");

  const setSelectedFMDataToEdit = (data: FMInputs) => {
    setSelectedFMData(data);
    setSelectedForm({
      FMList: false,
      createNew: true,
    });
  };

  const resetToDefault = () => {
    setSelectedForm({
      FMList: true,
      createNew: false,
    });
  };

  const sectionChangeHandler = (section: FMSection) => {
    setSelectedForm((prev) => {
      const updatedSections: SectionState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as FMSection] = key === section;
          return acc;
        },
        {} as SectionState,
      );
      return updatedSections;
    });
  };

  async function fetchLRs(branchId?: string) {
    const response = await getLRApi();
    if (response?.status === 200) {
      const allLRs: LrInputs[] = response.data.data;

      const filteredLRs = branchId
        ? allLRs.filter((lr) => lr.branchId === branchId)
        : allLRs;
      setLRData(filteredLRs);
    }
  }

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (!id) {
      return;
    }
    const branch = localStorage.getItem("branchDetails");
    if (!branch) {
      return;
    }
    const branchDetails = JSON.parse(branch);
    setBranchDetails(branchDetails);
    if (branchDetails) {
      fetchLRs(branchDetails.id);
    } else {
      fetchLRs();
    }
  }, []);

  return (
    <>
      {selectedForm.FMList && (
        <FMList
          sectionChangeHandler={sectionChangeHandler}
          setSelectedFMDataToEdit={setSelectedFMDataToEdit}
          setFormStatus={setFormStatus}
          branchDetails={branchDetails}
          data={FMData}
          vendors={vendors}
          onRefresh={onRefresh}
          />
        )}
      {selectedForm.createNew && (
        <FMCreate
        resetToDefault={resetToDefault}
        selectedFMDataToEdit={selectedFMData}
        formStatus={formStatus}
        lrData={LRData}
        branchDetails={branchDetails}
        onRefresh={onRefresh}
        />
      )}
    </>
  );
}
