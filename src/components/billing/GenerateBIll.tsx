import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Select as AntSelect } from "antd";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import {
  createNotificationApi,
  getAllClientsApi,
  getBillIdApi,
} from "@/api/admin";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import {
  checkBillExistsApi,
  createBillApi,
  createBillsupplementaryApi,
  updateBillDetailsApi,
} from "@/api/billing";
import { VscLoading } from "react-icons/vsc";
import { getBankDetailsApi, getCompanyProfileApi } from "@/api/settings";
import { BankDetailsInputs } from "../settings/Settings";
import { MdDeleteOutline } from "react-icons/md";
import { billInputs, ClientInputs, LrInputs } from "@/types";
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
import { numberToIndianWords } from "@/lib/utils";

type Option = { value: string; label: string };

export default function GenerateBIll({
  selectedBillToEdit,
  sectionChangeHandler,
  setSelectedBillToEdit,
  clientData,
  supplementary,
}: {
  selectedBillToEdit?: billInputs | null;
  sectionChangeHandler: (section: any) => void;
  setSelectedBillToEdit: (data: billInputs | null) => void;
  clientData: ClientInputs[];
  supplementary: boolean;
}) {
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [client, setClient] = useState<ClientInputs[]>(clientData);
  const [selectLrData, setSelectLrData] = useState<LrInputs[]>([]);
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState<"edit" | "create">("create");
  const [billNumberAlreadyExists, setBillNumberAlreadyExists] = useState(false);
  const [branchId, setBranchId] = useState({
    branchId: "",
    adminId: "",
    branchName: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyBankDetails, setCompanyBankDetails] =
    useState<BankDetailsInputs>();
  const [totalAmounts, setTotalAmounts] = useState({
    billedin: "",
    igstRate: 0,
    cgstRate: 0,
    sgstRate: 0,
    unloading: 0,
    hamali: 0,
    extraKmWeight: 0,
    detention: 0,
    weightment: 0,
    others: 0,
    otherCharges: 0,
    subtotal: 0,
    total: 0,
    totalInWords: "",
  });
  const [notificationData, setNotificationData] =
    useState<Record<string, any>>();
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);

  function getWorkingYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let startYear, endYear;

    if (month >= 4) {
      // If April or later → current year - next year
      startYear = year % 100;
      endYear = (year + 1) % 100;
    } else {
      // If Jan - Mar → previous year - current year
      startYear = (year - 1) % 100;
      endYear = year % 100;
    }

    return `${startYear.toString().padStart(2, "0")}-${endYear.toString().padStart(2, "0")}`;
  }

  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<billInputs>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      unloading: {
        state: false,
      },
      hamali: {
        state: false,
      },
      extraKmWeight: {
        state: false,
      },
      detention: {
        state: false,
      },
      weightment: {
        state: false,
      },
      others: {
        state: false,
      },
      otherCharges: {
        state: false,
      },
    },
  });

  useEffect(() => {
    const subTotal =
      selectLrData?.reduce((acc, data) => acc + Number(data.totalAmt), 0) +
      Number(totalAmounts.unloading || 0) +
      Number(totalAmounts.hamali || 0) +
      Number(totalAmounts.extraKmWeight || 0) +
      Number(totalAmounts.detention || 0) +
      Number(totalAmounts.weightment || 0) +
      Number(totalAmounts.others || 0) +
      Number(totalAmounts.otherCharges || 0);

    if (totalAmounts.billedin === "WithinKarnataka") {
      const cgstRate = subTotal * 0.025;
      const sgstRate = subTotal * 0.025;
      const total = subTotal + cgstRate + sgstRate;

      setTotalAmounts((prev) => ({
        ...prev,
        subtotal: subTotal,
        igstRate: 0,
        cgstRate,
        sgstRate,
        total,
        totalInWords: numberToIndianWords(subTotal),
      }));
    } else if (totalAmounts.billedin === "OutsideKarnataka") {
      const igstRate = subTotal * 0.05;
      const total = subTotal + igstRate;

      setTotalAmounts((prev) => ({
        ...prev,
        subtotal: subTotal,
        igstRate,
        cgstRate: 0,
        sgstRate: 0,
        total,
        totalInWords: numberToIndianWords(subTotal),
      }));
    }
  }, [
    selectLrData,
    totalAmounts.billedin,
    totalAmounts.unloading,
    totalAmounts.hamali,
    totalAmounts.extraKmWeight,
    totalAmounts.detention,
    totalAmounts.weightment,
    totalAmounts.others,
    totalAmounts.otherCharges,
  ]);

  useEffect(() => {
    if (selectedBillToEdit) {
      setFormStatus("edit");

      // Basic field values
      setValue("billNumber", selectedBillToEdit.billNumber);
      setValue("date", selectedBillToEdit.date);
      setValue("dueDate", selectedBillToEdit.dueDate);
      setValue("Client.name", selectedBillToEdit.Client.name);
      setValue("Client.GSTIN", selectedBillToEdit.Client.GSTIN);
      setValue("Client.address", selectedBillToEdit.Client.address);
      setValue("Client.email", selectedBillToEdit.Client.email);
      setValue("hsnSacCode", selectedBillToEdit.hsnSacCode);
      setValue("placeOfSupply", selectedBillToEdit.placeOfSupply);
      setValue("state", selectedBillToEdit.state);
      setValue("statecode", selectedBillToEdit.statecode);
      setSelectLrData(selectedBillToEdit.lrData);

      // Charges with default fallbacks
      const unloading = selectedBillToEdit.unloading?.amount || 0;
      const hamali = selectedBillToEdit.hamali?.amount || 0;
      const extraKmWeight = selectedBillToEdit.extraKmWeight?.amount || 0;
      const detention = selectedBillToEdit.detention?.amount || 0;
      const weightment = selectedBillToEdit.weightment?.amount || 0;
      const others = selectedBillToEdit.others?.amount || 0;
      const otherCharges = selectedBillToEdit.otherCharges?.amount || 0;

      // Set all total amounts in one go
      setTotalAmounts({
        billedin:
          selectedBillToEdit.igstRate !== 0
            ? "OutsideKarnataka"
            : "WithinKarnataka",
        igstRate: selectedBillToEdit.igstRate,
        cgstRate: selectedBillToEdit.cgstRate,
        sgstRate: selectedBillToEdit.sgstRate,
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        subtotal: selectedBillToEdit.subTotal,
        total: selectedBillToEdit.total,
        totalInWords: selectedBillToEdit.totalInWords,
      });

      // Conditionally set extra fields if toggled
      if (selectedBillToEdit.unloading?.state) {
        setValue("unloading.state", true);
        setValue("unloading.lrnumber", selectedBillToEdit.unloading.lrnumber);
        setValue("unloading.amount", selectedBillToEdit.unloading.amount);
      }

      if (selectedBillToEdit.hamali?.state) {
        setValue("hamali.state", true);
        setValue("hamali.lrnumber", selectedBillToEdit.hamali.lrnumber);
        setValue("hamali.amount", selectedBillToEdit.hamali.amount);
      }

      if (selectedBillToEdit.extraKmWeight?.state) {
        setValue("extraKmWeight.state", true);
        setValue(
          "extraKmWeight.lrnumber",
          selectedBillToEdit.extraKmWeight.lrnumber,
        );
        setValue(
          "extraKmWeight.amount",
          selectedBillToEdit.extraKmWeight.amount,
        );
      }

      if (selectedBillToEdit.detention?.state) {
        setValue("detention.state", true);
        setValue("detention.lrnumber", selectedBillToEdit.detention.lrnumber);
        setValue("detention.amount", selectedBillToEdit.detention.amount);
      }

      if (selectedBillToEdit.weightment?.state) {
        setValue("weightment.state", true);
        setValue("weightment.weight", selectedBillToEdit.weightment.weight);
        setValue("weightment.lrnumber", selectedBillToEdit.weightment.lrnumber);
        setValue("weightment.amount", selectedBillToEdit.weightment.amount);
      }

      if (selectedBillToEdit.others?.state) {
        setValue("others.state", true);
        setValue("others.lrnumber", selectedBillToEdit.others.lrnumber);
        setValue("others.amount", selectedBillToEdit.others.amount);
      }

      if (selectedBillToEdit.otherCharges?.state) {
        setValue("otherCharges.state", true);
        setValue("otherCharges.name", selectedBillToEdit.otherCharges.name);
        setValue(
          "otherCharges.lrnumber",
          selectedBillToEdit.otherCharges.lrnumber,
        );
        setValue("otherCharges.amount", selectedBillToEdit.otherCharges.amount);
      }
    }
  }, [selectedBillToEdit]);

  function extractLRNumberOptions(LRData: LrInputs[]): Option[] {
    return LRData.map((data) => ({
      value: data.lrNumber,
      label: data.lrNumber,
    }));
  }
  function extractClientOptions(vendors: ClientInputs[]): Option[] {
    return vendors.map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
    }));
  }

  const resetInputs = async () => {
    reset();
    setSelectLrData([]);
    setFormStatus("create");
    setSelectedBillToEdit(null);
    const companyProfileResponse = await getCompanyProfileApi();
    if (companyProfileResponse?.status === 200) {
      setValue("hsnSacCode", companyProfileResponse.data.data.HSN);
    }
  };

  const removeLRFromSelectedLR = async (id: string) => {
    const newLRList = selectLrData.filter((lr) => lr.id !== id);
    setSelectLrData(newLRList);
  };

  const setClientData = (data: ClientInputs) => {
    setValue("Client.GSTIN", data.GSTIN);
    setValue("Client.address", data.address);
    setValue("state", data.state);
    setValue("Client.email", data.email);
  };

  const onSubmit = async (data: billInputs) => {
    if (selectLrData.length === 0) {
      toast.error("Please add at least one LR data");
      return;
    }
    setLoading(true);

    data.total = totalAmounts.total;
    data.subTotal = totalAmounts.subtotal;
    data.cgstRate = totalAmounts.cgstRate;
    data.sgstRate = totalAmounts.sgstRate;
    data.igstRate = totalAmounts.igstRate;

    data.hamali.amount = data.hamali.state ? totalAmounts.hamali : 0;
    data.unloading.amount = data.unloading.state ? totalAmounts.unloading : 0;
    data.extraKmWeight.amount = data.extraKmWeight.state
      ? totalAmounts.extraKmWeight
      : 0;
    data.detention.amount = data.detention.state ? totalAmounts.detention : 0;
    data.weightment.amount = data.weightment.state
      ? totalAmounts.weightment
      : 0;
    data.others.amount = data.others.state ? totalAmounts.others : 0;
    data.otherCharges.amount = data.otherCharges.state
      ? totalAmounts.otherCharges
      : 0;

    const chargeFields = [
      "unloading",
      "hamali",
      "extraKmWeight",
      "detention",
      "weightment",
      "others",
      "otherCharges",
    ] as const;

    for (const field of chargeFields) {
      if (!data[field].state) {
        delete data[field];
      }
    }

    data.lrData = selectLrData;
    data.totalInWords = totalAmounts.totalInWords;

    if (formStatus === "edit") {
      if (!isAdmin) {
        setNotificationData(data), setNotificationAlertOpen(true);
        setLoading(false);
        return;
      }
      const response = await updateBillDetailsApi(selectedBillToEdit!.id, data);
      if (response?.status === 200) {
        toast.success("Bill has been updated");
        setSelectLrData([]);
        reset();
        sectionChangeHandler({
          billList: true,
          createNew: false,
        });
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      if (isAdmin) {
        data.adminId = branchId.adminId;
      } else {
        data.branchId = branchId.branchId;
      }
      const BillResponse = await checkBillExistsApi({
        billNumber: data.billNumber,
      });
      data.clientName = data.Client.name;
      if (BillResponse?.status === 200) {
        toast.error("Bill already exists");
        setBillNumberAlreadyExists(true);
        setTimeout(() => {
          setBillNumberAlreadyExists(false);
        }, 3000);
        setLoading(false);
        return;
      }
      if (supplementary) {
        const response = await createBillsupplementaryApi(data);
        if (response?.status === 200) {
          toast.success("Bill has been created");
          setSelectLrData([]);
          reset();
          sectionChangeHandler({
            billList: true,
            createNew: false,
          });
        } else {
          toast.error("Something Went Wrong, Check All Fields");
        }
      } else {
        const response = await createBillApi(data);
        if (response?.status === 200) {
          toast.success("Bill has been created");
          setSelectLrData([]);
          reset();
          sectionChangeHandler({
            billList: true,
            createNew: false,
          });
        } else {
          toast.error("Something Went Wrong, Check All Fields");
        }
      }
    }
    setLoading(false);
  };

  const onBillupdateByNotificationHandler = async () => {
    const data = {
      requestId: selectedBillToEdit?.billNumber,
      title: "Bill edit",
      message: branchId.branchName,
      description: branchId.branchId,
      data: JSON.stringify(notificationData),
      status: "editable",
    };

    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      reset();
      sectionChangeHandler({
        billList: true,
        createNew: false,
      });
    }
  };

  async function fetchBillId() {
    const response = await getBillIdApi();
    if (response?.status === 200) {
      const year = getWorkingYear();
      const billId = response.data.data.billId;
      const generateBill = `BNG/${billId}/${year}`;
      setValue("billNumber", generateBill);
    }
  }

  async function fetchData() {
    const clientResponse = await getAllClientsApi();
    const companyProfileResponse = await getCompanyProfileApi();
    const bankDetailsResponse = await getBankDetailsApi();
    if (
      clientResponse?.status === 200 &&
      companyProfileResponse?.status === 200 &&
      bankDetailsResponse?.status === 200
    ) {
      setClient(clientResponse.data.data);
      setValue("hsnSacCode", companyProfileResponse.data.data.HSN);
      setCompanyBankDetails(bankDetailsResponse.data.data);
      if (selectedBillToEdit) {
        const client = clientResponse.data.data.find(
          (client: ClientInputs) =>
            client.name === selectedBillToEdit.Client.name,
        );
        setLRData(client.LR);
      }
    }
  }


  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);

      if (isAdmin === "true") {
        setIsAdmin(true);
        setBranchId({
          branchId: "",
          adminId: branchDetails.id,
          branchName: branchDetails.branchName,
        });
      } else {
        setBranchId({
          branchId: branchDetails.id,
          adminId: "",
          branchName: branchDetails.branchName,
        });
      }
      fetchData();
      if (!selectedBillToEdit) {
        fetchBillId();
      }
    }
  }, []);

  return (
    <>
      <div className="flex max-h-[95vh] flex-col gap-2 overflow-y-auto rounded-md bg-white p-5">
        <p className="text-xl font-medium">{` ${formStatus === "create" ? "Create customer Bill" : "Edit customer Bill"} `}</p>
        <form
          className="flex flex-wrap justify-between gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Bill Number</label>
              <input
                type="text"
                className={`border-primary rounded-md border p-2 ${!supplementary && "cursor-not-allowed"}`}
                {...register("billNumber", { required: true })}
                readOnly={!supplementary}
              />
              {errors.billNumber && (
                <p className="text-red-500">Please enter a vaild Bill Number</p>
              )}
              {billNumberAlreadyExists && (
                <p className="text-red-500">
                  Bill Number already exists, please try another one
                </p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
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
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Due date</label>
              <input
                type="date"
                className="border-primary rounded-md border p-2"
                {...register("dueDate")}
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Client Name</label>
              <Controller
                name="Client.name"
                control={control}
                defaultValue={""}
                rules={{ required: "Please enter consignor name" }}
                render={({ field }) => (
                  <AntSelect
                    {...field}
                    size="large"
                    onChange={(value) => {
                      field.onChange(value);
                      const selectedClient = client.find(
                        (v) => v.name === value,
                      );
                      if (selectedClient) {
                        setClientData(selectedClient);
                        setLRData(
                          selectedClient.LR.filter(
                            (lr) => lr.billId === null
                          )
                        );
                      }
                    }}
                    showSearch
                    options={extractClientOptions(client)}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                    disabled={formStatus === "edit"}
                  />
                )}
              />
              {errors.Client?.name && (
                <p className="text-red-500">Client Name is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Client's GSTIN</label>
              <input
                type="text"
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("Client.GSTIN")}
                disabled
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">HSN / SAC Code</label>
              <input
                type="text"
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("hsnSacCode")}
                disabled
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Place of Supply</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("placeOfSupply", { required: true })}
              />
              {errors.placeOfSupply && (
                <p className="text-red-500">Place of Supply is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Client's Address</label>
              <input
                type="text"
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("Client.address")}
                disabled
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">State</label>
              <input
                type="text"
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("state")}
                disabled
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">State Code</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("statecode", { required: true })}
              />
              {errors.statecode && (
                <p className="text-red-500">State Code is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Billed in</label>
              <Select
                onValueChange={(value) =>
                  setTotalAmounts((prev) => ({
                    ...prev,
                    billedin: value,
                  }))
                }
                value={totalAmounts.billedin}
                disabled={selectedBillToEdit?.WriteOff != null}
              >
                <SelectTrigger className="boder border-primary h-full w-full py-5 shadow-none data-[placeholder]:text-black">
                  <SelectValue />
                  <div></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WithinKarnataka">
                    Within Karnataka
                  </SelectItem>
                  <SelectItem value="OutsideKarnataka">
                    Outside Karnataka
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-[23%]"></div>
          <div className="w-full">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-primary rounded-tl-lg border p-1 px-3 text-start font-medium">
                    Sl no
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    LR#
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    LR Date
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Origin
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Destination
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Description
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Invoice Number
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Invoice date
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Vehile Type
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Vehile No.
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Weight
                  </th>
                  <th className="border-primary border p-1 px-3 text-start font-medium">
                    Freight Amount
                  </th>
                  <th className="border-primary rounded-tr-lg border p-1 px-3 text-start font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-sm">
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top">
                    <AntSelect
                      className="w-full"
                      size="middle"
                      allowClear
                      placeholder="Type here..."
                      onChange={(value: any) => {
                        const selectedLR = LRData.find(
                          (lr) => lr.lrNumber === value,
                        );

                        if (selectLrData.length >= 6) {
                          toast.warning("Only 6 LR can be added");
                          return;
                        }

                        if (!totalAmounts.billedin) {
                          toast.warning(
                            "Please select Billed in field to add LR Data",
                          );
                          return;
                        }
                        if (
                          selectLrData.find(
                            (lr: LrInputs) =>
                              lr.lrNumber === selectedLR?.lrNumber,
                          )
                        ) {
                          toast.warning("LR already added");
                          return;
                        } else if (selectedLR) {
                          setSelectLrData((prev) => [...prev, selectedLR]);
                        }
                      }}
                      showSearch
                      options={extractLRNumberOptions(LRData)}
                      disabled={selectedBillToEdit?.WriteOff != null}
                      style={{
                        border: "none",
                        borderRadius: "0px",
                      }}
                    />
                  </td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                  <td className="border-primary border p-2 align-top"></td>
                </tr>
                {selectLrData?.map((lrData, index) => (
                  <tr className="text-sm" key={lrData.lrNumber}>
                    <td
                      className={`border-primary border p-2 align-top ${selectLrData.length - 1 === index ? "rounded-bl-lg" : ""}`}
                    >
                      {index + 1}
                    </td>
                    <td className="border-primary border p-2 text-center align-top">
                      {lrData.lrNumber}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.date}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.from}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.to}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.description}
                    </td>
                    <td className="border-primary border p-2 text-center align-top">
                      {lrData.invoiceNo}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.invoiceDate}
                    </td>
                    <td className="border-primary border p-2 text-center align-top">
                      {lrData.Vehicle?.vehicletypes &&
                        lrData.Vehicle?.vehicletypes}
                    </td>
                    <td className="border-primary border p-2 align-top">
                      {lrData.Vehicle?.vehicleNumber &&
                        lrData.Vehicle?.vehicleNumber}
                    </td>
                    <td className="border-primary border p-2 text-center align-top">
                      {lrData.weight}
                    </td>
                    <td
                      className={`border-primary align-top} border p-2 text-center`}
                    >
                      {lrData.totalAmt}
                    </td>
                    <td
                      className={`border-primary border p-2 text-center align-top ${selectLrData.length - 1 === index ? "rounded-br-lg" : ""}`}
                    >
                      <button
                        disabled={selectedBillToEdit?.WriteOff != null}
                        onClick={() => removeLRFromSelectedLR(lrData.id)}
                      >
                        <MdDeleteOutline
                          size={24}
                          color="red"
                          className="cursor-pointer"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-primary flex w-full justify-between rounded-md border p-3 text-sm font-medium">
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-5">
                <span>Add : IGST Rate</span>
                <span>5.00%</span>
                <span>INR {totalAmounts.igstRate.toFixed(2)}</span>
              </p>
              <p className="flex items-center gap-5">
                <span>Add : CGST Rate</span>
                <span>2.50%</span>
                <span>INR {totalAmounts.cgstRate.toFixed(2)}</span>
              </p>
              <p className="flex items-center gap-5">
                <span>Add : SGST Rate</span>
                <span>2.50%</span>
                <span>INR {totalAmounts.sgstRate.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex">
                <Controller
                  name="unloading.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("unloading.lrnumber", "");
                              setValue("unloading.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                unloading: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="unloading"
                        />
                        <Label htmlFor="unloading">Unloading</Label>
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("unloading.lrnumber", {
                            required: value,
                          })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          type="number"
                          className="w-20 outline-none"
                          {...register("unloading.amount", { required: value })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              unloading: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.unloading?.lrnumber || errors.unloading?.amount) && (
                <p className="text-red-500">
                  Unloading LR# and Amount is required
                </p>
              )}
              <div className="flex">
                <Controller
                  name="hamali.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("hamali.lrnumber", "");
                              setValue("hamali.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                hamali: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="hamali"
                        />
                        <Label htmlFor="hamali">Hamali</Label>
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("hamali.lrnumber", { required: value })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          type="number"
                          className="w-20 outline-none"
                          {...register("hamali.amount", { required: value })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              hamali: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.hamali?.lrnumber || errors.hamali?.amount) && (
                <p className="text-red-500">
                  Hamali LR# and Amount is required
                </p>
              )}
              <div className="flex">
                <Controller
                  name="extraKmWeight.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("extraKmWeight.lrnumber", "");
                              setValue("extraKmWeight.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                extraKmWeight: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="extraKmWeight"
                        />
                        <Label htmlFor="extraKmWeight">Extra KMs/Weight</Label>
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("extraKmWeight.lrnumber", {
                            required: value,
                          })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          className="w-20 outline-none"
                          type="number"
                          {...register("extraKmWeight.amount", {
                            required: value,
                          })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              extraKmWeight: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.extraKmWeight?.lrnumber ||
                errors.extraKmWeight?.amount) && (
                  <p className="text-red-500">
                    Extra KMs/Weight LR# and Amount is required
                  </p>
                )}
              <div className="flex">
                <Controller
                  name="detention.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("detention.lrnumber", "");
                              setValue("detention.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                detention: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="detention"
                        />
                        <Label htmlFor="detention">Detention</Label>
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("detention.lrnumber", {
                            required: value,
                          })}
                        />
                      </div>
                      {value ? (
                        <input
                          placeholder="Type here..."
                          className="w-20 outline-none"
                          type="number"
                          disabled={selectedBillToEdit?.WriteOff != null}
                          {...register("detention.amount", { required: value })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              detention: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.detention?.lrnumber || errors.detention?.amount) && (
                <p className="text-red-500">
                  Detention LR# and Amount is required
                </p>
              )}
              <div className="flex">
                <Controller
                  name="weightment.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("weightment.lrnumber", "");
                              setValue("weightment.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                weightment: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="weightment"
                        />
                        <Label htmlFor="weightment">Weightment</Label>
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("weightment.lrnumber", {
                            required: value,
                          })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          className="w-20 outline-none"
                          type="number"
                          {...register("weightment.amount", {
                            required: value,
                          })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              weightment: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.weightment?.lrnumber || errors.weightment?.amount) && (
                <p className="text-red-500">
                  Weightment LR# and Amount is required
                </p>
              )}
              <div className="flex">
                <Controller
                  name="others.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("others.lrnumber", "");
                              setValue("others.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                others: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="others"
                        />
                        <Label htmlFor="others">Others</Label>
                        <textarea
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="min-w-15 rounded-md border p-1 outline-none"
                          {...register("others.lrnumber", { required: value })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          className="w-20 outline-none"
                          type="number"
                          {...register("others.amount", { required: value })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              others: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.others?.lrnumber || errors.others?.amount) && (
                <p className="text-red-500">
                  Others LR# and Amount is required
                </p>
              )}
              <div className="flex">
                <Controller
                  name="otherCharges.state"
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, name, ref },
                  }) => (
                    <div className="flex w-full justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          disabled={selectedBillToEdit?.WriteOff != null}
                          checked={value}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            if (!checked) {
                              setValue("otherCharges.name", "");
                              setValue("otherCharges.lrnumber", "");
                              setValue("otherCharges.amount", 0);
                              setTotalAmounts((prev) => ({
                                ...prev,
                                otherCharges: 0,
                              }));
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                          name={name}
                          className="border-primary border"
                          id="others"
                        />
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here"
                          className="w-20 outline-none"
                          {...register("otherCharges.name", {
                            required: value,
                          })}
                        />
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="LR#"
                          className="w-15 outline-none"
                          {...register("otherCharges.lrnumber", {
                            required: value,
                          })}
                        />
                      </div>
                      {value ? (
                        <input
                          disabled={selectedBillToEdit?.WriteOff != null}
                          placeholder="Type here..."
                          className="w-20 outline-none"
                          type="number"
                          {...register("otherCharges.amount", {
                            required: value,
                          })}
                          onChange={(e) =>
                            setTotalAmounts((prev) => ({
                              ...prev,
                              otherCharges: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        <p className="text-slate-400">Locked</p>
                      )}
                    </div>
                  )}
                />
              </div>
              {(errors.otherCharges?.lrnumber ||
                errors.otherCharges?.amount) && (
                  <p className="text-red-500">LR# and Amount is required</p>
                )}
            </div>
          </div>
          <div className="border-primary flex w-full justify-between rounded-md border p-3 font-medium">
            <div>
              <p>Bank Details</p>
              <p>Name SHREE LN LOGISTICS</p>
              <p>Bank {companyBankDetails?.name}</p>
              <p>A/C NO. {companyBankDetails?.accountNumber}</p>
              <p>IFSC - {companyBankDetails?.ifscCode}</p>
            </div>
            <div className="flex flex-col gap-3 text-end">
              <div>
                <p>Total INR {totalAmounts.subtotal.toFixed(2)}</p>
                <div className="flex items-center gap-2 capitalize">
                  Total in words -
                  <textarea
                    className="border-primary w-100 rounded-md border p-1 px-2"
                    value={totalAmounts.totalInWords}
                    onChange={(e) =>
                      setTotalAmounts({
                        ...totalAmounts,
                        totalInWords: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <p>GST Payable on reverse charge basis Yes/No : Yes</p>
                <p>GST Amount payable under RCM by the billed party</p>
              </div>
            </div>
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button
              onClick={() => [
                sectionChangeHandler({
                  billList: true,
                  createNew: false,
                }),
                resetInputs(),
              ]}
              disabled={loading}
              className="cursor-pointer rounded-xl px-10"
              type="button"
            >
              Back
            </Button>
            <Button
              className="cursor-pointer rounded-xl px-10"
              disabled={loading}
            >
              {loading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : formStatus === "create" ? (
                "Generate Bill"
              ) : (
                "Edit Bill"
              )}
            </Button>
          </div>
        </form>
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
            <AlertDialogAction onClick={onBillupdateByNotificationHandler}>
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
