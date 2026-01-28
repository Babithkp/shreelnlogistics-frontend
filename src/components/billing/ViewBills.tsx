import logo from "../../assets/logisticsLogo.svg";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import {
  addPaymentRecordToBillApi,
  createBulkPaymentApi,
  deleteBillApi,
  deletePaymentRecordFromBillApi,
  filterBillDataApi,
  filterBillDetailsForBranchApi,
  getBillByPageApi,
  getBillByPageForBranchApi,
  getBillDetailsApi,
  sendBillEmailApi,
  updateTdsOfBillApi,
} from "@/api/billing";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { Select as AntSelect, Checkbox, Modal } from "antd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RxCross2 } from "react-icons/rx";
import { VscLoading } from "react-icons/vsc";
import { RiDeleteBin6Line, RiEditBoxLine } from "react-icons/ri";
import BillTemplate from "./BillTemplate";
import { toast } from "react-toastify";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdOutlineFileDownload,
} from "react-icons/md";
import { getCompanyProfileApi } from "@/api/settings";
import { BankDetailsInputs, ProfileInputs } from "../settings/Settings";
import { Controller, useForm } from "react-hook-form";
import { PiRecord } from "react-icons/pi";
import {
  numberToIndianWords,
  filterOnlyCompletePrimitiveDiffs,
  formatter,
  getUnmatchingFields,
} from "@/lib/utils";
import {
  billInputs,
  BulkRecord,
  ClientInputs,
  PaymentRecord,
  WriteOffInputs,
} from "@/types";
import { createNotificationApi } from "@/api/admin";
import { LuSearch } from "react-icons/lu";
import { BiTrash } from "react-icons/bi";
import { createBillWriteOffApi, deleteBillWriteOffApi } from "@/api/writeoff";

const defaultMailGreeting = `Hope you're doing well.

Please find attached the *invoice* for the recent shipment executed as per the details below`;

type BulkBillList = {
  billNumber: string;
  amount: string;
  amountInWords: string;
  pendingAmount: number;
};

