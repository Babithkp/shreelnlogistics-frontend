import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { Controller, set, useForm, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

import { VehicleInputs, VendorInputs } from "../../partner/VendorManagement";
import { Select as AntSelect } from "antd";
import {
  createFMApi,
  createLRApi,
  getLRApi,
  updateFMApi,
  updateLRDetailsApi,
} from "../../../api/shipment";
import { getAllClientsApi } from "../../../api/admin";
import { toast } from "react-toastify";
import { VscLoading } from "react-icons/vsc";
import { LrInputs } from "../LR/LRCreate";
import { getVehicleByDataApi } from "@/api/partner";
import { toWords } from "number-to-words";

const allOptions = [
  "unLoading",
  "extraKms",
  "detention",
  "weightment",
  "others",
];

type Option = { value: string; label: string };

export interface FMInputs {
  id: string;
  fmNumber: string;
  date: string;
  from: string;
  to: string;
  vehicleNo: string;
  vehicleType: string;
  weight: string;
  package: string;
  payableAt: string;
  vendorName: string;
  vendorEmail: string;
  ContactPerson: string;
  DriverName: string;
  contactNumber: string;
  ownerName: string;
  TDS: string;
  insturance: string;
  Rc: string;
  LRNumbers: {
    lrNumber: string;
    date: string;
  }[];
  hire: string;
  advance: string;
  balance: string;
  otherCharges: string;
  detentionCharges: string;
  rtoCharges: string;
  tds: string;
  netBlance: string;
  driverSignature: string;
  dlNumber: string;
  amountInwords: string;
  zeroToThirty: string;
  thirtyToSixty: string;
  sixtyToNinety: string;
  ninetyPlus: string;
}

export default function FMCreate({
  resetToDefault,
  selectedFMDataToEdit,
  formStatus,
  lrData,
}: {
  resetToDefault: () => void;
  selectedFMDataToEdit?: FMInputs;
  formStatus: "edit" | "create";
  lrData: LrInputs[];
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [branchName, setBranchName] = useState("");
  const [isloading, setIsloading] = useState(false);
  const [fmNumberAlreadyExists, setFMNumberAlreadyExists] = useState(false);

  const [lrList, setLRList] = useState<{ lrNumber: string; date: string }[]>(
    [],
  );
  const [fmData, setFMData] = useState({
    date: new Date().toISOString().split("T")[0],
    fmNumber: "",
    hire: 0,
    advance: 0,
    balance: 0,
    otherCharges: 0,
    detentionCharges: 0,
    rtoCharges: 0,
    tds: 0, // hire+ other + detention + rto * 0.01
    netBlance: 0, // balance + others + detention + rto - tds
    amountInwords: "",
    dlNumber: "",
    driverSignature: "",
  });
  const [lrDataToFM, setLRDataToFM] = useState({
    lrNumber: "",
    date: new Date().toISOString().split("T")[0],
    from: "-",
    to: "-",
    vehicleNo: "-",
    vehicleType: "-",
    weight: "-",
    packages: "-",
    payableAt: "-",
    vendorName: "-",
    vendorEmail: "-",
    ContactPerson: "-",
    DriverName: "-",
    contactNumber: "-",
    ownerName: "-",
    TDS: "-",
    insturance: "-",
    Rc: "-",
  });

  useEffect(() => {
    let tds = 0;
    const hire = fmData.hire || 0;
    const advance = fmData.advance || 0;
    const otherCharges = fmData.otherCharges || 0;
    const detentionCharges = fmData.detentionCharges || 0;
    const rtoCharges = fmData.rtoCharges || 0;

    const balance = hire - advance;

    if (lrDataToFM?.TDS === "Not-declared") {
      tds = (hire - otherCharges - detentionCharges - rtoCharges) * 0.01;
    }

    const netBalance =
      balance + otherCharges + detentionCharges + rtoCharges - tds;

    setFMData((prev) => ({
      ...prev,
      tds,
      balance,
      netBlance: netBalance,
      amountInwords: toWords(netBalance),
    }));
  }, [
    fmData.hire,
    fmData.advance,
    fmData.otherCharges,
    fmData.detentionCharges,
    fmData.rtoCharges,
    lrDataToFM?.TDS,
  ]);

  useEffect(() => {
    if (formStatus === "edit") {
      const lrList = selectedFMDataToEdit?.LRNumbers;

      const fmData = {
        date: selectedFMDataToEdit?.date || "",
        fmNumber: selectedFMDataToEdit?.fmNumber || "",
        hire: Number(selectedFMDataToEdit?.hire || 0),
        advance: Number(selectedFMDataToEdit?.advance || 0),
        balance: Number(selectedFMDataToEdit?.balance || 0),
        otherCharges: Number(selectedFMDataToEdit?.otherCharges || 0),
        detentionCharges: Number(selectedFMDataToEdit?.detentionCharges || 0),
        rtoCharges: Number(selectedFMDataToEdit?.rtoCharges || 0),
        tds: Number(selectedFMDataToEdit?.tds || 0),
        netBlance: Number(selectedFMDataToEdit?.netBlance || 0),
        amountInwords: selectedFMDataToEdit?.amountInwords || "",
        dlNumber: selectedFMDataToEdit?.dlNumber || "",
        driverSignature: selectedFMDataToEdit?.driverSignature || "",
      };
      const lrDataToFM = {
        lrNumber: "",
        date: selectedFMDataToEdit?.date || "",
        from: selectedFMDataToEdit?.from || "",
        to: selectedFMDataToEdit?.to || "",
        vehicleNo: selectedFMDataToEdit?.vehicleNo || "",
        vehicleType: selectedFMDataToEdit?.vehicleType || "",
        weight: selectedFMDataToEdit?.weight || "",
        packages: selectedFMDataToEdit?.package || "",
        payableAt: selectedFMDataToEdit?.to || "",
        vendorName: selectedFMDataToEdit?.vendorName || "",
        vendorEmail: selectedFMDataToEdit?.vendorEmail || "",
        ContactPerson: selectedFMDataToEdit?.ContactPerson || "",
        DriverName: selectedFMDataToEdit?.DriverName || "",
        contactNumber: selectedFMDataToEdit?.contactNumber || "",
        ownerName: selectedFMDataToEdit?.ownerName || "",
        TDS: selectedFMDataToEdit?.TDS || "",
        insturance: selectedFMDataToEdit?.insturance || "",
        Rc: selectedFMDataToEdit?.Rc || "",
      };
      if (lrList) {
        setLRList(lrList);
      }
      setFMData(fmData);
      setLRDataToFM(lrDataToFM);
    }
  }, [selectedFMDataToEdit]);

  function extractLRNumberOptions(LRData: LrInputs[]): Option[] {
    return LRData.map((data) => ({
      value: data.lrNumber,
      label: data.lrNumber,
    }));
  }

  const setFMDataToInputBox = async (data: LrInputs) => {
    if (lrList.length > 7) {
      toast.error("You can only add 8 LRs");
      return;
    }
    if (lrList.find((listData) => listData.lrNumber === data.lrNumber)) {
      setLRList((prev) =>
        prev.filter((listData) => listData.lrNumber !== data.lrNumber),
      );
    }
    setLRList((prev) => [
      ...prev,
      { lrNumber: data.lrNumber, date: data.date },
    ]);
    const vendor = await getVehicleByDataApi({
      vehicleNumber: data.vehicleNo,
      vehicletypes: data.vehicleType,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
    });
    if (vendor?.status === 200) {
      const vehicleData = vendor.data.data;
      setLRDataToFM((prev) => ({
        ...prev,
        lrNumber: data.lrNumber,
        date: data.date,
        from: data.from,
        to: data.to,
        weight: data.weight,
        packages: data.noOfPackages,
        payableAt: data.to,
        contactNumber: vehicleData.vendor.contactNumber,
        ContactPerson: vehicleData.vendor.contactPerson,
        driverName: vehicleData.driverName,
        ownerName: vehicleData.ownerName,
        TDS: vehicleData.vendor.TDS,
        insturance: vehicleData.insurance,
        Rc: vehicleData.RC,
        vehicleNo: vehicleData.vehicleNumber,
        vehicleType: vehicleData.vehicletypes,
        driverPhone: vehicleData.driverPhone,
        DriverName: vehicleData.driverName,
        vendorName: vehicleData.vendor.name,
        vendorEmail: vehicleData.vendor.email,
      }));
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (!id) {
      return;
    }
    const branchName = localStorage.getItem("branchName");
    if (!branchName) {
      return;
    }
    setBranchName(branchName);
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  useEffect(() => {
    setLRData(lrData);
  }, [lrData]);

  const onSubmit = async () => {
    setIsloading(true);
    if (!fmData.fmNumber || lrList.length === 0 || fmData.netBlance === 0) {
      toast.error("Please fill all the fields");
      setIsloading(false);
      return;
    }
    const data = { ...lrDataToFM, ...fmData, lrNumbers: lrList };
    if (formStatus === "create") {
      const response = await createFMApi(data);
      if (response?.status === 200) {
        toast.success("FM has been created");
        resetToDefault();
      } else if (response?.status === 201) {
        toast.warning("FM Number already exists");
        setFMNumberAlreadyExists(true);
        setTimeout(() => {
          setFMNumberAlreadyExists(false);
        }, 2000);
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else if (formStatus === "edit") {
      const response = await updateFMApi(data);
      if (response?.status === 200) {
        toast.success("FM has been updated");
        resetToDefault();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsloading(false);
  };
  return (
    <div className="flex flex-col gap-2 rounded-md bg-white p-5">
      <p className="text-xl font-medium">
        {formStatus === "edit" ? "Edit FM" : "Create FM"}
      </p>
      <div className="flex flex-wrap justify-between gap-5">
        <div className="flex w-[23%] flex-col gap-2">
          <label className="font-medium">FM#</label>
          <input
            className="border-primary rounded-md border p-2"
            value={fmData?.fmNumber}
            onChange={(e) => setFMData({ ...fmData, fmNumber: e.target.value })}
          />
          {fmNumberAlreadyExists && (
            <p className="text-sm text-red-500">FM Number is already exists</p>
          )}
        </div>
        <div className="flex w-[23%] flex-col gap-2">
          <label className="font-medium">Date</label>
          <input
            type="date"
            value={fmData?.date}
            onChange={(e) => setFMData({ ...fmData, date: e.target.value })}
            className="border-primary rounded-md border p-2"
          />
        </div>
        <div className="flex w-[23%] flex-col gap-2">
          <label className="font-medium">From</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.from}
          </p>
        </div>
        <div className="flex w-[23%] flex-col gap-2">
          <label className="font-medium">To</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.to}
          </p>
        </div>
        <div className="flex w-[18%] flex-col gap-2">
          <label className="font-medium">Vehicle No.</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.vehicleNo}
          </p>
        </div>
        <div className="flex w-[18%] flex-col gap-2">
          <label className="font-medium">Type of Vehicle</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.vehicleType}
          </p>
        </div>
        <div className="flex w-[18%] flex-col gap-2">
          <label className="font-medium">Weight</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.weight}
          </p>
        </div>
        <div className="flex w-[18%] flex-col gap-2">
          <label className="font-medium">Package</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.packages}
          </p>
        </div>
        <div className="flex w-[18%] flex-col gap-2">
          <label className="font-medium">Payable at</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.payableAt}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Vendor Name</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.vendorName}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Contact person</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.ContactPerson}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Driver Name</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.DriverName}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Contact No.</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.contactNumber}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Owner Name</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.ownerName}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">TDS</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.TDS}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Insurance</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.insturance}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">RC</label>
          <p className="border-primary rounded-md border p-2">
            {lrDataToFM.Rc}
          </p>
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Consignment Details</label>
          <div className="border-primary flex h-[20rem] flex-col justify-between gap-3 overflow-y-auto rounded-md border p-2">
            <div>
              <AntSelect
                className="w-full"
                size="large"
                placeholder="Select LR"
                onChange={(value) => {
                  const selectedLR = LRData.find((lr) => lr.lrNumber === value);
                  if (selectedLR) {
                    setFMDataToInputBox(selectedLR);
                  }
                }}
                showSearch
                options={extractLRNumberOptions(LRData)}
                style={{
                  border: "1px solid #64BAFF",
                  borderRadius: "10px",
                }}
              />
              <table className="w-1/2">
                <thead>
                  <tr>
                    <th className="text-start">LR/Consignment No.</th>
                    <th className="text-start">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {lrList?.map((listData, i) => (
                    <tr key={i} className="align-top">
                      <td className="text-start">{listData?.lrNumber}</td>
                      <td className="text-start">{listData?.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="bg-primary/50 w-fit rounded-md p-1 px-2 font-medium text-white" onClick={()=>setLRList([])}>
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="flex w-[49%] flex-col gap-1 p-2">
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Hire</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.hire}
              onChange={(e) =>
                setFMData({ ...fmData, hire: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Advance</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.advance}
              onChange={(e) =>
                setFMData({ ...fmData, advance: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Balance</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.balance}
              disabled
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Other charges</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.otherCharges}
              onChange={(e) =>
                setFMData({ ...fmData, otherCharges: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Detention</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.detentionCharges}
              onChange={(e) =>
                setFMData({
                  ...fmData,
                  detentionCharges: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">RTO/L/U Charges</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.rtoCharges}
              onChange={(e) =>
                setFMData({ ...fmData, rtoCharges: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">TDS (-1%)</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.tds}
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Net Balance</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.netBlance}
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Amount in words</label>
            <p className="border-primary w-1/2 rounded-md border p-2">
              {fmData?.amountInwords}
            </p>
          </div>
        </div>
        <div className="flex w-[42%] flex-col gap-2">
          <label className="font-medium">Declaration</label>
          <div className="border-primary flex flex-col gap-2 rounded-md border p-2 text-sm">
            <p className="font-medium">
              Declare that all documents relative to the above lorry are genuine
              and valid. I hold myself liable for any loss or damage to the
              goods entrusted to the for delivery and shall be bound to
              compenalte office of the challan
            </p>
            <div className="flex w-full items-center justify-between">
              <label className="font-medium">Driver Name</label>
              <input
                placeholder="Type here..."
                className="w-3/4 p-1 outline-none"
                value={lrDataToFM?.DriverName}
                onChange={(e) =>
                  setLRDataToFM({ ...lrDataToFM, DriverName: e.target.value })
                }
              />
            </div>
            <div className="flex w-full items-center justify-between">
              <label className="font-medium">DL No.</label>
              <input
                placeholder="Type here..."
                className="w-3/4 p-1 outline-none"
                value={fmData?.dlNumber}
                onChange={(e) =>
                  setFMData({ ...fmData, dlNumber: e.target.value })
                }
              />
            </div>
            <div className="flex w-full items-center justify-between">
              <label className="font-medium">Driver Signature</label>
              <input
                placeholder="Type here..."
                className="w-3/4 p-1 outline-none"
                value={fmData?.driverSignature}
                onChange={(e) =>
                  setFMData({ ...fmData, driverSignature: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex w-[42%] flex-col gap-2">
          <label className="font-medium">Declaration</label>
          <div className="border-primary flex h-full flex-col justify-between gap-2 rounded-md border p-2 text-sm font-medium">
            <p>
              I should Guarantee for the above lorry supplied by me and also for
              the goods entrusted to the said lorry for safe arrival at the
              destination
            </p>
            <p>Signature of the lorry guaranter</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium">Issuing Branch</label>
          <div className="text-sm font-medium">
            <p className="border-primary w-fit rounded-md border p-2">
              {branchName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-end gap-5">
        <Button
          variant={"outline"}
          className="border-primary text-primary"
          disabled={isloading}
          type="button"
          onClick={resetToDefault}
        >
          Back
        </Button>
        <Button disabled={isloading} onClick={onSubmit}>
          {isloading ? (
            <VscLoading size={24} className="animate-spin" />
          ) : formStatus === "edit" ? (
            "Update FM"
          ) : (
            "Create FM"
          )}
        </Button>
      </div>
    </div>
  );
}
