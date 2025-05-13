import { LuSearch } from "react-icons/lu";

import { FiSettings } from "react-icons/fi";
import { BiBell } from "react-icons/bi";

import LRList from "./LRList";
import LRCreate, { LrInputs } from "./LRCreate";
import { useState } from "react";

export type Section = "LRList" | "createNew";
type SectionsState = Record<Section, boolean>;

export default function LRPage() {
  const [selectedForm, setSelectedForm] = useState({
    LRList: true,
    createNew: false,
  });
  const [selectedLRData, setSelectedLRData] = useState<LrInputs>();
  const [formStatus, setFormStatus] = useState<"edit" | "create" | "supplementary">("create");

  const setSelectedLRDataToEdit = (data: LrInputs) => {
    setSelectedLRData(data);
    setSelectedForm({
      LRList: false,
      createNew: true,
    });
  };

  const resetToDefault = () => {
    setSelectedForm({
      LRList: true,
      createNew: false,
    });
  };

  const sectionChangeHandler = (section: Section) => {
    setSelectedForm((prev) => {
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
    <>
      <div className="flex w-full justify-between">
        <div>
          <p className="text-sm font-medium text-[#707EAE]">Admin</p>
          <p className="text-3xl font-medium">Lorry Receipts (LRs)</p>
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
      {selectedForm.LRList && (
        <LRList
          sectionChangeHandler={sectionChangeHandler}
          setSelectedLRDataToEdit={setSelectedLRDataToEdit}
          setFormStatus={setFormStatus}
        />
      )}
      {selectedForm.createNew && (
        <LRCreate
          resetToDefault={resetToDefault}
          selectedLRDataToEdit={selectedLRData}
          formStatus={formStatus}
        />
      )}
    </>
  );
}
