import { LuSearch } from "react-icons/lu";

import { FiSettings } from "react-icons/fi";
import { BiBell } from "react-icons/bi";

import { useEffect, useState } from "react";
import FMCreate, { FMInputs } from "./FMCreate";
import FMList from "./FMList";
import { getLRApi } from "@/api/shipment";
import { LrInputs } from "../LR/LRCreate";

export type FMSection = "FMList" | "createNew";
type SectionsState = Record<FMSection, boolean>;

export default function FMPage() {
  const [selectedForm, setSelectedForm] = useState({
    FMList: true,
    createNew: false,
  });
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [selectedFMData, setSelectedFMData] = useState<FMInputs>();
  const [formStatus, setFormStatus] = useState<
    "edit" | "create" 
  >("create");

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
      const updatedSections: SectionsState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as FMSection] = key === section;
          return acc;
        },
        {} as SectionsState,
      );
      return updatedSections;
    });
  };

  async function fetchLRs() {
    const response = await getLRApi();
    if (response?.status === 200) {
      setLRData(response.data.data);
    }
  }

  useEffect(() => {
    fetchLRs();
  }, []);

  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <p className="text-sm font-medium text-[#707EAE]">Admin</p>
          <p className="text-3xl font-medium">Freight Memos (FMs)</p>
        </div>
        <div className="flex gap-5 rounded-full bg-white p-3 px-5">
          <div className="flex items-center gap-2 rounded-full bg-[#F4F7FE] p-2">
            <LuSearch size={18} />
            <input
              placeholder="Search"
              className="outline-none placeholder:font-medium"
            />
          </div>

          <div className="flex items-center">
            <FiSettings size={22} color="#A3AED0" />
          </div>
          <div className="flex items-center">
            <BiBell size={24} color="#A3AED0" />
          </div>
        </div>
      </div>
      {selectedForm.FMList && (
        <FMList
          sectionChangeHandler={sectionChangeHandler}
          setSelectedFMDataToEdit={setSelectedFMDataToEdit}
          setFormStatus={setFormStatus}
        />
      )}
      {selectedForm.createNew && (
        <FMCreate
          resetToDefault={resetToDefault}
          selectedFMDataToEdit={selectedFMData}
          formStatus={formStatus}
          lrData={LRData}
        />
      )}
    </>
  );
}
