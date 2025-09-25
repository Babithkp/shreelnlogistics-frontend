import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { Select as AntSelect } from "antd";
import { createFMApi, updateFMApi } from "../../../api/shipment";
import { toast } from "react-toastify";
import { VscLoading } from "react-icons/vsc";
import { getAllVendorsApi, getVehicleByIdApi } from "@/api/partner";
import { BranchDetails } from "./FMPage";
import { numberToIndianWords } from "@/lib/utils";
import { FMInputs, LrInputs, VendorInputs } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createNotificationApi } from "@/api/admin";

type Option = { value: string; label: string };

export default function FMCreate({
  resetToDefault,
  selectedFMDataToEdit,
  formStatus,
  lrData,
  branchDetails,
  onRefresh,
}: {
  resetToDefault: () => void;
  selectedFMDataToEdit?: FMInputs;
  formStatus: "edit" | "create";
  lrData: LrInputs[];
  branchDetails?: BranchDetails;
  onRefresh: () => void;
}) {
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
  const [isloading, setIsloading] = useState(false);
  const [fmNumberAlreadyExists, setFMNumberAlreadyExists] = useState(false);
  const [branchId, setBranchId] = useState({
    branchId: "",
    adminId: "",
  });
  const [branchData, setBranchData] = useState({
    id: "",
    branchName: "",
  });
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [notificationData, setNotificationData] =
    useState<Record<string, any>>();
  const [lrList, setLRList] = useState<{ lrNumber: string; date: string }[]>(
    [],
  );
  const [fmData, setFMData] = useState({
    date: new Date().toISOString().split("T")[0],
    fmNumber: "",
    hire: "",
    advance: "",
    balance: "",
    otherCharges: "",
    detentionCharges: "",
    rtoCharges: "",
    tds: "", // hire+ other + detention + rto * 0.01
    netBalance: "", // balance + others + detention + rto - tds
    amountInwords: "",
    dlNumber: "",
    driverSignature: "",
    vendorsId: "",
  });
  const [lrDataToFM, setLRDataToFM] = useState({
    lrNumber: "",
    from: "-",
    to: "-",
    vehicleNo: "-",
    vehicleType: "-",
    weight: "0",
    packages: "0",
    payableAt: "",
    vendorName: "-",
    vendorEmail: "-",
    ContactPerson: "-",
    DriverName: "-",
    contactNumber: "-",
    ownerName: "-",
    TDS: "-",
    insturance: "-",
    Rc: "-",
    currentOutStanding: 0,
    sizeL: "",
    sizeW: "",
    sizeH: "",
    ftl: "",
  });

  useEffect(() => {
    let tds = 0;
    const hire = parseFloat(fmData.hire) || 0;
    const advance = parseFloat(fmData.advance) || 0;
    const otherCharges = parseFloat(fmData.otherCharges) || 0;
    const detentionCharges = parseFloat(fmData.detentionCharges) || 0;
    const rtoCharges = parseFloat(fmData.rtoCharges) || 0;

    const balance = hire - advance;

    if (lrDataToFM?.TDS === "Not-declared") {
      tds = hire * 0.01;
    }

    const netBalance =
      balance + otherCharges + detentionCharges + rtoCharges - tds;

    setFMData((prev) => ({
      ...prev,
      tds: tds.toFixed(2), // optional: format to 2 decimals
      balance: balance.toFixed(2),
      netBalance: netBalance.toFixed(2),
      amountInwords: numberToIndianWords(netBalance),
    }));
  }, [
    fmData.hire,
    fmData.advance,
    fmData.otherCharges,
    fmData.detentionCharges,
    fmData.rtoCharges,
    lrDataToFM?.TDS,
  ]);

  console.log(selectedFMDataToEdit);

  useEffect(() => {
    if (formStatus === "edit") {
      const lrList = selectedFMDataToEdit?.LRDetails;

      const fmData = {
        vendorsId: selectedFMDataToEdit?.vendorsId || "",
        date: selectedFMDataToEdit?.date || "",
        fmNumber: selectedFMDataToEdit?.fmNumber || "",
        hire: selectedFMDataToEdit?.hire || "",
        advance: selectedFMDataToEdit?.advance || "",
        balance: selectedFMDataToEdit?.balance || "",
        otherCharges: selectedFMDataToEdit?.otherCharges || "",
        detentionCharges: selectedFMDataToEdit?.detentionCharges || "",
        rtoCharges: selectedFMDataToEdit?.rtoCharges || "",
        tds: selectedFMDataToEdit?.tds || "",
        netBalance: selectedFMDataToEdit?.netBalance || "",
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
        payableAt: selectedFMDataToEdit?.payableAt || "",
        vendorName: selectedFMDataToEdit?.vendorName || "",
        vendorEmail: selectedFMDataToEdit?.vendorEmail || "",
        ContactPerson: selectedFMDataToEdit?.ContactPerson || "",
        DriverName: selectedFMDataToEdit?.DriverName || "",
        contactNumber: selectedFMDataToEdit?.contactNumber || "",
        ownerName: selectedFMDataToEdit?.ownerName || "",
        TDS: selectedFMDataToEdit?.TDS || "",
        insturance: selectedFMDataToEdit?.insturance || "",
        Rc: selectedFMDataToEdit?.Rc || "",
        emails: selectedFMDataToEdit?.emails || [],
        currentOutStanding: selectedFMDataToEdit?.currentOutStanding || 0,
        sizeL: selectedFMDataToEdit?.sizeL || "",
        sizeW: selectedFMDataToEdit?.sizeW || "",
        sizeH: selectedFMDataToEdit?.sizeH || "",
        ftl: selectedFMDataToEdit?.ftl || "",
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
    const vendor = await getVehicleByIdApi(data.vehicleId);
    if (vendor?.status === 200) {
      const vehicleData = vendor.data.data;
      setLRDataToFM((prev) => ({
        ...prev,
        lrNumber: data.lrNumber,
        date: data.date,
        from: data.from,
        to: data.to,
        sizeH: data.sizeH,
        sizeW: data.sizeW,
        sizeL: data.sizeL,
        ftl: data.ftl,
        weight: (
          parseFloat(prev.weight || "0") + parseFloat(data.weight || "0")
        ).toFixed(2),
        packages: (
          parseFloat(prev.packages || "0") +
          parseFloat(data.noOfPackages || "0")
        ).toFixed(2),
        emails: data.emails,
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
    setLRData(lrData);
  }, [lrData]);

  const onSubmit = async () => {
    setIsloading(true);
    if (
      !fmData.fmNumber ||
      lrList.length === 0 ||
      fmData.netBalance === "" ||
      lrDataToFM.payableAt === "" ||
      lrDataToFM.weight === "" ||
      lrDataToFM.packages === "" ||
      fmData.amountInwords === ""
    ) {
      toast.error("Please fill all the fields");
      setIsloading(false);
      return;
    }
    const data = {
      ...lrDataToFM,
      ...fmData,
      LRDetails: lrList,
      branchId: branchId.branchId,
      adminId: branchId.adminId,
    };

    if (formStatus === "create") {
      const response = await createFMApi(data);
      if (response?.status === 200) {
        toast.success("FM has been created");
        resetToDefault();
        onRefresh();
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
      if (branchId.branchId) {
        data.fmNumber =
          selectedFMDataToEdit?.fmNumber &&
          selectedFMDataToEdit?.fmNumber !== ""
            ? selectedFMDataToEdit?.fmNumber
            : data.fmNumber;
        setNotificationData(data);

        setNotificationAlertOpen(true);
        setIsloading(false);
        return;
      }
      const response = await updateFMApi(data);
      if (response?.status === 200) {
        toast.success("FM has been updated");
        resetToDefault();
        onRefresh();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsloading(false);
  };

  async function fetchVendorsData() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setVendors(response.data.data);
    }
  }

  const onNotificationSubmit = async () => {
    if (!selectedFMDataToEdit) return;
    const data = {
      requestId: selectedFMDataToEdit.fmNumber,
      title: "FM edit",
      message: branchData.branchName,
      description: branchData.id,
      status: "editable",
      data: JSON.stringify(notificationData),
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
      resetToDefault();
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setNotificationAlertOpen(false);
  };

  useEffect(() => {
    fetchVendorsData();

    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetails = localStorage.getItem("branchDetails");
    if (isAdmin === "true" && branchDetails) {
      const branchData = JSON.parse(branchDetails);
      setBranchId({
        branchId: "",
        adminId: branchData.id,
      });
      setBranchData({
        id: branchData.id,
        branchName: branchData.branchName,
      });
    } else if (isAdmin === "false" && branchDetails) {
      const branchData = JSON.parse(branchDetails);
      setBranchId({
        branchId: branchData.id,
        adminId: "",
      });
      setBranchData({
        id: branchData.id,
        branchName: branchData.branchName,
      });
    }
  }, []);

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
          <input
            value={lrDataToFM.payableAt}
            onChange={(e) =>
              setLRDataToFM({ ...lrDataToFM, payableAt: e.target.value })
            }
            className="border-primary rounded-md border p-2"
          />
        </div>
        <div className="flex w-[49%] flex-col gap-2">
          <label className="font-medium">Vendor Name</label>
          <AntSelect
            showSearch
            placeholder="Select Vendor... "
            className="border-primary rounded-md border outline"
            value={lrDataToFM?.vendorName}
            options={vendors.map((vendor) => ({
              value: vendor.name,
              label: vendor.name,
            }))}
            onChange={(value) => {
              setLRDataToFM((prev) => ({ ...prev, vendorName: value }));
              const selectedVendor = vendors.find((v) => v.name === value);

              if (selectedVendor) {
                const allLRs: LrInputs[] = selectedVendor.vehicles.flatMap(
                  (vehicle) => vehicle.LR || [],
                );
                const filteredLR = allLRs.filter(
                  (lr) =>
                    !selectedVendor.FM.some((fm) =>
                      fm.LRDetails.some(
                        (detail) => detail.lrNumber === lr.lrNumber,
                      ),
                    ),
                );
                if (branchId.branchId) {
                  setLRData(
                    filteredLR.filter(
                      (lr) => lr.branchId === branchId.branchId,
                    ),
                  );
                } else {
                  setLRData(filteredLR);
                }
                setFMData({ ...fmData, vendorsId: value });
              }
            }}
            size="large"
            allowClear
            style={{
              border: "1px solid #64BAFF",
              borderRadius: "10px",
              outline: "none",
            }}
          />
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
            {lrDataToFM.DriverName === ""
              ? "-"
              : lrDataToFM.DriverName
                ? lrDataToFM.DriverName
                : "-"}
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
                disabled={selectedFMDataToEdit?.WriteOff != null}
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
                allowClear
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
              <Button
                className="bg-primary/50 w-fit rounded-md p-1 px-3 font-medium text-white"
                onClick={() => setLRList([])}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
        <div className="flex w-[49%] flex-col gap-1 p-2">
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Hire</label>
            <input
              disabled={selectedFMDataToEdit?.WriteOff != null}
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.hire}
              onChange={(e) => setFMData({ ...fmData, hire: e.target.value })}
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Advance (To be Paid)</label>
            <input
              disabled={selectedFMDataToEdit?.WriteOff != null}
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.advance}
              onChange={(e) =>
                setFMData({ ...fmData, advance: e.target.value })
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
              disabled={selectedFMDataToEdit?.WriteOff != null}
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.otherCharges}
              onChange={(e) =>
                setFMData({ ...fmData, otherCharges: e.target.value })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Detention</label>
            <input
              disabled={selectedFMDataToEdit?.WriteOff != null}
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.detentionCharges}
              onChange={(e) =>
                setFMData({
                  ...fmData,
                  detentionCharges: e.target.value,
                })
              }
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">RTO/L/U Charges</label>
            <input
              disabled={selectedFMDataToEdit?.WriteOff != null}
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.rtoCharges}
              onChange={(e) =>
                setFMData({ ...fmData, rtoCharges: e.target.value })
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
              disabled
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Net Balance</label>
            <input
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              type="number"
              placeholder="Type here..."
              value={fmData?.netBalance}
              disabled
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2">
            <label className="font-medium">Amount in words</label>
            <textarea
              disabled
              placeholder="Type here..."
              className="border-primary w-1/2 rounded-md border px-2 py-1"
              value={fmData?.amountInwords}
              onChange={(e) =>
                setFMData({ ...fmData, amountInwords: e.target.value })
              }
            />
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
              {branchDetails?.branchName}
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
      <AlertDialog
        open={notificationAlertOpen}
        onOpenChange={setNotificationAlertOpen}
      >
        <AlertDialogTrigger className="cursor-pointer"></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alert!</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-black">
              This will send the admin an edit request. Upon approval the
              changes will be updated
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onNotificationSubmit}>
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