export default function ViewBills({
  sectionChangeHandler,
  setSelectedBillToEdit,
  bankDetails,
  data,
  setSupplementary,
  clients,
  onRefresh,
}: {
  sectionChangeHandler: (section: any) => void;
  setSelectedBillToEdit: (data: billInputs) => void;
  bankDetails?: BankDetailsInputs;
  data: billInputs[];
  setSupplementary: (data: boolean) => void;
  clients: ClientInputs[];
  onRefresh: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [billData, setBillData] = useState<billInputs[]>(data.slice(0, 50));
  const [filteredBills, setFilteredBills] = useState<billInputs[]>(
    data.slice(0, 50),
  );
  const [selectedBill, setSelectedBill] = useState<billInputs>();
  const [isOpen, setIsOpen] = useState(false);
  const [mailGreeting, setMailGreeting] = useState(defaultMailGreeting);
  const [emailIds, setEmailIds] = useState("");
  const [attachment, setAttachment] = useState<Blob>();
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<ProfileInputs>();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [branch, setBranch] = useState({
    branchId: "",
    adminId: "",
    branchName: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [formstate, setFormstate] = useState<"create" | "edit">("create");
  const [oldRecordData, setOldRecordData] = useState<PaymentRecord | null>(
    null,
  );
  const [editAbleData, setEditAbleData] =
    useState<Record<string, { obj1: any; obj2: any }>>();
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [BillList, setBillList] = useState<billInputs[]>([]);
  const [BillListForBulk, setBillListForBulk] = useState<BulkBillList[]>([]);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(data.length);
  const [recordEditValue, setRecordEditValue] = useState("0");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 50;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  async function fetchBillDataForPage() {
    const time1 = new Date().getTime();
    const response = await getBillByPageApi(currentPage, itemsPerPage);
    if (response?.status === 200) {
      const allBills = response.data.data;
      setBillData(allBills.BillData);
      setFilteredBills(allBills.BillData);
      setTotalItems(allBills.BillCount);
    }
    console.log(
      "Time taken to fetch Bill Data",
      (new Date().getTime() - time1) / 1000,
    );
  }

  async function fetchBillDataForPageForBranch() {
    const response = await getBillByPageForBranchApi(
      currentPage,
      itemsPerPage,
      branch.branchId,
    );
    if (response?.status === 200) {
      const allBills = response.data.data;
      setBillData(allBills.BillData);
      setFilteredBills(allBills.BillData);
      setTotalItems(allBills.BillCount);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchBillDataForPage();
    } else if (!isAdmin && branch.branchId) {
      fetchBillDataForPageForBranch();
    }
  }, [startIndex, endIndex]);

  useEffect(() => {
    if (isAdmin) {
      fetchBillDataForPage();
    } else if (!isAdmin && branch.branchId) {
      fetchBillDataForPageForBranch();
    }
  }, [isAdmin, branch.branchId]);

  const getPdfFile = async () => {
    const pdfFile = await pdf(
      <BillTemplate
        billInputs={selectedBill}
        bankDetails={bankDetails}
        companyProfile={companyProfile}
      />,
    ).toBlob();
    setAttachment(pdfFile);
  };

  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentRecord>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });
  const {
    handleSubmit: handleBulkSubmit,
    register: registerBulk,
    reset: resetBulk,
    control: controlBulk,
    formState: { errors: errorsBulk },
  } = useForm<BulkRecord>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });
  const {
    handleSubmit: handleWriteOffSubmit,
    register: registerWriteOff,
    reset: resetWriteOff,
    control: controlWriteOff,
    formState: { errors: errorsWriteOff },
  } = useForm<WriteOffInputs>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const amount = watch("amount");

  useEffect(() => {
    let totalPending;
    if (formstate === "edit") {
      totalPending = parseFloat(recordEditValue);
    }
    if (amount && selectedBill) {
      const totalAmount = Number(amount);
      const amountInWords = numberToIndianWords(totalAmount);
      const pendingAmount = selectedBill?.pendingAmount - totalAmount;
      setValue("amountInWords", amountInWords);
      setValue(
        "pendingAmount",
        (totalPending || 0) + parseFloat(pendingAmount.toFixed(2)),
      );
    } else {
      setValue("amountInWords", numberToIndianWords(0));
      setValue("pendingAmount", 0);
    }
  }, [amount, setValue]);

  // Sync write-off form with selected bill when modal opens or bill changes
  useEffect(() => {
    if (selectedBill && isWriteOffModalOpen) {
      resetWriteOff({
        IDNumber: selectedBill.billNumber,
        vendorName: selectedBill.Client?.name || "",
        amount:
          (selectedBill.pendingAmount as unknown as string) ||
          selectedBill.pendingAmount?.toString?.() ||
          "",
        date: new Date().toISOString().split("T")[0],
        reason: "",
        checked: false,
      } as any);
    }
  }, [selectedBill, isWriteOffModalOpen, resetWriteOff]);

  // Sync record payment form with selected bill when modal opens or bill changes (creation mode)
  useEffect(() => {
    if (selectedBill && isRecordModalOpen && formstate === "create") {
      reset({
        IDNumber: selectedBill.billNumber,
        customerName: selectedBill.Client?.name || "",
        date: new Date().toISOString().split("T")[0],
      } as any);
    }
  }, [selectedBill, isRecordModalOpen, formstate, reset]);

  async function filterBillData(text: string) {
    const response = await filterBillDataApi(text);
    if (response?.status === 200) {
      const filtered = response.data.data;
      setFilteredBills(filtered);
    }
  }

  async function filterBillDataForBranch(branchId: string, text: string) {
    const response = await filterBillDetailsForBranchApi(branchId, text);
    if (response?.status === 200) {
      const filtered = response.data.data;
      setFilteredBills(filtered);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredBills(billData);
      return;
    }
    if (isAdmin) {
      filterBillData(search);
    } else {
      filterBillDataForBranch(branch.branchId, search);
    }
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredBills(billData);
      return;
    }
  }, [search]);

  const updateTdsvalue = async (value: string) => {
    const response = await updateTdsOfBillApi({
      id: selectedBill?.id,
      tds: value,
    });
    if (response?.status === 200) {
      toast.success("TDS Updated");
      setShowPreview(false);
      if (isAdmin) {
        getBillDetails();
      } else {
        getBillDetails(branch.branchId);
      }
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const setRecordDataToInputBox = async (data: PaymentRecord) => {
    setValue("IDNumber", data.IDNumber);
    setValue("date", data.date);
    setValue("customerName", data.customerName);
    setValue("amount", data.amount);
    setValue("amountInWords", data.amountInWords);
    setValue("transactionNumber", data.transactionNumber);
    setValue("paymentMode", data.paymentMode);
    setValue("remarks", data.remarks);
    setValue("id", data.id);
    setOldRecordData(data);
  };

  const onSubmit = async (data: PaymentRecord) => {
    if (data.pendingAmount < 0) {
      toast.error("Pending Amount cannot be negative");
      return;
    }
    if (!isAdmin && formstate === "edit") {
      setSelectedBill((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingAmount: Number(prev.pendingAmount) + Number(data.amount),
        };
      });
      if (!oldRecordData) return;
      const recordData = filterOnlyCompletePrimitiveDiffs(
        getUnmatchingFields(data, oldRecordData),
      );
      setEditAbleData(recordData);
      setNotificationAlertOpen(true);
      return;
    }
    setIsLoading(true);
    if (selectedBill && branch) {
      if (isAdmin) {
        data.adminId = branch.adminId;
      } else {
        data.branchId = branch.branchId;
      }
      data.clientId = selectedBill?.clientName;
      data.IDNumber = selectedBill?.billNumber;
      const response = await addPaymentRecordToBillApi(data);
      if (response?.status === 200) {
        toast.success("Payment Record Added");
        setIsRecordModalOpen(false);
        reset();
        setShowPreview(false);
        if (isAdmin) {
          getBillDetails();
        } else {
          getBillDetails(branch.branchId);
        }
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  const onBulkSubmit = async (data: BulkRecord) => {
    if (BillListForBulk.length === 0) {
      toast.error("Please add at least one record");
      return;
    }
    const isvalidate = BillListForBulk.some(
      (FM) => parseFloat(FM.amount) <= 0 || FM.pendingAmount < 0,
    );
    if (isvalidate) {
      toast.error("Pending Amount or Amount cannot be in negative");
      return;
    }
    setIsLoading(true);
    const finalData: any = data;
    if (isAdmin) {
      finalData.adminId = branch.adminId;
    } else {
      finalData.branchId = branch.branchId;
    }
    finalData.billData = BillListForBulk;
    const response = await createBulkPaymentApi(finalData);
    if (response?.status === 200) {
      toast.success("Payment Record Added");
      setIsBulkModalOpen(false);
      resetBulk();
      setBillList([]);
      setBillListForBulk([]);
      setShowPreview(false);
      onRefresh();
      if (isAdmin) {
        fetchBillDataForPage();
      } else if (!isAdmin && branch.branchId) {
        fetchBillDataForPageForBranch();
      }
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    try {
    } catch (error) {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const onWriteOff = async (data: WriteOffInputs) => {
    setIsLoading(true);
    try {
      const finalData: any = data;
      if (!isAdmin) {
        finalData.branchId = branch.branchId;
      }

      const response = await createBillWriteOffApi(finalData);
      if (response?.status === 200) {
        if (isAdmin) {
          getBillDetails();
        } else {
          getBillDetails(branch.branchId);
        }
        toast.success("Write Off Created");
        setIsWriteOffModalOpen(false);
        resetWriteOff();
        setShowPreview(false);
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const onDeleteWriteOff = async (id: string) => {
    try {
      const response = await deleteBillWriteOffApi(id);
      if (response?.status === 200) {
        toast.success("Write Off Deleted");
        setShowPreview(false);
        if (isAdmin) {
          getBillDetails();
        } else {
          getBillDetails(branch.branchId);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to Delete Write Off");
    }
  };

  const editBillPaymentOnNotification = async () => {
    const data = {
      requestId: oldRecordData?.IDNumber,
      title: "Bill record edit",
      message: branch.branchName,
      description: branch.branchId,
      status: "editable",
      data: JSON.stringify(editAbleData),
      fileId: oldRecordData?.id,
    };
    setIsLoading(true);
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
      setIsRecordModalOpen(false);
      setNotificationAlertOpen(false);
      resetData();
      if (isAdmin) {
        getBillDetails();
      } else {
        getBillDetails(branch.branchId);
      }
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const onBillRecordDeleteHandlerByNotification = async (
    record: PaymentRecord,
  ) => {
    const data = {
      requestId: record.IDNumber,
      title: "Bill record delete",
      message: branch.branchName,
      description: branch.branchId,
      status: "delete",
      fileId: record.id,
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deletePaymentRecordFromBill = async (id: string) => {
    const response = await deletePaymentRecordFromBillApi(id);
    if (response?.status === 200) {
      toast.success("Payment Record Deleted");
      setShowPreview(false);
      setIsRecordModalOpen(false);
      if (isAdmin) {
        getBillDetails();
      } else {
        getBillDetails(branch.branchId);
      }
    } else {
      toast.error("Failed to Delete Payment Record");
    }
  };
  const downloadPdfFile = async () => {
    const pdfFile = await pdf(
      <BillTemplate
        billInputs={selectedBill}
        companyProfile={companyProfile}
        bankDetails={bankDetails}
      />,
    ).toBlob();
    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bill-${selectedBill?.billNumber}-${new Date().toLocaleDateString()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("PDF has been downloaded successfully");
  };

  useEffect(() => {
    getPdfFile();
  }, [selectedBill]);

  const onSendEmailHandler = async () => {
    if (!emailIds) {
      toast.error("Please provide at least one email address");
      return;
    }
    setIsLoading(true);
    const emails = emailIds
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    for (const email of emails) {
      try {
        if (selectedBill) {
          selectedBill.mailBody = mailGreeting;
          const formData = new FormData();
          formData.append("file", attachment!, "billingSummary.pdf");
          formData.append("billData", JSON.stringify(selectedBill));
          const response = await sendBillEmailApi(email, formData);
          if (response?.status === 200) {
            toast.success(`Email Sent to ${email}`);
            setIsOpen(false);
          } else {
            toast.error(`Failed to send to ${email}`);
          }
        }
      } catch (err) {
        toast.error(`Error sending email to ${email}`);
      }
    }
    setIsLoading(false);
  };

  const selectBillForPreview = (bill: billInputs) => {
    setSelectedBill(bill);
    setShowPreview(true);
  };

  const onDeleteBillHandler = async (id: string) => {
    const response = await deleteBillApi(id);
    if (response?.status === 200) {
      toast.success("Bill Deleted");
      setShowPreview(false);
      getBillDetails();
    } else {
      toast.error("Failed to Delete Bill");
    }
  };

  const onDeleteBillHandlerOnNotification = async (bill: billInputs) => {
    const data = {
      requestId: bill.billNumber,
      title: "Bill delete",
      message: branch.branchName,
      description: branch.branchId,
      status: "delete",
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const getBillDetails = async (branchId?: string) => {
    const response = await getBillDetailsApi();
    if (response?.status === 200) {
      const billData = branchId
        ? response.data.data.filter((data: any) => data.branchesId === branchId)
        : response.data.data;
      setBillData(billData);
      setFilteredBills(billData);
    }
  };

  const resetData = () => {
    setFormstate("create");
    setIsRecordModalOpen(false);
    setOldRecordData(null);
  };

  async function fetchCompanyProfile() {
    const response = await getCompanyProfileApi();
    if (response?.status === 200) {
      setCompanyProfile(response.data.data);
    }
  }

  useEffect(() => {
    fetchCompanyProfile();
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);
      if (isAdmin === "true") {
        setIsAdmin(true);
        setBranch({
          branchId: "",
          adminId: branchDetails.id,
          branchName: branchDetails.branchName,
        });
      } else {
        setIsAdmin(false);
        setBranch({
          branchId: branchDetails.id,
          adminId: "",
          branchName: branchDetails.branchName,
        });
      }
    }
  }, []);

  return (
    <>
      <section className="relative flex gap-5">
        <form
          className="absolute -top-18 right-[13vw] flex items-center gap-2"
          onSubmit={handleSearch}
        >
          <div className="flex items-center gap-2 rounded-full bg-white p-[15px] px-5">
            <input
              placeholder="Search"
              className="outline-none placeholder:font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="cursor-pointer rounded-xl p-6">
            <LuSearch size={30} className="mx-3 scale-125" />
          </Button>
        </form>
        <motion.div
          animate={{ width: showPreview ? "50%" : "100%" }}
          transition={{ duration: 0.3 }}
          className={`flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5`}
        >
          <div className={`flex items-center justify-between`}>
            <p className="text-xl font-medium">Bills</p>
            <div className="flex gap-5">
              <Button
                variant={"outline"}
                className="border-primary text-primary cursor-pointer rounded-xl p-5"
                onClick={() => setIsBulkModalOpen(true)}
              >
                Bulk Record
              </Button>
              {!showPreview && (
                <Button
                  variant={"outline"}
                  className="border-primary text-primary cursor-pointer rounded-2xl p-5"
                  onClick={() => [
                    sectionChangeHandler({
                      billList: false,
                      createNew: true,
                    }),
                    setSupplementary(true),
                  ]}
                >
                  <MdOutlineAdd size={34} /> Add Supplementary
                </Button>
              )}
              <Button
                className="bg-primary hover:bg-primary cursor-pointer rounded-2xl p-5"
                onClick={() => [
                  setSupplementary(false),
                  sectionChangeHandler({
                    billList: false,
                    createNew: true,
                  }),
                ]}
              >
                <MdOutlineAdd size={34} />
                Create new
              </Button>
              {!search && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <p>
                    {startIndex}-{endIndex}
                  </p>
                  <p>of</p>
                  <p>{totalItems}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className={`cursor-pointer ${currentPage === 1 ? "opacity-50" : ""}`}
                    >
                      <MdOutlineChevronLeft size={20} />
                    </button>
                    <button
                      className={`cursor-pointer ${currentPage === totalPages ? "opacity-50" : ""}`}
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                    >
                      <MdOutlineChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-y-auto pr-2">
          <table className={`w-full ${showPreview ? "text-xs" : ""} scroll-auto`}>
            <thead>
              <tr>
                <th className="items-center  text-start font-[400] text-[#797979] border">
                  Bill ID
                </th>
                <th className="text-start font-[400] text-[#797979] border">
                  Client Name
                </th>
                <th className="text-start font-[400] text-[#797979] border">
                    Date
                </th>
                <th className="text-start font-[400] text-[#797979] border ">
                  Freight Amount
                </th>
                <th className="text-start font-[400] text-[#797979] border ">
                  Payment Recieved
                </th>
                <th className="text-start font-[400] text-[#797979] border ">
                  Payment Recieved Date
                </th>
                {!showPreview && (
                  <>
                    <th className="text-start font-[400] text-[#797979] border ">
                      Pending Payment
                    </th>
                    <th className="font-[400] text-[#797979] border">Deduction</th>
                  </>
                )}
                <th className="font-[400] text-[#797979] border">TDS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((data) => (
                <tr
                  className={`hover:bg-accent cursor-pointer ${selectedBill?.billNumber === data.billNumber ? "bg-accent" : ""}`}
                  key={data.id}
                  onClick={() => [
                    selectBillForPreview(data),
                    setEmailIds(data.Client.email),
                  ]}
                >
                  <td className="py-2 border">{data.billNumber}</td>
                  <td className="py-2 border">{data.Client?.name}</td>
                  <td className="py-2 border">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 border">{formatter.format(data.subTotal)}</td>
                  <td className="py-2 border">
                    {formatter.format(
                      parseFloat(data.zeroToThirty) +
                        parseFloat(data.thirtyToSixty) +
                        parseFloat(data.sixtyPlus),
                    )}
                  </td>
                  <td className="py-2 text-center border">
                    {data.PaymentRecords.length > 0
                      ? new Date(
                          data.PaymentRecords[
                            data.PaymentRecords.length - 1
                          ].date,
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  {!showPreview && (
                    <>
                      <td className="py-2 border">
                        {formatter.format(data.pendingAmount)}
                      </td>
                      <td className="py-2 text-center border">
                        {data.WriteOff?.amount || 0}
                      </td>
                    </>
                  )}
                  <td className="py-2 text-center border">
                    {formatter.format(
                      data.subTotal * (data?.tds ? data?.tds / 100 : 0.01),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </motion.div>
        <motion.div
          className="hidden h-[84vh] flex-col gap-5 rounded-md bg-white p-5"
          animate={{
            width: showPreview ? "50%" : "0%",
            display: showPreview ? "flex" : "none",
            opacity: showPreview ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-medium">
              Bill# {selectedBill?.billNumber}
            </h3>
            <div className="flex items-center gap-2">
              {selectedBill?.WriteOff != null && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer rounded-xl border border-red-500 p-2 text-sm font-medium text-red-500 hover:bg-slate-100 hover:text-black">
                    Delete Write off
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        This action will delete the write off. Are you sure you
                        want to delete this write off? This action is permanent
                        and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          onDeleteWriteOff(selectedBill!.billNumber)
                        }
                      >
                        Proceed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {selectedBill?.WriteOff == null && (
                <Button
                  variant={"outline"}
                  className="border-primary text-primary cursor-pointer rounded-3xl"
                  onClick={() => [setIsWriteOffModalOpen(true)]}
                >
                  Write off
                </Button>
              )}
              <Button
                variant={"outline"}
                className="border-primary text-primary cursor-pointer rounded-3xl"
                onClick={() => [
                  setIsRecordModalOpen(true),
                  reset(),
                  setFormstate("create"),
                ]}
              >
                <PiRecord className="size-5" />
                Record Payment
              </Button>

              <button className="bg-primary/50 cursor-pointer rounded-full p-1">
                <RxCross2
                  size={20}
                  color="white"
                  onClick={() => setShowPreview(false)}
                />
              </button>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                className="rounded-2xl"
                onClick={() => [
                  sectionChangeHandler({
                    billList: false,
                    createNew: true,
                  }),
                  setSelectedBillToEdit(selectedBill!),
                ]}
              >
                Edit details
              </Button>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className="border-primary cursor-pointer rounded-2xl border p-1 px-4 font-medium">
                  Send mail
                </DialogTrigger>
                <DialogContent className="h-[60vh] min-w-7xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Send Mail</DialogTitle>
                  </DialogHeader>
                  <DialogDescription></DialogDescription>
                  <div className="flex flex-col gap-5">
                    <div className="flex border-b pb-1 text-sm">
                      <p>To</p>
                      <input
                        type="text"
                        className="w-[90%] pl-2"
                        value={emailIds}
                        onChange={(e) => setEmailIds(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-5 border-b pb-1 text-sm">
                      <p>Subject</p>
                      <p>
                        Billing summary for Shipment - #
                        {selectedBill?.billNumber}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p>Hi There,</p>
                      <textarea
                        className="h-[10vh]"
                        value={mailGreeting}
                        onChange={(e) => setMailGreeting(e.target.value)}
                      ></textarea>
                      <div>
                        <div className="flex">
                          <label className="pb-3">
                            Billing summary details:
                          </label>
                        </div>
                        <div className="flex">
                          <label>Bill Number</label>
                          <p>: {selectedBill?.billNumber}</p>
                        </div>
                        <div className="flex">
                          <label>Billing Date</label>
                          <p>
                            :{" "}
                            {new Date(
                              selectedBill?.date || "",
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex">
                          <label>LR Numbers</label>
                          <p className="w-[70%]">
                            :{" "}
                            {selectedBill?.lrData
                              ?.map((lr) => lr.lrNumber)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="flex">
                          <label>CLient Name:</label>
                          <p> {selectedBill?.Client?.name}</p>
                        </div>
                        <div className="flex gap-3">
                          <label>Pickup Location(s):</label>
                          <p className="w-[70%]">
                            {selectedBill?.lrData
                              ?.map((lr) => lr.from)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <label>Delivery Location(s) :</label>
                          <p className="w-[70%]">
                            {selectedBill?.lrData
                              ?.map((lr) => lr.to)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="flex">
                          <label>Total Amount</label>
                          <p>: INR {selectedBill?.total.toFixed(2)}</p>
                        </div>
                        <div className="flex">
                          <label>Payment Due Date</label>
                          <p>
                            :{" "}
                            {new Date(
                              selectedBill?.dueDate || "",
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p>Warm Regards,</p>
                        <p>Shivam Jha</p>
                        <p>CEO</p>
                        <p>Shree LN Logistics</p>
                        <p>+91 90364416521</p>
                        <p>Website: www.shreelnlogistics.com</p>
                        <div className="py-5">
                          <img src={logo} alt="logo" />
                        </div>
                        <p className="w-100">
                          Flat No.203, 3rd Floor, Sai Godavari Apartment,
                          Kuduregere Road, Madanayakanahalli, Bangalore Rural
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">Attachments</p>
                        <div className="my-1 flex w-[30%] items-center justify-between rounded-md bg-[#E9EDF7] px-5 py-1">
                          <p className="flex items-center gap-5">
                            BILL {selectedBill?.billNumber}
                            <span className="text-sm text-[#A3AED0]">
                              ({attachment?.size.toString().substring(0, 3)}kb)
                            </span>
                          </p>
                          <RxCross2 size={15} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-5">
                        <Button
                          variant={"outline"}
                          className="border-primary text-primary"
                          onClick={() => setIsOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => [onSendEmailHandler()]}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <VscLoading size={20} className="animate-spin" />
                          ) : (
                            "Send Mail"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium">TDS</p>
              <Select
                value={selectedBill?.tds?.toString()}
                onValueChange={updateTdsvalue}
              >
                <SelectTrigger className="border-primary cursor-pointer rounded-2xl border p-1 px-4 font-medium">
                  <SelectValue placeholder="Select a TDS" />%
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={downloadPdfFile} className="cursor-pointer">
                <MdOutlineFileDownload size={20} />
              </button>
              {!isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer">
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        This will send the admin an delete request. Upon
                        approval the Bill will be deleted
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() =>
                          onDeleteBillHandlerOnNotification(selectedBill!)
                        }
                      >
                        Proceed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer">
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        Are you sure you want to delete this Customer Bill? This
                        action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() => onDeleteBillHandler(selectedBill!.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <PDFViewer className="h-full w-full">
            <BillTemplate
              billInputs={selectedBill}
              companyProfile={companyProfile}
              bankDetails={bankDetails}
            />
          </PDFViewer>
        </motion.div>
      </section>
      <Modal
        open={isBulkModalOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => [
          setIsBulkModalOpen(false),
          setBillList([]),
          setBillListForBulk([]),
          resetBulk(),
        ]}
        className="max-h-[80vh] overflow-y-auto"
      >
        <div>
          <p className="mb-5 text-xl font-semibold">Bill Bulk Record</p>
        </div>
        <form
          onSubmit={handleBulkSubmit(onBulkSubmit)}
          className="flex flex-wrap justify-between gap-5"
        >
          <div className="flex w-[50%] flex-col gap-2">
            <label>Client Name</label>
            <Controller
              name="vendorName"
              control={controlBulk}
              defaultValue={""}
              render={({ field }) => (
                <AntSelect
                  onChange={(value) => {
                    const selectedClient = clients.find(
                      (client) => client.name === value,
                    );
                    const selectedBill = isAdmin
                      ? selectedClient?.bill || []
                      : selectedClient?.bill.filter(
                          (bill) => bill.branchesId === branch.branchId,
                        ) || [];
                    setBillList(selectedBill);
                    console.log(selectedBill);
                    field.onChange(value);
                  }}
                  value={field.value}
                  options={clients.map((client) => ({
                    value: client.name,
                    label: client.name,
                  }))}
                  showSearch
                  placeholder="Select clients"
                  className="outline-primary w-full rounded-md outline"
                  size="large"
                />
              )}
            />
          </div>
          <div className="w-[48%]">
            <div className="flex flex-col gap-2">
              <label>Date</label>
              <input
                type="date"
                className="border-primary rounded-md border p-2"
                {...registerBulk("date", { required: true })}
              />
              {errorsBulk.date && (
                <p className="text-red-500">Date is required</p>
              )}
            </div>
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label>Transaction ID/ Cheque Number</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...registerBulk("transactionNumber", { required: true })}
              />
              {errorsBulk.transactionNumber && (
                <p className="text-red-500">Transaction Number is required</p>
              )}
            </div>
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label>Payment Mode</label>

              <Controller
                name="paymentMode"
                control={controlBulk}
                defaultValue={""}
                rules={{ required: true }}
                render={({ field }) => (
                  <AntSelect
                    {...field}
                    value={field.value}
                    options={[
                      { value: "Cash", label: "Cash" },
                      { value: "IMPS", label: "IMPS" },
                      { value: "RTGS", label: "RTGS" },
                      { value: "NEFT", label: "NEFT" },
                      { value: "Cheque", label: "Cheque" },
                      { value: "Nill", label: "Nill" },
                    ]}
                    placeholder="Select Payment mode"
                    className="outline-primary w-full rounded-md outline"
                    size="large"
                  />
                )}
              />

              {errorsBulk.paymentMode && (
                <p className="text-red-500">Payment Method is required</p>
              )}
            </div>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label>Remarks</label>
              <input
                className="border-primary rounded-md border p-2"
                {...registerBulk("remarks", { required: true })}
              />
            </div>
            {errorsBulk.remarks && (
              <p className="text-red-500">Remarks is required</p>
            )}
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <th className="border text-sm font-medium">SL NO.</th>
                <th className="border text-sm font-medium">Bill Number</th>
                <th className="border text-sm font-medium">Amount</th>
                <th className="border text-sm font-medium">Pending Amount</th>
                <th className="border text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-sm">
                <td className="border py-2"></td>
                <td className="border py-2">
                  <AntSelect
                    onChange={(val) => {
                      const bill = BillList.find((FM) => FM.billNumber === val);
                      if (bill) {
                        setBillListForBulk((prev) => [
                          ...prev,
                          {
                            billNumber: bill.billNumber,
                            amount: "0",
                            amountInWords: "0",
                            pendingAmount: bill.pendingAmount || 0,
                          },
                        ]);
                      }
                    }}
                    allowClear
                    options={BillList.map((bill) => ({
                      value: bill.billNumber,
                      label: bill.billNumber,
                    }))}
                    showSearch
                    placeholder="Select Payment mode"
                    className="outline-primary w-full rounded-md outline"
                    size="large"
                  />
                </td>
                <td className="border py-2"></td>
                <td className="border py-2"></td>
                <td className="border py-2"></td>
              </tr>
              {BillListForBulk.map((data, i) => (
                <tr className="text-sm" key={i}>
                  <td className="border py-2 text-center">{i + 1}</td>
                  <td className="border py-2 text-center">{data.billNumber}</td>
                  <td className="border py-2">
                    <input
                      value={data.amount}
                      type="number"
                      className="border-primary w-full rounded-md border p-2"
                      onChange={(e) =>
                        setBillListForBulk((prev) => {
                          const updatedData = prev.map((item) => {
                            if (item.billNumber === data.billNumber) {
                              const originalFM = BillList.find(
                                (fm) => fm.billNumber === data.billNumber,
                              );
                              const currentAmount =
                                parseFloat(e.target.value) || 0;
                              return {
                                ...item,
                                amount: e.target.value,
                                amountInWords:
                                  numberToIndianWords(currentAmount) || "0",
                                pendingAmount:
                                  (originalFM?.pendingAmount || 0) -
                                  currentAmount,
                              };
                            }
                            return item;
                          });
                          return updatedData;
                        })
                      }
                    />
                  </td>
                  <td className="border py-2 text-center">
                    {data.pendingAmount}
                  </td>
                  <td className="cursor-pointer justify-items-center border py-2">
                    <BiTrash
                      size={20}
                      color="red"
                      onClick={() =>
                        setBillListForBulk((prev) =>
                          prev.filter(
                            (item) => item.billNumber !== data.billNumber,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex w-full justify-end gap-5">
            <Button
              type="button"
              variant={"outline"}
              className="border-primary text-primary"
              onClick={() => [
                setIsBulkModalOpen(false),
                setBillList([]),
                setBillListForBulk([]),
                resetBulk(),
              ]}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button className="rounded-xl px-7" disabled={isLoading}>
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : (
                "Record Bulk"
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <Dialog open={isWriteOffModalOpen} onOpenChange={setIsWriteOffModalOpen}>
        <DialogTrigger className="hidden"></DialogTrigger>
        <DialogContent className="min-w-7xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-2xl">
              Write off {selectedBill?.billNumber}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <form
            onSubmit={handleWriteOffSubmit(onWriteOff)}
            className="flex flex-wrap justify-between gap-5"
          >
            <div className="w-[50%]">
              <div className="flex flex-col gap-2">
                <label>Bill ID</label>
                <input
                  type="text"
                  className="border-primary cursor-not-allowed rounded-md border p-2"
                  {...registerWriteOff("IDNumber")}
                  value={selectedBill?.billNumber}
                  disabled
                />
              </div>
            </div>
            <div className="w-[48%]">
              <div className="flex flex-col gap-2">
                <label>Date</label>
                <input
                  type="date"
                  className="border-primary rounded-md border p-2"
                  {...registerWriteOff("date", { required: true })}
                />
                {errorsWriteOff.date && (
                  <p className="text-red-500">Date is required</p>
                )}
              </div>
            </div>
            <div className="w-[50%]">
              <div className="flex flex-col gap-2">
                <label>Vendor Name</label>
                <input
                  type="text"
                  className="border-primary cursor-not-allowed rounded-md border p-2"
                  {...registerWriteOff("vendorName")}
                  value={selectedBill?.Client.name}
                  disabled
                />
              </div>
            </div>
            <div className="w-[48%]">
              <div className="flex flex-col gap-2">
                <label>Write off Amount</label>
                <input
                  type="text"
                  className="border-primary cursor-not-allowed rounded-md border p-2"
                  {...registerWriteOff("amount", { required: true })}
                  value={selectedBill?.pendingAmount}
                  disabled
                />
              </div>
            </div>

            <div className="w-full">
              <div className="flex flex-col gap-2">
                <label>Write off reason</label>
                <textarea
                  className="border-primary rounded-md border p-2"
                  {...registerWriteOff("reason")}
                />
              </div>
            </div>
            <div className="w-full">
              <div className="flex items-end gap-2">
                <Controller
                  name="checked"
                  control={controlWriteOff}
                  render={({ field }) => (
                    <Checkbox
                      id="checked"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    >
                      Include reason in remarks
                    </Checkbox>
                  )}
                />
              </div>
            </div>

            <div className="flex w-full justify-end gap-5">
              <Button
                type="button"
                variant={"outline"}
                className="border-primary text-primary"
                onClick={() => setIsWriteOffModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button className="rounded-xl px-7" disabled={isLoading}>
                {isLoading ? (
                  <VscLoading size={24} className="animate-spin" />
                ) : (
                  "Write Off"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogTrigger className="hidden"></DialogTrigger>
        <DialogContent className="min-w-7xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-2xl">
              Record Payment Customer Bill# {selectedBill?.billNumber}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-wrap justify-between gap-5"
          >
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Bill Number</label>
                <input
                  type="text"
                  className="border-primary cursor-not-allowed rounded-md border p-2"
                  {...register("IDNumber")}
                  value={selectedBill?.billNumber}
                  disabled
                />
              </div>
            </div>
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Date</label>
                <input
                  type="date"
                  className="border-primary rounded-md border p-2"
                  {...register("date", { required: true })}
                />
                {errors.date && (
                  <p className="text-red-500">Date is required</p>
                )}
              </div>
            </div>
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Client Name</label>
                <input
                  type="text"
                  className="border-primary rounded-md border p-2"
                  {...register("customerName")}
                  value={selectedBill?.Client?.name}
                  disabled
                />
              </div>
            </div>
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Amount</label>
                <input
                  type="text"
                  className="border-primary rounded-md border p-2"
                  {...register("amount", { required: true })}
                />
                {errors.amount && (
                  <p className="text-red-500">Amount is required</p>
                )}
              </div>
            </div>
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Amount In Words (auto-generated)</label>
                <input
                  type="text"
                  className="border-primary rounded-md border p-2"
                  {...register("amountInWords", { required: true })}
                />
                {errors.amountInWords && (
                  <p className="text-red-500">Amount is required</p>
                )}
              </div>
            </div>
            <div className="w-[30%]">
              <div className="flex flex-col gap-2">
                <label>Pending Amount</label>
                <input
                  type="text"
                  className="border-primary rounded-md border p-2"
                  {...register("pendingAmount")}
                />
              </div>
            </div>
            <div className="w-[49%]">
              <div className="flex flex-col gap-2">
                <label>Transaction ID/ Cheque Number</label>
                <input
                  type="text"
                  className="border-primary rounded-md border p-2"
                  {...register("transactionNumber", { required: true })}
                />
                {errors.transactionNumber && (
                  <p className="text-red-500">Transaction Number is required</p>
                )}
              </div>
            </div>
            <div className="w-[49%]">
              <div className="flex flex-col gap-2">
                <label>Payment Mode</label>
                <Controller
                  name="paymentMode"
                  control={control}
                  defaultValue={""}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className="w-full"
                        size="large"
                        style={{ border: "1px solid #64BAFF" }}
                      >
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="IMPS">IMPS</SelectItem>
                        <SelectItem value="RTGS">RTGS</SelectItem>
                        <SelectItem value="NEFT">NEFT</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Bond">Bond</SelectItem>
                        <SelectItem value="Nill">Nill</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentMode && (
                  <p className="text-red-500">Payment Method is required</p>
                )}
              </div>
            </div>

            <div className="w-full">
              <div className="flex flex-col gap-2">
                <label>Remarks</label>
                <input
                  className="border-primary rounded-md border p-2"
                  {...register("remarks", { required: true })}
                />
              </div>
              {errors.remarks && (
                <p className="text-red-500">Remarks is required</p>
              )}
            </div>
            {selectedBill?.PaymentRecords &&
              selectedBill?.PaymentRecords?.length > 0 && (
                <div className="w-full">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="bg-primary/20 px-4">
                        Recent Payments
                      </AccordionTrigger>
                      <AccordionContent className="bg-primary/20 max-h-[30vh] overflow-y-auto rounded-b-md px-2">
                        <table className="w-full rounded-md bg-white px-2">
                          <thead>
                            <tr>
                              <th className="p-1 font-medium">Sl no</th>
                              <th className="font-medium">Amount Received</th>
                              <th className="font-medium">Date</th>
                              <th className="font-medium">Payment mode</th>
                              <th className="font-medium">Remarks</th>
                              <th className="font-medium">
                                Trans. ID/Cheque Number
                              </th>
                              <th className="font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBill?.PaymentRecords?.map(
                              (record, index) => (
                                <tr
                                  className="hover:bg-accent text-center"
                                  key={record.id}
                                >
                                  <td className="p-2">{index + 1}</td>
                                  <td>{record.amount}</td>
                                  <td>
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td>{record.paymentMode}</td>
                                  <td className="max-w-70">{record.remarks}</td>
                                  <td>{record.transactionNumber}</td>
                                  <td className="flex justify-center gap-2">
                                    <button
                                      className="cursor-pointer"
                                      type="button"
                                    >
                                      <RiEditBoxLine
                                        size={20}
                                        onClick={() => [
                                          setRecordDataToInputBox(record),
                                          setFormstate("edit"),
                                          setRecordEditValue(record.amount),
                                        ]}
                                      />
                                    </button>
                                    {!isAdmin && (
                                      <AlertDialog>
                                        <AlertDialogTrigger className="cursor-pointer">
                                          <RiDeleteBin6Line
                                            size={20}
                                            color="red"
                                          />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Alert!
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="font-medium text-black">
                                              This will send the admin an edit
                                              request. Upon approval the changes
                                              will be updated
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                                              onClick={() =>
                                                onBillRecordDeleteHandlerByNotification(
                                                  record,
                                                )
                                              }
                                            >
                                              Proceed
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                    {isAdmin && (
                                      <AlertDialog>
                                        <AlertDialogTrigger className="cursor-pointer">
                                          <RiDeleteBin6Line
                                            size={20}
                                            color="red"
                                          />
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Alert!
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="font-medium text-black">
                                              Are you sure you want to delete
                                              this Payment Record? This action
                                              is permanent and cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                                              onClick={() =>
                                                deletePaymentRecordFromBill(
                                                  record.id,
                                                )
                                              }
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

            <div className="flex w-full justify-end gap-5">
              <Button
                type="button"
                variant={"outline"}
                className="border-primary text-primary"
                onClick={() => setIsRecordModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button className="rounded-xl px-7" disabled={isLoading}>
                {isLoading ? (
                  <VscLoading size={24} className="animate-spin" />
                ) : formstate === "create" ? (
                  "Record Payment"
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={notificationAlertOpen}
        onOpenChange={setNotificationAlertOpen}
      >
        <DialogTrigger className="cursor-pointer"></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alert!</DialogTitle>
            <DialogDescription className="font-medium text-black">
              This will send the admin an edit request. Upon approval the
              changes will be updated
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={editBillPaymentOnNotification}
              disabled={isLoading}
            >
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : (
                "Proceed"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
