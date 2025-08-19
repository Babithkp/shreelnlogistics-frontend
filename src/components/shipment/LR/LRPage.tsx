import LRList from "./LRList";
import LRCreate from "./LRCreate";
import { useState } from "react";
import { LrInputs } from "@/types";

type Sections = "LRList" | "createNew";
type SectionState = Record<Sections, boolean>;

export default function LRPage({
  lrData,
}: {
  lrData: {
    data: LrInputs[];
    count: number;
  };
}) {
  const [selectedForm, setSelectedForm] = useState({
    LRList: true,
    createNew: false,
  });
  const [selectedLRData, setSelectedLRData] = useState<LrInputs>();
  const [formStatus, setFormStatus] = useState<"edit" | "create">("create");

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

  const sectionChangeHandler = (section: Sections) => {
    setSelectedForm((prev) => {
      const updatedSections: SectionState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as Sections] = key === section;
          return acc;
        },
        {} as SectionState,
      );
      return updatedSections;
    });
  };

  return (
    <>
      {selectedForm.LRList && (
        <LRList
          sectionChangeHandler={sectionChangeHandler}
          setSelectedLRDataToEdit={setSelectedLRDataToEdit}
          setFormStatus={setFormStatus}
          data={lrData}
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
