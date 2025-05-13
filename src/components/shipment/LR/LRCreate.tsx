import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  createLRApi,
  getLRApi,
  updateLRDetailsApi,
} from "../../../api/shipment";
import { getAllClientsApi } from "../../../api/admin";
import { toast } from "react-toastify";
import { VscLoading } from "react-icons/vsc";
import { getAllVendorsApi } from "@/api/partner";

const allOptions = [
  "unLoading",
  "extraKms",
  "detention",
  "weightment",
  "others",
];

type Option = { value: string; label: string };

export interface LrInputs {
  id: string;
  lrNumber: string;
  date: string;
  from: string;
  to: string;
  insurance: string;
  consignorName: string;
  consignorGSTIN: string;
  consignorPincode: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeGSTIN: string;
  consigneeGSTIN_1: string;
  consigneePincode: string;
  consigneeAddress: string;
  noOfPackages: string;
  methodOfPacking: string;
  description: string;
  invoiceNo: string;
  invoiceDate: string;
  value: string;
  weight: string;
  sizeL: string;
  sizeW: string;
  sizeH: string;
  ftl: string;
  vehicleNo: string;
  vehicleType: string;
  paymentType: string;
  freightCharges: string;
  hamali: string;
  surcharge: string;
  stCh: string;
  riskCh: string;
  unLoading: string;
  extraKms: string;
  detention: string;
  weightment: string;
  others: string;
  ewbNumber: string;
  ewbExpiryDate: string;
  totalAmt: number;
  adminId: string;
  branchId: string;
  driverName: string;
  driverPhone: string;
  emails: String[];
}

