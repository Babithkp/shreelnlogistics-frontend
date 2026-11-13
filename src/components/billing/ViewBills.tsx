import logo from "../../assets/logisticsLogo.svg";
import { useEffect, useState, type MutableRefObject } from "react";
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
import { Pencil, Mail, Paperclip } from "lucide-react";
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

type DiffField = {
  obj1: any;
  obj2: any;
};

type EditableData = {
  id: string;
  [key: string]: DiffField | string;
};

export default function ViewBills({
  sectionChangeHandler,
  setSelectedBillToEdit,
  bankDetails,
  data,
  setSupplementary,
  clients,
  onRefresh,
  searchValue,
  searchSubmitRef,
}: {
  sectionChangeHandler: (section: any) => void;
  setSelectedBillToEdit: (data: billInputs) => void;
  bankDetails?: BankDetailsInputs;
  data: billInputs[];
  setSupplementary: (data: boolean) => void;
  clients: ClientInputs[];
  onRefresh: () => void;
  searchValue: string;
  searchSubmitRef: MutableRefObject<() => void>;
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
  const [editAbleData, setEditAbleData] = useState<EditableData | undefined>();
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [BillList, setBillList] = useState<billInputs[]>([]);
  const [BillListForBulk, setBillListForBulk] = useState<BulkBillList[]>([]);
  const search = searchValue;
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
          selectedBill.pendingAmount != null
            ? String(selectedBill.pendingAmount)
            : "",
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

  const handleSearch = () => {
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
    searchSubmitRef.current = handleSearch;
  });

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
      setEditAbleData({
        ...recordData,
        id: data.id,
      });
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
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message || "Failed to Create Write Off",
      );
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
    // if ()
    const data = {
      requestId: oldRecordData?.IDNumber,
      entityType: "Bill record",
      actionType: "edit",
      createdByRole: branch.branchName,
      createdById: branch.branchId,
      status: "pending",
      data: JSON.stringify(editAbleData),
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
      entityType: "Bill record",
      actionType: "delete",
      createdByRole: branch.branchName,
      createdById: branch.branchId,
      data: JSON.stringify(record.id),
      status: "pending",
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
      entityType: "Bill",
      actionType: "delete",
      createdByRole: branch.branchName,
      createdById: branch.branchId,
      status: "pending",
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
        <motion.div
          animate={{ width: showPreview ? "50%" : "100%" }}
          transition={{ duration: 0.3 }}
          className={`flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm`}
        >
          <div className={`flex items-center justify-between`}>
            <p className="text-xl font-semibold text-slate-900">Bills</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-primary/30 px-5 text-primary hover:bg-primary/5"
                onClick={() => setIsBulkModalOpen(true)}
              >
                Bulk Record
              </Button>
              {!showPreview && (
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl border-primary/30 px-5 text-primary hover:bg-primary/5"
                  onClick={() => [
                    sectionChangeHandler({
                      billList: false,
                      createNew: true,
                    }),
                    setSupplementary(true),
                  ]}
                >
                  <MdOutlineAdd size={20} /> Add Supplementary
                </Button>
              )}
              <Button
                className="gap-2 rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
                onClick={() => [
                  setSupplementary(false),
                  sectionChangeHandler({
                    billList: false,
                    createNew: true,
                  }),
                ]}
              >
                <MdOutlineAdd size={20} />
                Create new
              </Button>
              {!search && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <p>
                    {startIndex}-{endIndex}{" "}
                    <span className="text-slate-400">of</span> {totalItems}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className={`cursor-pointer rounded-md p-1 hover:bg-slate-100 ${currentPage === 1 ? "opacity-40" : ""}`}
                    >
                      <MdOutlineChevronLeft size={20} />
                    </button>
                    <button
                      className={`cursor-pointer rounded-md p-1 hover:bg-slate-100 ${currentPage === totalPages ? "opacity-40" : ""}`}
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
          <div className="overflow-y-auto pr-1">
            <table className={`w-full ${showPreview ? "text-xs" : "text-sm"}`}>
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Bill ID
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Client Name
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Freight Amount
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Payment Recieved
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Payment Recieved Date
                  </th>
                  {!showPreview && (
                    <>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Pending Payment
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Deduction
                      </th>
                    </>
                  )}
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    TDS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((data) => (
                  <tr
                    className={`cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 ${
                      selectedBill?.billNumber === data.billNumber
                        ? "bg-primary/5"
                        : ""
                    }`}
                    key={data.id}
                    onClick={() => [
                      selectBillForPreview(data),
                      setEmailIds(data.Client.email),
                    ]}
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {data.billNumber}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {data.Client?.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {new Date(data.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatter.format(data.subTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatter.format(
                        parseFloat(data.zeroToThirty) +
                          parseFloat(data.thirtyToSixty) +
                          parseFloat(data.sixtyPlus),
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
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
                        <td className="px-3 py-2.5 text-slate-700">
                          {formatter.format(data.pendingAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {data.WriteOff?.amount || 0}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatter.format(
                        data.subTotal * (data?.tds ? data?.tds / 100 : 0.0),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        <motion.div
          className="hidden h-[84vh] flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          animate={{
            width: showPreview ? "50%" : "0%",
            display: showPreview ? "flex" : "none",
            opacity: showPreview ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Bill #{selectedBill?.billNumber}
              </p>
              <p className="text-xs text-slate-500">
                {selectedBill?.Client?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedBill?.WriteOff != null && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50">
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
                  variant="outline"
                  className="rounded-lg border-primary/30 px-4 text-primary hover:bg-primary/5"
                  onClick={() => [setIsWriteOffModalOpen(true)]}
                >
                  Write off
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 rounded-lg border-primary/30 px-4 text-primary hover:bg-primary/5"
                onClick={() => [
                  setIsRecordModalOpen(true),
                  reset(),
                  setFormstate("create"),
                ]}
              >
                <PiRecord className="size-4" />
                Record Payment
              </Button>

              <button
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setShowPreview(false)}
              >
                <RxCross2 size={18} />
              </button>
            </div>
          </div>
          <div className="flex w-full items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Button
                className="gap-2 rounded-lg bg-primary px-4 text-white hover:bg-primary/90"
                onClick={() => [
                  sectionChangeHandler({
                    billList: false,
                    createNew: true,
                  }),
                  setSelectedBillToEdit(selectedBill!),
                ]}
              >
                <Pencil size={14} />
                Edit details
              </Button>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">
                  <Mail size={14} />
                  Send mail
                </DialogTrigger>
                <DialogContent className="h-[85vh] min-w-7xl overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Mail size={20} />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-semibold text-slate-900">
                          Send Mail
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                          Email the Bill PDF to one or more recipients
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="flex flex-col gap-5">
                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-slate-500">
                            To
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                            value={emailIds}
                            onChange={(e) => setEmailIds(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-slate-500">
                            Subject
                          </label>
                          <p className="text-sm text-slate-900">
                            Billing summary for Shipment - #
                            {selectedBill?.billNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-slate-500">
                          Message
                        </label>
                        <p className="text-sm text-slate-700">Hi there,</p>
                        <textarea
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                          rows={3}
                          value={mailGreeting}
                          onChange={(e) => setMailGreeting(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="mb-2 text-xs font-medium text-slate-500">
                          Billing Summary Details
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Bill Number
                            </p>
                            <p className="text-slate-900">
                              {selectedBill?.billNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Billing Date
                            </p>
                            <p className="text-slate-900">
                              {new Date(
                                selectedBill?.date || "",
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Client Name
                            </p>
                            <p className="text-slate-900">
                              {selectedBill?.Client?.name}
                            </p>
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs font-medium text-slate-500">
                              LR Numbers
                            </p>
                            <p className="text-slate-900">
                              {selectedBill?.lrData
                                ?.map((lr) => lr.lrNumber)
                                .join(", ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Pickup Location(s)
                            </p>
                            <p className="text-slate-900">
                              {selectedBill?.lrData
                                ?.map((lr) => lr.from)
                                .join(", ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Delivery Location(s)
                            </p>
                            <p className="text-slate-900">
                              {selectedBill?.lrData
                                ?.map((lr) => lr.to)
                                .join(", ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Total Amount
                            </p>
                            <p className="text-slate-900">
                              INR {selectedBill?.total.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Payment Due Date
                            </p>
                            <p className="text-slate-900">
                              {new Date(
                                selectedBill?.dueDate || "",
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-700">
                      <p>Warm Regards,</p>
                      <p className="font-medium text-slate-900">
                        Shivam Jha
                      </p>
                      <p>CEO</p>
                      <p>Shree LN Logistics</p>
                      <p>+91 90364416521</p>
                      <p>Website: www.shreelnlogistics.com</p>
                      <div className="py-4">
                        <img src={logo} alt="logo" className="h-10 w-auto" />
                      </div>
                      <p className="w-100 text-slate-500">
                        Flat No.203, 3rd Floor, Sai Godavari Apartment,
                        Kuduregere Road, Madanayakanahalli, Bangalore Rural
                      </p>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs font-medium text-slate-500">
                        Attachments
                      </p>
                      <div className="flex w-fit items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                        <Paperclip size={16} className="text-slate-400" />
                        <p className="flex items-center gap-2 text-sm text-slate-700">
                          BILL {selectedBill?.billNumber}
                          <span className="text-xs text-slate-400">
                            ({attachment?.size.toString().substring(0, 3)}kb)
                          </span>
                        </p>
                        <RxCross2 size={14} className="text-slate-400" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                      <Button
                        variant="outline"
                        className="rounded-lg border-primary/30 px-6 text-primary hover:bg-primary/5"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="gap-2 rounded-lg bg-primary px-6 text-white hover:bg-primary/90"
                        onClick={() => [onSendEmailHandler()]}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <VscLoading size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Mail size={14} />
                            Send Mail
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-700">TDS</p>
              <Select
                value={selectedBill?.tds?.toString()}
                onValueChange={updateTdsvalue}
              >
                <SelectTrigger className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                  <SelectValue placeholder="Select a TDS" />%
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={downloadPdfFile}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
              >
                <MdOutlineFileDownload size={18} />
              </button>
              {!isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50">
                    <RiDeleteBin6Line size={18} />
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
                  <AlertDialogTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50">
                    <RiDeleteBin6Line size={18} />
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
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-100">
            <PDFViewer className="h-full w-full">
              <BillTemplate
                billInputs={selectedBill}
                companyProfile={companyProfile}
                bankDetails={bankDetails}
              />
            </PDFViewer>
          </div>
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
        <div className="mb-5">
            <p className="text-xl font-semibold text-slate-900">Bill Bulk Record</p>
            <p className="text-sm text-slate-500">
              Record one payment against multiple bills of a client
            </p>
          </div>
        <form
          onSubmit={handleBulkSubmit(onBulkSubmit)}
          className="flex flex-wrap justify-between gap-5"
        >
          <div className="flex w-[23%] flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Client Name</label>
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
                  className="w-full"
                  size="large"
                  style={{ border: "1px solid #64BAFF", borderRadius: "10px" }}
                />
              )}
            />
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                {...registerBulk("date", { required: true })}
              />
              {errorsBulk.date && (
                <p className="text-red-500">Date is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Transaction ID/ Cheque Number</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                {...registerBulk("transactionNumber", { required: true })}
              />
              {errorsBulk.transactionNumber && (
                <p className="text-red-500">Transaction Number is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Payment Mode</label>

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
                    className="w-full"
                    size="large"
                    style={{ border: "1px solid #64BAFF", borderRadius: "10px" }}
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
              <label className="text-sm font-medium text-slate-700">Remarks</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
                {...registerBulk("remarks", { required: true })}
              />
            </div>
            {errorsBulk.remarks && (
              <p className="text-red-500">Remarks is required</p>
            )}
          </div>

          <div className="w-full">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                <th className="border-slate-200 bg-slate-50 border p-1 px-3 text-start text-sm font-medium text-slate-600 rounded-tl-lg">Sl no</th>
                <th className="border-slate-200 bg-slate-50 border p-1 px-3 text-start text-sm font-medium text-slate-600">Bill Number</th>
                <th className="border-slate-200 bg-slate-50 border p-1 px-3 text-start text-sm font-medium text-slate-600">Amount</th>
                <th className="border-slate-200 bg-slate-50 border p-1 px-3 text-start text-sm font-medium text-slate-600">Pending Amount</th>
                <th className="border-slate-200 bg-slate-50 border p-1 px-3 text-start text-sm font-medium text-slate-600 rounded-tr-lg">Action</th>
                </tr>
              </thead>
            <tbody>
              <tr className="text-sm">
                <td className="border-slate-200 border p-2 align-top"></td>
                <td className="border-slate-200 border p-2 align-top">
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
                    placeholder="Select Bill Number"
                    className="w-full"
                    size="middle"
                    style={{ border: "none", borderRadius: "0px" }}
                  />
                </td>
                <td className="border-slate-200 border p-2 align-top"></td>
                <td className="border-slate-200 border p-2 align-top"></td>
                <td className="border-slate-200 border p-2 align-top"></td>
              </tr>
              {BillListForBulk.map((data, i) => (
                <tr className="text-sm"
                  key={i}
                >
                  <td className="border-slate-200 border p-2 align-top">{i + 1}</td>
                  <td className="border-slate-200 border p-2 align-top">{data.billNumber}</td>
                  <td className="border-slate-200 border p-2 align-top">
                    <input
                      value={data.amount}
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
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
                  <td className="border-slate-200 border p-2 align-top">
                    {data.pendingAmount}
                  </td>
                  <td className="border-slate-200 border p-2 align-top cursor-pointer text-center">
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
          </div>

          <div className="flex w-full justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg border-primary/30 px-6 text-primary hover:bg-primary/5"
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
            <Button
              className="cursor-pointer rounded-lg bg-primary px-6 text-white hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <VscLoading size={18} className="animate-spin" />
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
                  {...registerWriteOff("reason", { required: true })}
                />
                {errorsWriteOff.reason && (
                  <p className="text-red-500">Reason is required</p>
                )}
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
                        <table className="w-full overflow-hidden rounded-lg bg-white">
                          <thead>
                            <tr className="border-b border-slate-100 text-xs text-slate-500">
                              <th className="px-2 py-2 text-left font-medium">
                                Sl no
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Amount Received
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Date
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Payment mode
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Remarks
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Trans. ID/Cheque Number
                              </th>
                              <th className="px-2 py-2 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBill?.PaymentRecords?.map(
                              (record, index) => (
                                <tr
                                  className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50"
                                  key={record.id}
                                >
                                  <td className="px-2 py-2">{index + 1}</td>
                                  <td className="px-2 py-2">{record.amount}</td>
                                  <td className="px-2 py-2">
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-2 py-2">{record.paymentMode}</td>
                                  <td className="max-w-70 px-2 py-2">{record.remarks}</td>
                                  <td className="px-2 py-2">{record.transactionNumber}</td>
                                  <td className="flex justify-start gap-2 px-2 py-2">
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