export default function LRCreate({
  resetToDefault,
  selectedLRDataToEdit,
  formStatus,
}: {
  resetToDefault: () => void;
  selectedLRDataToEdit?: LrInputs;
  formStatus: "edit" | "create" | "supplementary";
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [existingLRData, setExistingLRData] = useState<LrInputs[]>([]);
  const [branchId, setBranchId] = useState("");
  const [members, setMembers] = useState<VendorInputs[]>([]);
  const [size, setSize] = useState<string>("LxWxH");
  const [availableOptions, setAvailableOptions] = useState(allOptions);
  const [selectedFields, setSelectedFields] = useState<
    { label: string; value: string }[]
  >([]);
  const [isMemberNameMatched, setIsMemberNameMatched] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [lrNumberAlreadyExists, setLRNumberAlreadyExists] = useState(false);
  const [editAbleData, setEditAbleData] = useState<LrInputs | undefined>(
    selectedLRDataToEdit,
  );

  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<LrInputs>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (!id) {
      return;
    }
    setBranchId(id);
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  const setAllDataTOEdit = (data: LrInputs) => {
    if (data) {
      setValue("lrNumber", data.lrNumber);
      setValue("date", data.date);
      setValue("from", data.from);
      setValue("to", data.to);
      setValue("insurance", data.insurance);
      setValue("consignorName", data.consignorName);
      setValue("consignorGSTIN", data.consignorGSTIN);
      setValue("consignorPincode", data.consignorPincode);
      setValue("consignorAddress", data.consignorAddress);
      setValue("consigneeName", data.consigneeName);
      setValue("consigneeGSTIN", data.consigneeGSTIN);
      setValue("consigneeGSTIN_1", data.consigneeGSTIN);
      setValue("consigneePincode", data.consigneePincode);
      setValue("consigneeAddress", data.consigneeAddress);
      setValue("noOfPackages", data.noOfPackages);
      setValue("methodOfPacking", data.methodOfPacking);
      setValue("description", data.description);
      setValue("invoiceNo", data.invoiceNo);
      setValue("invoiceDate", data.invoiceDate);
      setValue("value", data.value);
      setValue("weight", data.weight);
      if (data.sizeL) {
        setSize("LxWxH");
        setValue("sizeL", data.sizeL);
        setValue("sizeW", data.sizeW);
        setValue("sizeH", data.sizeH);
      } else {
        setSize("FTL");
        setValue("ftl", data.ftl);
      }
      setValue("vehicleNo", data.vehicleNo);
      setValue("vehicleType", data.vehicleType);
      setValue("driverName", data.driverName);
      setValue("driverPhone", data.driverPhone);
      setValue("paymentType", data.paymentType);
      setValue("freightCharges", data.freightCharges);
      setValue("hamali", data.hamali);
      setValue("surcharge", data.surcharge);
      setValue("stCh", data.stCh);
      setValue("riskCh", data.riskCh);
      setValue("unLoading", data.unLoading);
      setValue("extraKms", data.extraKms);
      setValue("detention", data.detention);
      setValue("weightment", data.weightment);
      setValue("others", data.others);
      setValue("ewbNumber", data.ewbNumber);
      if (data.ewbExpiryDate)
        setValue(
          "ewbExpiryDate",
          new Date(data.ewbExpiryDate)?.toISOString().split("T")[0],
        );

      setValue("adminId", data.adminId);
      setValue("branchId", data.branchId);
      setValue("emails", data.emails);

      const filledFields = allOptions
        .filter(
          (field) =>
            data[field as keyof LrInputs] !== undefined &&
            data[field as keyof LrInputs] !== null,
        )
        .map((field) => ({
          label: field,
          value: data[field as keyof LrInputs]?.toString() ?? "",
        }));

      setSelectedFields(filledFields);

      setAvailableOptions(
        allOptions.filter(
          (field) => !filledFields.some((f) => f.label === field),
        ),
      );
    }

    setSelectedEmails([data.emails.join(", ")]);
  };

  const amounts = useWatch({
    control,
    name: [
      "freightCharges",
      "hamali",
      "surcharge",
      "stCh",
      "riskCh",
      "unLoading",
      "extraKms",
      "detention",
      "weightment",
      "others",
    ],
  });
  const consignorName = useWatch({ control, name: "consignorName" });
  const consigneeName = useWatch({ control, name: "consigneeName" });

  useEffect(() => {
    if (consignorName && consigneeName && consignorName === consigneeName) {
      setIsMemberNameMatched(true);
    } else {
      setIsMemberNameMatched(false);
    }
  }, [consignorName, consigneeName]);
  const getTheTotalAmount = () => {
    return amounts?.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  useEffect(() => {
    if (amounts) {
      setValue("totalAmt", getTheTotalAmount());
    }
  }, [amounts]);

  useEffect(() => {
    setEditAbleData(selectedLRDataToEdit);
    if (formStatus === "edit" && editAbleData) {
      setAllDataTOEdit(editAbleData);
    }
  }, [selectedLRDataToEdit]);

  const handleSelect = (value: string) => {
    setSelectedFields((prev) => [...prev, { label: value, value: "" }]);
    setAvailableOptions((prev) => prev.filter((opt) => opt !== value));
  };

  const handleChange = (label: string, value: string) => {
    setSelectedFields((prev) =>
      prev.map((field) =>
        field.label === label ? { ...field, value } : field,
      ),
    );
  };

  function extractVehicleNumberOptions(vendors: VendorInputs[]): Option[] {
    return vendors.flatMap(
      (vendor) =>
        vendor.vehicles?.map((vehicle) => ({
          value: vehicle.vehicleNumber,
          label: vehicle.vehicleNumber,
        })) || [],
    );
  }

  function extractMemberOptions(vendors: VendorInputs[]): Option[] {
    return vendors.map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
    }));
  }

  function extractLRNumberOptions(LRData: LrInputs[]): Option[] {
    const lrCountMap: Record<string, number> = {};
  
    for (const data of LRData) {
      const [baseLR, suffix] = data.lrNumber.split("/");
      const base = baseLR.trim();
      const version = suffix ? parseInt(suffix) : 0; // <-- fix here
  
      lrCountMap[base] = Math.max(lrCountMap[base] || 0, version);
    }
  
    return Object.entries(lrCountMap).map(([baseLR, version]) => {
      const nextVersion = version + 1;
      const formattedLR = `${baseLR}/${nextVersion}`;
      return {
        value: formattedLR,
        label: formattedLR,
      };
    });
  }
  
  

  async function fetchVendors() {
    const responseVendors = await getAllVendorsApi();
    const responseClients = await getAllClientsApi();
    if (responseVendors?.status === 200 && responseClients?.status === 200) {
      setMembers(responseVendors.data.data.concat(responseClients.data.data));
    }
  }
  async function fetchLRData() {
    const response = await getLRApi();
    if (response?.status === 200) {
      setExistingLRData(response.data.data);
    }
  }

  useEffect(() => {
    fetchVendors();
    fetchLRData();
  }, []);

  const setLRData = (data: LrInputs) => {
    setValue("from", data.from);
    setValue("to", data.to);
    setValue("insurance", data.insurance);
    setValue("consignorName", data.consignorName);
    setValue("consignorGSTIN", data.consignorGSTIN);
    setValue("consignorPincode", data.consignorPincode);
    setValue("consignorAddress", data.consignorAddress);
    setValue("consigneeName", data.consigneeName);
    setValue("consigneeGSTIN", data.consigneeGSTIN);
    setValue("consigneeGSTIN_1", data.consigneeGSTIN);
    setValue("consigneePincode", data.consigneePincode);
    setValue("consigneeAddress", data.consigneeAddress);
  };

  const setConsignorData = (data: VendorInputs) => {
    setValue("consignorGSTIN", data.GSTIN);
    setValue("consignorPincode", data.pincode);
    setValue("consignorAddress", data.address);
    setValue("from", data.city);
    if (!selectedEmails.includes(data.email)) {
      setSelectedEmails((prev) => [...prev, data.email]);
    }
  };

  const setConsigneeData = (data: VendorInputs) => {
    setValue("consigneeGSTIN", data.GSTIN);
    setValue("consigneeGSTIN_1", data.GSTIN);
    setValue("consigneePincode", data.pincode);
    setValue("consigneeAddress", data.address);
    setValue("to", data.city);
    if (!selectedEmails.includes(data.email)) {
      setSelectedEmails((prev) => [...prev, data.email]);
    }
  };

  const setVechicleData = (data: VehicleInputs) => {
    setValue("vehicleType", data.vehicletypes);
    setValue("driverName", data.driverName);
    setValue("driverPhone", data.driverPhone);
  };

  const onSubmit = async (data: LrInputs) => {
    setIsloading(true);
    if (isAdmin && branchId) {
      data.adminId = branchId;
    } else if (!isAdmin && branchId) {
      data.branchId = branchId;
    }
    if (selectedEmails)
      data.emails = selectedEmails.filter((email: string) => email !== "");

    if (formStatus === "create" || formStatus === "supplementary") {
      const response = await createLRApi(data);
      if (response?.status === 200) {
        toast.success("LR has been created");
        resetToDefault();
      } else if (response?.status === 201) {
        toast.error("LR Number already exists");
        setLRNumberAlreadyExists(true);
        setTimeout(() => {
          setLRNumberAlreadyExists(false);
        }, 2000);
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      const response = await updateLRDetailsApi(data, data.id);
      if (response?.status === 200) {
        toast.success("LR has been updated");
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
        {formStatus === "edit" ? "Edit LR" : formStatus === "supplementary" ? "Add Supplementary" : "Create LR"}
      </p>
      <form
        className="flex flex-wrap justify-between gap-5"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="w-[18%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">LR#</label>
            {formStatus !== "supplementary" && (
              <input
                className={`border-primary rounded-md border p-2 ${formStatus === "edit" && "cursor-not-allowed"}`}
                {...register("lrNumber", { required: true })}
                disabled={formStatus === "edit"}
              />
            )}
            {formStatus === "supplementary" && (
              <Controller
                name="lrNumber"
                control={control}
                defaultValue={""}
                rules={{ required: "Please enter a vaild LR number" }}
                render={({ field }) => (
                  <AntSelect
                    {...field}
                    size="large"
                    onChange={(value) => {
                      field.onChange(value);
                      const baseLR = value.split("/")[0];
                      const match = existingLRData.find((lr) =>
                        lr.lrNumber.startsWith(baseLR),
                      );

                      if (match) {
                        setLRData(match);
                      }
                    }}
                    showSearch
                    options={extractLRNumberOptions(existingLRData)}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
            )}
            {errors.lrNumber && (
              <p className="text-red-500">Please enter a vaild LR number</p>
            )}
            {lrNumberAlreadyExists && (
              <p className="text-red-500">
                LR number already exists, please try another one
              </p>
            )}
          </div>
        </div>
        <div className="w-[18%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Date</label>
            <input
              type="date"
              className="border-primary rounded-md border p-2"
              {...register("date", { required: true })}
            />
            {errors.date && (
              <p className="text-red-500">Please enter a vaild date</p>
            )}
          </div>
        </div>
        <div className="w-[18%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">From</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("from", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.from && (
              <p className="text-red-500">Please enter a vaild from field</p>
            )}
          </div>
        </div>
        <div className="w-[18%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">To</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("to", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.to && (
              <p className="text-red-500">Please enter a vaild to field</p>
            )}
          </div>
        </div>
        <div className="w-[18%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Insurance</label>
            <Controller
              name="insurance"
              control={control}
              defaultValue={""}
              rules={{ required: "Please select insurance" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={formStatus === "supplementary"}
                >
                  <SelectTrigger className="boder border-primary h-full w-full py-5 shadow-none data-[placeholder]:text-black">
                    <SelectValue />
                    <div></div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Insured">Insured</SelectItem>
                    <SelectItem value="Not Insured">Not Insured</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.insurance && (
              <p className="text-red-500">Please select insurance</p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignor’s Name</label>
            <Controller
              name="consignorName"
              control={control}
              defaultValue={""}
              rules={{ required: "Please enter consignor name" }}
              render={({ field }) => (
                <AntSelect
                  {...field}
                  size="large"
                  onChange={(value) => {
                    field.onChange(value);
                    const selectedVendor = members.find(
                      (v) => v.name === value,
                    );
                    if (selectedVendor) {
                      setConsignorData(selectedVendor);
                    }
                  }}
                  showSearch
                  options={extractMemberOptions(members)}
                  style={{
                    border: "1px solid #64BAFF",
                    borderRadius: "10px",
                  }}
                  disabled={formStatus === "supplementary"}
                />
              )}
            />
            {errors.consignorName && (
              <p className="text-red-500">Please select consignor name</p>
            )}
            {isMemberNameMatched && (
              <p className="text-red-500">
                Consignor and consignee name should be different
              </p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignor’s GSTIN</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("consignorGSTIN", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consignorGSTIN && (
              <p className="text-red-500">Please enter a vaild GSTIN</p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignor’s Pincode</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("consignorPincode", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consignorPincode && (
              <p className="text-red-500">Please enter a vaild pincode</p>
            )}
          </div>
        </div>
        <div className="w-full">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignor’s Address</label>
            <textarea
              className="border-primary rounded-md border p-2"
              {...register("consignorAddress", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consignorAddress && (
              <p className="text-red-500">
                Please enter a vaild consignors address
              </p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignee’s Name</label>
            <Controller
              name="consigneeName"
              control={control}
              defaultValue={""}
              rules={{ required: "Please enter consigneeName name" }}
              render={({ field }) => (
                <AntSelect
                  {...field}
                  size="large"
                  onChange={(value) => {
                    field.onChange(value);
                    const selectedVendor = members.find(
                      (v) => v.name === value,
                    );
                    if (selectedVendor) {
                      setConsigneeData(selectedVendor);
                    }
                  }}
                  showSearch
                  options={extractMemberOptions(members)}
                  style={{
                    border: "1px solid #64BAFF",
                    borderRadius: "10px",
                  }}
                  disabled={formStatus === "supplementary"}
                />
              )}
            />
            {errors.consigneeName && (
              <p className="text-red-500">Please select consignee name</p>
            )}
            {isMemberNameMatched && (
              <p className="text-red-500">
                Consignor and consignee name should be different
              </p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignee’s GSTIN</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("consigneeGSTIN", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consigneeGSTIN && (
              <p className="text-red-500">Please enter a vaild GSTIN</p>
            )}
          </div>
        </div>
        <div className="w-[32%]">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignee’s Pincode</label>
            <input
              className="border-primary rounded-md border p-2"
              {...register("consigneePincode", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consigneePincode && (
              <p className="text-red-500">Please enter a vaild pincode</p>
            )}
          </div>
        </div>
        <div className="w-full">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Consignee’s Address</label>
            <textarea
              className="border-primary rounded-md border p-2"
              {...register("consigneeAddress", { required: true })}
              disabled={formStatus === "supplementary"}
            />
            {errors.consigneeAddress && (
              <p className="text-red-500">
                Please enter a vaild consignee address
              </p>
            )}
          </div>
        </div>

        <div className="w-full">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border-primary rounded-tl-lg border p-1 px-3 text-start font-medium">
                  No of Packages
                </th>
                <th className="border-primary border p-1 px-3 text-start font-medium">
                  Method of Packing
                </th>
                <th className="border-primary border p-1 px-3 text-start font-medium">
                  Description (said to contain)
                </th>
                <th className="border-primary border p-1 px-3 text-start font-medium">
                  Weight
                </th>
                <th className="border-primary border p-1 px-3 text-start font-medium">
                  <Select
                    value={size}
                    onValueChange={setSize}
                    defaultValue="LxWxH"
                  >
                    <SelectTrigger className="w-full border-none shadow-none data-[placeholder]:text-black">
                      Size
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LxWxH">LxWxH</SelectItem>
                      <SelectItem value="FTL">FTL</SelectItem>
                    </SelectContent>
                  </Select>
                </th>
                <th className="border-primary border p-1 px-3 font-medium">
                  Vehicle details
                </th>
                <th className="border-primary rounded-tr-2xl border p-1 px-3 font-medium">
                  <p>Rate</p>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm">
                <td className="border-primary border p-2 align-top">
                  <input
                    className="w-full outline-none"
                    placeholder="Type here..."
                    {...register("noOfPackages", { required: true })}
                  />
                  {errors.noOfPackages && (
                    <p className="mt-2 text-red-500">
                      No of Packages is required
                    </p>
                  )}
                </td>
                <td className="border-primary border p-2 align-top">
                  <input
                    className="w-full outline-none"
                    placeholder="Type here..."
                    {...register("methodOfPacking", { required: true })}
                  />
                  {errors.methodOfPacking && (
                    <p className="mt-2 text-red-500">
                      Method of packing is required
                    </p>
                  )}
                </td>
                <td className="border-primary border px-2 pl-2 align-top">
                  <div className="flex flex-col items-center justify-between gap-10">
                    <textarea
                      className="w-full p-2 outline-none"
                      placeholder="Type here..."
                      {...register("description", { required: true })}
                    />
                    {errors.description && (
                      <p className="w-full text-start text-red-500">
                        Description is required
                      </p>
                    )}
                  </div>
                  <div className="mt-10">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">Consignee GSTIN</p>
                      <input
                        placeholder="Type here..."
                        className="p-1 outline-none"
                        {...register("consigneeGSTIN_1")}
                        disabled={formStatus === "supplementary"}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">Invoice no.</p>
                      <input
                        placeholder="Type here..."
                        className="p-1 outline-none"
                        {...register("invoiceNo")}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">Invoice date</p>
                      <input
                        placeholder="Type here..."
                        className="p-1 outline-none"
                        type="date"
                        {...register("invoiceDate")}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">Value</p>
                      <input
                        placeholder="Type here..."
                        className="p-1 outline-none"
                        type="number"
                        {...register("value")}
                      />
                    </div>
                  </div>
                </td>
                <td className="border-primary border p-2 align-top">
                  <input
                    className="w-full outline-none"
                    placeholder="Type here..."
                    {...register("weight", { required: true })}
                  />
                  {errors.weight && (
                    <p className="mt-2 text-red-500">Weight is required</p>
                  )}
                </td>
                <td className="border-primary w-[10%] border px-1 align-top">
                  {size === "LxWxH" && (
                    <div className="flex w-full items-center justify-around pt-2">
                      <input
                        placeholder="L"
                        className="w-[30%] rounded border p-1 outline-none"
                        {...register("sizeL", {
                          required: size === "LxWxH",
                        })}
                      />
                      <p>x</p>
                      <input
                        placeholder="X"
                        className="w-[30%] rounded border p-1 outline-none"
                        {...register("sizeW", {
                          required: size === "LxWxH",
                        })}
                      />
                      <p>x</p>
                      <input
                        placeholder="W"
                        className="w-[30%] rounded border p-1 outline-none"
                        {...register("sizeH", {
                          required: size === "LxWxH",
                        })}
                      />
                    </div>
                  )}
                  {(errors.sizeH || errors.sizeW || errors.sizeL) && (
                    <p className="mt-2 text-red-500">Size is required</p>
                  )}
                  {size === "FTL" && (
                    <div className="flex w-full items-center justify-around pt-2">
                      <label>FTL</label>
                      <input
                        placeholder="Type here..."
                        className="w-full p-1 outline-none"
                        {...register("ftl", { required: size === "FTL" })}
                      />
                    </div>
                  )}
                  {errors.ftl && (
                    <p className="text-red-500">FTL is required</p>
                  )}
                </td>
                <td className="border-primary border p-2 align-top">
                  <div className="flex flex-col items-center justify-between gap-20">
                    <div>
                      <div className="flex items-center gap-5">
                        <p className="text-xs font-medium">Vehicle No.</p>
                        <Controller
                          name="vehicleNo"
                          control={control}
                          defaultValue=""
                          rules={{ required: "Please select a vehicle" }}
                          render={({ field }) => (
                            <AntSelect
                              showSearch
                              placeholder="Select vehicle... "
                              options={extractVehicleNumberOptions(members)}
                              className="w-[50%]"
                              size="middle"
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                                const selectedVehicle = members
                                  .flatMap((v) => v.vehicles)
                                  .find((veh) => veh.vehicleNumber === value);
                                if (selectedVehicle) {
                                  setVechicleData(selectedVehicle);
                                }
                              }}
                            />
                          )}
                        />
                      </div>
                      {errors.vehicleNo && (
                        <p className="text-red-500">
                          Vehicle number is required
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">Vehicle Type</p>
                        <input
                          className="p-2 outline-none"
                          placeholder="Vehicle Type"
                          {...register("vehicleType", { required: true })}
                        />
                      </div>
                      {errors.vehicleType && (
                        <p className="text-red-500">Vehicle type is required</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">Driver Number</p>
                        <input
                          className="p-2 outline-none"
                          placeholder="Type here..."
                          {...register("driverName", { required: true })}
                        />
                      </div>
                      {errors.driverName && (
                        <p className="text-red-500">Driver Name is required</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">Driver Phone</p>
                        <input
                          className="p-2 outline-none"
                          placeholder="Type here..."
                          {...register("driverPhone", { required: true })}
                        />
                      </div>
                      {errors.driverPhone && (
                        <p className="text-red-500">Driver Phone is required</p>
                      )}
                    </div>
                    <div className="flex w-full flex-col items-center">
                      <div className="flex w-full items-center justify-between">
                        <label className="font-medium">Payment type</label>
                        <Controller
                          name="paymentType"
                          control={control}
                          defaultValue="To Pay"
                          rules={{
                            required: "Please select a payment type",
                          }}
                          render={({ field }) => (
                            <Select
                              defaultValue="To Pay"
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="border-none shadow-none data-[placeholder]:text-black">
                                <SelectValue placeholder="To Pay" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="To Pay">To Pay</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Billed">Billed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      {errors.paymentType && (
                        <p className="w-full text-start text-red-500">
                          Payment type is required
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="border-primary border p-2 align-top">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <p className="text-xs font-medium">Freight Charges</p>
                      <input
                        className="border-primary rounded-md border p-1"
                        type="number"
                        {...register("freightCharges")}
                      />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-medium">Hamali</p>
                      <input
                        type="number"
                        className="border-primary rounded-md border p-1"
                        {...register("hamali")}
                      />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-medium">Surcharge</p>
                      <input
                        type="number"
                        className="border-primary rounded-md border p-1"
                        {...register("surcharge")}
                      />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-medium">ST. Ch.</p>
                      <input
                        type="number"
                        className="border-primary rounded-md border p-1"
                        {...register("stCh")}
                      />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs font-medium">Risk Ch.</p>
                      <input
                        type="number"
                        className="border-primary rounded-md border p-1"
                        {...register("riskCh")}
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-2">
                      {selectedFields.map(({ label }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-2"
                        >
                          <label className="text-xs font-medium capitalize">
                            {label === "extraKms" ? "Extra KMs/Weight" : label}
                          </label>
                          <Controller
                            control={control}
                            name={label as keyof LrInputs}
                            defaultValue=""
                            render={({ field }) => (
                              <input
                                type="number"
                                value={
                                  typeof field.value === "string" ||
                                  typeof field.value === "number"
                                    ? field.value
                                    : ""
                                }
                                onChange={(e) => [
                                  field.onChange(e.target.value),
                                  handleChange(label, e.target.value),
                                ]}
                                className="border-primary rounded-md border p-1"
                              />
                            )}
                          />
                        </div>
                      ))}

                      {availableOptions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Select onValueChange={handleSelect}>
                            <SelectTrigger className="border-none p-0 shadow-none data-[placeholder]:text-black">
                              Others
                            </SelectTrigger>
                            <SelectContent>
                              {availableOptions.map((opt) => (
                                <SelectItem
                                  value={opt}
                                  key={opt}
                                  className="capitalize"
                                >
                                  {opt === "extraKms"
                                    ? "Extra KMs/Weight"
                                    : opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="border-primary flex items-center justify-end gap-2 border p-2 px-3">
            <p className="text-sm font-medium">Total INR </p>
            <input
              className="w-[5%] cursor-default outline-none"
              type="number"
              {...register("totalAmt")}
              readOnly
            />
          </div>
          <div className="flex w-full justify-between py-2">
            <div className="flex w-[49%] flex-col gap-2">
              <label className="font-medium">EWB Number</label>
              <input
                className="border-primary rounded-md border p-2"
                {...register("ewbNumber")}
              />
            </div>
            <div className="flex w-[49%] flex-col gap-2">
              <label className="font-medium">EWB Expiry date</label>
              <input
                className="border-primary rounded-md border p-2"
                type="date"
                {...register("ewbExpiryDate")}
              />
            </div>
          </div>
        </div>
        <div className="flex w-full justify-end gap-5">
          <Button
            variant={"outline"}
            className="border-primary text-primary"
            disabled={isloading}
            type="button"
            onClick={() => [resetToDefault(), reset()]}
          >
            Back
          </Button>
          <Button disabled={isloading}>
            {isloading ? (
              <VscLoading size={24} className="animate-spin" />
            ) : formStatus === "edit" ? (
              "Update LR"
            ) : (
              formStatus === "supplementary" ? "Add Supplementary" : "Create LR"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
