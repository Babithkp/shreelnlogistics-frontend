import { Button } from "@/components/ui/button";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdOutlineFileDownload,
} from "react-icons/md";
import { useEffect, useState } from "react";
import {
  addPaymentRecordToFMApi,
  createBulkPaymentApi,
  deleteFMApi,
  deletePaymentRecordFromFMApi,
  filterFMDetailsApi,
  filterFMDetailsForBranchApi,
  getFMByPageApi,
  getFMByPageForBranchApi,
  getLRByLrNumberApi,
  sendFMEmailApi,
} from "@/api/shipment";
import { motion } from "motion/react";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line, RiEditBoxLine } from "react-icons/ri";
import { PDFViewer } from "@react-pdf/renderer";
import { PiRecord } from "react-icons/pi";
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
import { Select as AntSelect } from "antd";
import { Checkbox } from "antd";

import { pdf } from "@react-pdf/renderer";
import logo from "../../../assets/logisticsLogo.svg";
import { toast } from "react-toastify";
import FormData from "form-data";
import { VscLoading } from "react-icons/vsc";
import { BranchDetails, FMSection } from "./FMPage";
import FMTemplate from "./FMTemplate";
import LRTemplate from "../LR/LRTemplate";
import { ProfileInputs } from "@/components/settings/Settings";
import { getCompanyProfileApi } from "@/api/settings";
import { Controller, useForm } from "react-hook-form";
import {
  numberToIndianWords,
  filterOnlyCompletePrimitiveDiffs,
  formatter,
  getUnmatchingFields,
} from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BulkRecord,
  FMInputs,
  PaymentRecord,
  VendorInputs,
  WriteOffInputs,
} from "@/types";
import { createNotificationApi } from "@/api/admin";

import { LuSearch } from "react-icons/lu";
import { Modal } from "antd";
import { BiTrash } from "react-icons/bi";
import { createFMWriteOffApi, deleteFmWriteOffApi } from "@/api/writeoff";

const defaultGreeting = (fmDate: string) =>
  `Please find attached the *Freight Memo (FM)* for the shipment handled on ${new Date(fmDate).toDateString()}`;
interface ExtendedFmInputs extends FMInputs {
  mailBody?: string;
}

const statusColorMap: Record<string, string> = {
  open: "text-green-500",
  onHold: "text-red-500",
  pending: "text-yellow-500",
};

interface BulkFMList {
  fmNumber: string;
  amount: string;
  amountInWords: string;
  pendingAmount: number;
}

export default function FMList({
  data,
  sectionChangeHandler,
  setSelectedFMDataToEdit,
  setFormStatus,
  branchDetails,
  vendors,
  onRefresh,
}: {
  data: {
    data: FMInputs[];
    count: number;
  };
  sectionChangeHandler: (section: FMSection) => void;
  setSelectedFMDataToEdit: (data: FMInputs) => void;
  setFormStatus: (status: "edit" | "create") => void;
  branchDetails?: BranchDetails;
  vendors: VendorInputs[];
  onRefresh: () => void;
}) {
  const [FMData, setFMData] = useState<FMInputs[]>(data.data);
  const [filteredFMs, setFilteredFMs] = useState<FMInputs[]>(data.data);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFM, setSelectedFM] = useState<ExtendedFmInputs | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [mailGreeting, setMailGreeting] = useState("");
  const [emailIds, setEmailIds] = useState("");
  const [attachment, setAttachment] = useState<Blob[]>([]);
  const [fetchedLrNumber, setFetchedLrNumber] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<ProfileInputs>();
  const [branch, setBranch] = useState({
    branchId: "",
    adminId: "",
  });
  const [branchName, setBranchName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formstate, setFormstate] = useState<"create" | "edit">("create");
  const [oldRecordData, setOldRecordData] = useState<PaymentRecord | null>(
    null,
  );
  const [editAbleData, setEditAbleData] =
    useState<Record<string, { obj1: any; obj2: any }>>();
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [FMList, setFMList] = useState<FMInputs[]>([]);
  const [FMListForBulk, setFMListForBulk] = useState<BulkFMList[]>([]);
  const [search, setSearch] = useState("");

  const [editingAmount, setEditingAmount] = useState("0");

  const [totalItems, setTotalItems] = useState(data.count);
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

  async function fetchFMDataForPage() {
    const response = await getFMByPageApi(currentPage, itemsPerPage);
    if (response?.status === 200) {
      const allFMs = response.data.data;
      setFMData(allFMs.FMData);
      setFilteredFMs(allFMs.FMData);
      setTotalItems(allFMs.FMCount);
    }
  }

  async function fetchFMDataForPageForBranch() {
    const response = await getFMByPageForBranchApi(
      currentPage,
      itemsPerPage,
      branch.branchId,
    );
    if (response?.status === 200) {
      const allFMs = response.data.data;
      setFMData(allFMs.FMData);
      setFilteredFMs(allFMs.FMData);
      setTotalItems(allFMs.FMCount);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchFMDataForPage();
    } else if (!isAdmin && branch.branchId) {
      fetchFMDataForPageForBranch();
    }
  }, [startIndex, endIndex]);

  useEffect(() => {
    if (isAdmin) {
      fetchFMDataForPage();
    } else if (!isAdmin && branch.branchId) {
      fetchFMDataForPageForBranch();
    }
  }, [isAdmin, branch.branchId]);

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
      totalPending = parseFloat(editingAmount);
    }
    if (amount && selectedFM) {
      const totalAmount = Number(amount);
      const amountInWords = numberToIndianWords(totalAmount);
      const pendingAmount =
        parseFloat(selectedFM?.outStandingBalance) - totalAmount;

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

  async function filterFMDetails(text: string) {
    const response = await filterFMDetailsApi(text);
    if (response?.status === 200) {
      const filteredFM = response.data.data;
      setFilteredFMs(filteredFM);
    }
  }

  async function filterFMDetailsForBranch(branchId: string, text: string) {
    const response = await filterFMDetailsForBranchApi(branchId, text);
    if (response?.status === 200) {
      const filteredFM = response.data.data;
      setFilteredFMs(filteredFM);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredFMs(FMData);
      return;
    }
    if (isAdmin) {
      filterFMDetails(search);
    } else {
      filterFMDetailsForBranch(branch.branchId, search);
    }
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredFMs(FMData);
    }
  }, [search]);

  const onSubmit = async (data: PaymentRecord) => {
    if (data.pendingAmount < 0) {
      toast.error("Pending Amount cannot be negative");
      return;
    }

    if (!isAdmin && formstate === "edit") {
      setSelectedFM((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          outStandingBalance: String(
            Number(prev.outStandingBalance) + Number(data.amount),
          ),
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
    if (selectedFM && branch) {
      if (isAdmin) {
        data.adminId = branch.adminId;
      } else {
        data.branchId = branch.branchId;
      }
      const response = await addPaymentRecordToFMApi(
        data,
        selectedFM?.fmNumber,
      );
      if (response?.status === 200) {
        toast.success("Payment Record Added");
        setIsRecordModalOpen(false);
        reset();
        resetData();
        setShowPreview(false);
        if (isAdmin) {
          fetchFMDataForPage();
        } else if (!isAdmin && branch.branchId) {
          fetchFMDataForPageForBranch();
        }
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  const onBulkSubmit = async (data: BulkRecord) => {
    if (FMListForBulk.length === 0) {
      toast.error("Please add at least one record");
      return;
    }
    const isvalidate = FMListForBulk.some(
      (FM) => parseFloat(FM.amount) <= 0 || FM.pendingAmount < 0,
    );
    if (isvalidate) {
      toast.error("Pending Amount or Amount cannot be in negative");
      return;
    }
    setIsLoading(true);
    try {
      const finalData: any = data;
      if (isAdmin) {
        finalData.adminId = branch.adminId;
      } else {
        finalData.branchId = branch.branchId;
      }
      finalData.FmData = FMListForBulk;
      const response = await createBulkPaymentApi(finalData);
      if (response?.status === 200) {
        toast.success("Payment Record Added");
        setIsBulkModalOpen(false);
        resetBulk();
        setFMList([]);
        setFMListForBulk([]);
        setShowPreview(false);
        onRefresh();

        if (isAdmin) {
          fetchFMDataForPage();
        } else if (!isAdmin && branch.branchId) {
          fetchFMDataForPageForBranch();
        }
      }
    } catch (error) {
      console.log(error);
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
      const response = await createFMWriteOffApi(finalData);
      if (response?.status === 200) {
        toast.success("Write Off Created");
        setIsWriteOffModalOpen(false);
        resetWriteOff();
        setShowPreview(false);
        if (isAdmin) {
          fetchFMDataForPage();
        } else if (!isAdmin && branch.branchId) {
          fetchFMDataForPageForBranch();
        }
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const onDeleteWriteOff = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await deleteFmWriteOffApi(id);
      if (response?.status === 200) {
        toast.success("Write Off Deleted");
        setShowPreview(false);
        if (isAdmin) {
          fetchFMDataForPage();
        } else if (!isAdmin && branch.branchId) {
          fetchFMDataForPageForBranch();
        }
      } else {
        toast.error("Failed to Delete Write Off");
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const deletePaymentRecordFromFM = async (id: string) => {
    if (!selectedFM) {
      return;
    }
    const response = await deletePaymentRecordFromFMApi(
      selectedFM?.fmNumber,
      id,
    );
    if (response?.status === 200) {
      toast.success("Payment Record Deleted");
      setIsRecordModalOpen(false);
      if (isAdmin) {
        fetchFMDataForPage();
      } else if (!isAdmin && branch.branchId) {
        fetchFMDataForPageForBranch();
      }
    } else {
      toast.error("Failed to Delete Payment Record");
    }
  };

  const onFMRecordDeleteHandlerByNotification = async (
    record: PaymentRecord,
  ) => {
    const data = {
      requestId: record.IDNumber,
      title: "FM record delete",
      message: branchName,
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

  const resetData = () => {
    setFormstate("create");
    setIsRecordModalOpen(false);
    setOldRecordData(null);
  };

  const getPdfFile = async () => {
    if (!branchDetails) return;
    const pdfFile = await pdf(
      <FMTemplate FmData={selectedFM!} branchDetails={branchDetails} />,
    ).toBlob();
    setAttachment([pdfFile]);
  };

  useEffect(() => {
    const fetchLRData = async () => {
      const attachments: Blob[] = [];
      getPdfFile();
      for (const lrData of selectedFM?.LRDetails || []) {
        setFetchedLrNumber((prev) => [...prev, lrData.lrNumber]);
        const response = await getLRByLrNumberApi(lrData.lrNumber);
        if (response?.status === 200) {
          const pdfFile = await pdf(
            <LRTemplate LRData={response.data.data} />,
          ).toBlob();
          attachments.push(pdfFile);
        }
      }

      setAttachment((prev) => [...prev, ...attachments]);
    };
    if (isOpen) {
      fetchLRData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFM?.date) {
      setMailGreeting(defaultGreeting(selectedFM?.date));
      setEmailIds(selectedFM?.vendorEmail);
    }
  }, [selectedFM]);

  const removeAttachment = (index: number) => {
    setAttachment((prev) => {
      const updatedAttachments = prev.filter((_, i) => i !== index);
      return updatedAttachments;
    });
  };

  const selectFMForPreview = (FmData: FMInputs) => {
    setSelectedFM(FmData);
    setShowPreview(true);
  };

  const downloadPdfFile = async () => {
    const pdfFile = await pdf(
      <FMTemplate
        FmData={selectedFM!}
        branchDetails={branchDetails!}
        companyProfile={companyProfile}
      />,
    ).toBlob();
    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FM-${selectedFM?.fmNumber}-${new Date().toLocaleDateString()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("PDF has been downloaded successfully");
  };

  const onDeleteFMHandler = async (id: string) => {
    const response = await deleteFMApi(id);
    if (response?.status === 200) {
      toast.success("FM is Deleted");
      setShowPreview(false);
      if (isAdmin) {
        fetchFMDataForPage();
      } else if (!isAdmin && branch.branchId) {
        fetchFMDataForPageForBranch();
      }
    } else {
      toast.error("Failed to Delete LR");
    }
  };

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
        if (selectedFM) {
          selectedFM.mailBody = mailGreeting;
          const formData = new FormData();
          attachment.forEach((file, i) => {
            formData.append(
              "file",
              file,
              i === 0 ? "FreightMemo.pdf" : "LorryReceipt.pdf",
            );
          });
          formData.append("FmData", JSON.stringify(selectedFM));

          const response = await sendFMEmailApi(email, formData);
          if (response?.status === 200) {
            toast.success(`FM Email Sent to ${email}`);
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

  const onDeleteFMHandlerOnNotification = async (FMData: FMInputs) => {
    const data = {
      requestId: FMData.fmNumber,
      title: "FM delete",
      message: FMData.branch?.branchName,
      description: FMData.branchId,
      status: "delete",
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const editFMPaymentOnNotification = async () => {
    const data = {
      requestId: oldRecordData?.IDNumber,
      title: "FM record edit",
      message: branchName,
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
        fetchFMDataForPage();
      } else if (!isAdmin && branch.branchId) {
        fetchFMDataForPageForBranch();
      }
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  async function fetchCompanyProfile() {
    const response = await getCompanyProfileApi();
    if (response?.status === 200) {
      setCompanyProfile(response.data.data);
    }
  }

  const getBalancePaidDate = (data: FMInputs) => {
    const paymentRecords = data.PaymentRecords;
    const balance =
      parseFloat(data.hire || "0") +
      parseFloat(data.detentionCharges || "0") +
      parseFloat(data.rtoCharges || "0") +
      parseFloat(data.otherCharges || "0") -
      parseFloat(data.tds || "0");

    let paidAmount = 0;
    if (paymentRecords.length > 0) {
      for (const element of paymentRecords) {
        paidAmount += parseFloat(element.amount);
        if (paidAmount >= balance) {
          return new Date(element.date).toLocaleDateString();
        }
      }
    }
    return "-";
  };

  const getAdvancePaidDate = (data: FMInputs) => {
    const paymentRecords = data.PaymentRecords;
    const advance = parseFloat(data.advance);

    let paidAmount = 0;
    if (paymentRecords.length > 0) {
      for (const element of paymentRecords) {
        paidAmount += parseFloat(element.amount);
        if (paidAmount >= advance) {
          return new Date(element.date).toLocaleDateString();
        }
      }
    }
    return "-";
  };

  useEffect(() => {
    fetchCompanyProfile();
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);
      setBranchName(branchDetails.branchName);
      if (isAdmin === "true") {
        setIsAdmin(true);
        setBranch({
          branchId: "",
          adminId: branchDetails.id,
        });
      } else {
        setIsAdmin(false);
        setBranch({
          branchId: branchDetails.id,
          adminId: "",
        });
      }
    }
  }, []);

  return (
    <>
      <div className="relative">
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
      </div>

      <section className="flex gap-5">
        <motion.div
          animate={{ width: showPreview ? "50%" : "100%" }}
          transition={{ duration: 0.3 }}
          className={`flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-3`}
        >
          <div className={`flex items-center justify-between`}>
            <p className="text-xl font-medium">FMs</p>
            <div className="flex gap-5">
              <Button
                variant={"outline"}
                className="border-primary text-primary rounded-xl p-5"
                onClick={() => setIsBulkModalOpen(true)}
              >
                Bulk Record
              </Button>
              <Button
                className="bg-primary hover:bg-primary cursor-pointer rounded-2xl p-5"
                onClick={() => [
                  sectionChangeHandler("createNew"),
                  setFormStatus("create"),
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
            <table
              className={`w-full border text-sm ${showPreview ? "text-[0.6rem]" : ""}`}
            >
              <thead>
                <tr>
                  <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                    <p>FM#</p>
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    Vendor Name
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    <p>Date</p>
                  </th>
                  <th className="flex items-center gap-2 text-center font-[400] text-[#797979]">
                    Hire Value
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    Advance Paid
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    Advance Paid Date
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    Balance
                  </th>
                  <th className="border text-center font-[400] text-[#797979]">
                    Balance Paid Date
                  </th>
                  {!showPreview && (
                    <th className="border text-center font-[400] text-[#797979]">
                      Pending Advance
                    </th>
                  )}
                  {!showPreview && (
                    <th className="border text-center font-[400] text-[#797979]">
                      Pending Balance
                    </th>
                  )}
                  {!showPreview && (
                    <>
                      <th className="border text-center font-[400] text-[#797979]">
                        TDS
                      </th>
                    </>
                  )}

                  <th className="border text-center font-[400] text-[#797979]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFMs.map((data) => (
                  <tr
                    className={`hover:bg-accent cursor-pointer ${selectedFM?.fmNumber === data.fmNumber ? "bg-accent" : ""}`}
                    onClick={() => selectFMForPreview(data)}
                    key={data.fmNumber}
                  >
                    <td className="border py-2">{data.fmNumber}</td>
                    <td className="border py-2">{data.vendorName}</td>
                    <td className="border py-2">
                      {new Date(data.date).toLocaleDateString()}
                    </td>
                    <td className="border py-2">
                      {formatter.format(parseInt(data.hire || "0"))}
                    </td>
                    <td className="border py-2">
                      {data.advance
                        ? formatter.format(
                          parseFloat(data.advance) - data.outStandingAdvance,
                        )
                        : 0}
                    </td>
                    {!showPreview && (
                      <td className="border py-2 text-center">
                        {getAdvancePaidDate(data)}
                      </td>
                    )}
                    <td className="border py-2">
                      {formatter.format(parseInt(data.netBalance))}
                    </td>
                    <td className="border py-2 text-center">
                      {getBalancePaidDate(data)}
                    </td>
                    <td className="border py-2">
                      {formatter.format(data.outStandingAdvance)}
                    </td>
                    <td className="border py-2">
                      {formatter.format(
                        parseFloat(data.outStandingBalance || "0"),
                      )}
                    </td>
                    {!showPreview && (
                      <>
                        <td className="border py-2 text-center">
                          {formatter.format(parseFloat(data.tds || "0"))}
                        </td>
                      </>
                    )}
                    <td
                      className={`border py-2 text-center font-medium capitalize ${statusColorMap[data.status] || "text-blue-500"}`}
                    >
                      {data.status}
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
            <h3 className="text-2xl font-medium">FM# {selectedFM?.fmNumber}</h3>
            <div className="flex items-center gap-3">
              {!selectedFM?.WriteOff?.id && (
                <Button
                  variant={"outline"}
                  className="border-primary text-primary cursor-pointer rounded-3xl"
                  onClick={() => [
                    setIsWriteOffModalOpen(true),
                    resetWriteOff(),
                  ]}
                >
                  Write off
                </Button>
              )}
              {selectedFM?.WriteOff?.id && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer rounded-xl border border-red-500 p-2 text-sm font-medium text-red-500 hover:bg-slate-100 hover:text-black">
                    Delete Write Off
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
                        onClick={() => onDeleteWriteOff(selectedFM!.fmNumber)}
                      >
                        Proceed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                variant={"outline"}
                className="border-primary text-primary cursor-pointer rounded-3xl"
                onClick={() => [setIsRecordModalOpen(true), reset()]}
              >
                <PiRecord className="size-5" />
                Record Payment
              </Button>
              <button className="bg-primary/50 cursor-pointer rounded-full p-1">
                <RxCross2
                  size={20}
                  color="white"
                  onClick={() => [setShowPreview(false), setSelectedFM(null)]}
                />
              </button>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                className="rounded-2xl"
                onClick={() => [
                  setSelectedFMDataToEdit(selectedFM!),
                  setFormStatus("edit"),
                ]}
              >
                Edit details
              </Button>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger className="border-primary cursor-pointer rounded-2xl border p-1 px-4 font-medium">
                  Send mail
                </DialogTrigger>
                <DialogContent className="h-[80vh] min-w-7xl overflow-y-scroll">
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
                      <p>Freight Memo details for - #{selectedFM?.fmNumber}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p>Hi there,</p>
                      <textarea
                        value={mailGreeting}
                        onChange={(e) => setMailGreeting(e.target.value)}
                      ></textarea>
                      <div>
                        <div className="flex">
                          <label>Freight Details: </label>
                        </div>
                        <div className="flex">
                          <label>FM Number</label>
                          <p>: #{selectedFM?.fmNumber}</p>
                        </div>
                        <div className="flex">
                          <label>Pickup Location</label>
                          <p>: {selectedFM?.from}</p>
                        </div>
                        <div className="flex">
                          <label>Delivery Location</label>
                          <p>: {selectedFM?.to}</p>
                        </div>
                        <div className="flex">
                          <label>Vehicle Number:</label>
                          <p> {selectedFM?.vehicleNo}</p>
                        </div>
                        <div className="flex">
                          <label>Driver Name:</label>
                          <p> {selectedFM?.DriverName}</p>
                        </div>
                        <div className="flex">
                          <label>LR Number (s) :</label>
                          {selectedFM?.LRDetails.map((lrnumers) => (
                            <p key={lrnumers.lrNumber}>{lrnumers.lrNumber}, </p>
                          ))}
                        </div>
                        <div className="flex">
                          <label>Total Freight Amount</label>
                          <p>: {selectedFM?.netBalance}</p>
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
                        <div className="flex w-[30%] flex-col gap-2">
                          {attachment.map((attachment, index) => (
                            <div
                              className="my-1 flex items-center justify-between gap-5 rounded-md bg-[#E9EDF7] px-5 py-1"
                              key={index}
                            >
                              <p>
                                {index === 0 ? "FM" : "LR"} #
                                {index === 0
                                  ? selectedFM?.fmNumber
                                  : fetchedLrNumber[index - 1]}
                                <span className="pl-2 text-sm text-[#A3AED0]">
                                  ({attachment?.size.toString().substring(0, 3)}
                                  kb)
                                </span>
                              </p>
                              <RxCross2
                                size={15}
                                onClick={() => removeAttachment(index)}
                              />
                            </div>
                          ))}
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
                        approval the FM will be deleted
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          onDeleteFMHandlerOnNotification(selectedFM!)
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
                        Are you sure you want to delete this Freight Memo? This
                        action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() => onDeleteFMHandler(selectedFM!.id)}
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
            {branchDetails && (
              <FMTemplate
                FmData={selectedFM!}
                branchDetails={branchDetails}
                companyProfile={companyProfile}
              />
            )}
          </PDFViewer>
        </motion.div>
        <Modal
          open={isBulkModalOpen}
          width={1240}
          centered={true}
          footer={null}
          onCancel={() => [
            setIsBulkModalOpen(false),
            setFMList([]),
            setFMListForBulk([]),
            resetBulk(),
          ]}
          className="max-h-[80vh] overflow-auto"

        >
          <div>
            <p className="mb-5 text-xl font-semibold">FM Bulk Record</p>
          </div>
          <form
            onSubmit={handleBulkSubmit(onBulkSubmit)}
            className="flex flex-wrap justify-between gap-5"
          >
            <div className="flex w-[50%] flex-col gap-2">
              <label>Vendor Name</label>
              <Controller
                name="vendorName"
                control={controlBulk}
                defaultValue={""}
                render={({ field }) => (
                  <AntSelect
                    onChange={(value) => {
                      const selectedVendor = vendors.find(
                        (vendor) => vendor.name === value,
                      );
                      const selectedFM = isAdmin
                        ? selectedVendor?.FM || []
                        : selectedVendor?.FM.filter(
                          (FM) => FM.branchId === branch.branchId,
                        ) || [];
                      setFMList(selectedFM);
                      field.onChange(value);
                    }}
                    value={field.value}
                    options={vendors.map((vendor) => ({
                      value: vendor.name,
                      label: vendor.name,
                    }))}
                    showSearch
                    placeholder="Select vendors"
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
                  <th className="border text-sm font-medium">FM Number</th>
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
                        const fm = FMList.find((FM) => FM.fmNumber === val);
                        if (fm) {
                          setFMListForBulk((prev) => [
                            ...prev,
                            {
                              fmNumber: fm.fmNumber,
                              amount: "0",
                              amountInWords: "0",
                              pendingAmount:
                                parseFloat(fm.outStandingBalance) || 0,
                            },
                          ]);
                        }
                      }}
                      allowClear
                      options={FMList.map((FM) => ({
                        value: FM.fmNumber,
                        label: FM.fmNumber,
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
                {FMListForBulk.map((data, i) => (
                  <tr className="text-sm" key={i}>
                    <td className="border py-2 text-center">{i + 1}</td>
                    <td className="border py-2 text-center">{data.fmNumber}</td>
                    <td className="border py-2">
                      <input
                        value={data.amount}
                        type="number"
                        className="border-primary w-full rounded-md border p-2"
                        onChange={(e) =>
                          setFMListForBulk((prev) => {
                            const updatedData = prev.map((item) => {
                              if (item.fmNumber === data.fmNumber) {
                                const originalFM = FMList.find(
                                  (fm) => fm.fmNumber === data.fmNumber,
                                );
                                const currentAmount =
                                  parseFloat(e.target.value) || 0;
                                return {
                                  ...item,
                                  amount: e.target.value,
                                  amountInWords:
                                    numberToIndianWords(currentAmount) || "0",
                                  pendingAmount:
                                    parseFloat(
                                      originalFM?.outStandingBalance || "0",
                                    ) - currentAmount,
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
                          setFMListForBulk((prev) =>
                            prev.filter(
                              (item) => item.fmNumber !== data.fmNumber,
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
                  setFMList([]),
                  setFMListForBulk([]),
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

        <Dialog
          open={isWriteOffModalOpen}
          onOpenChange={setIsWriteOffModalOpen}
        >
          <DialogTrigger className="hidden"></DialogTrigger>
          <DialogContent className="min-w-7xl">
            <DialogHeader className="flex flex-row items-start justify-between">
              <DialogTitle className="text-2xl">
                Write off FM# {selectedFM?.fmNumber}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <form
              onSubmit={handleWriteOffSubmit(onWriteOff)}
              className="flex flex-wrap justify-between gap-5"
            >
              <div className="w-[50%]">
                <div className="flex flex-col gap-2">
                  <label>FM#</label>
                  <input
                    type="text"
                    className="border-primary cursor-not-allowed rounded-md border p-2"
                    {...registerWriteOff("IDNumber")}
                    value={selectedFM?.fmNumber}
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
                    value={selectedFM?.vendorName}
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
                    value={selectedFM?.outStandingBalance}
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
        <Dialog
          open={isRecordModalOpen}
          onOpenChange={() => [setIsRecordModalOpen, resetData()]}
        >
          <DialogTrigger className="hidden"></DialogTrigger>
          <DialogContent className="min-w-7xl">
            <DialogHeader className="flex flex-row items-start justify-between">
              <DialogTitle className="text-2xl">
                Record Payment FM# {selectedFM?.fmNumber}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-wrap justify-between gap-5"
            >
              <div className="w-[30%]">
                <div className="flex flex-col gap-2">
                  <label>FM#</label>
                  <input
                    type="text"
                    className="border-primary cursor-not-allowed rounded-md border p-2"
                    {...register("IDNumber")}
                    value={selectedFM?.fmNumber}
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
                  <label>Vendor Name</label>
                  <input
                    type="text"
                    className="border-primary rounded-md border p-2"
                    {...register("customerName")}
                    value={selectedFM?.vendorName}
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
                    <p className="text-red-500">
                      Transaction Number is required
                    </p>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              {selectedFM?.PaymentRecords &&
                selectedFM?.PaymentRecords?.length > 0 && (
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
                              {selectedFM?.PaymentRecords?.map(
                                (record, index) => (
                                  <tr
                                    className="hover:bg-accent text-center"
                                    key={record.id}
                                  >
                                    <td className="p-2">{index + 1}</td>
                                    <td>{record.amount}</td>
                                    <td>
                                      {new Date(
                                        record.date,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td>{record.paymentMode}</td>
                                    <td>{record.remarks}</td>
                                    <td>{record.transactionNumber}</td>
                                    <td className="flex justify-center gap-2">
                                      <button
                                        className="cursor-pointer"
                                        type="button"
                                        onClick={() => [
                                          setRecordDataToInputBox(record),
                                          setFormstate("edit"),
                                          setEditingAmount(record.amount),
                                        ]}
                                      >
                                        <RiEditBoxLine size={20} />
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
                                                request. Upon approval the
                                                changes will be updated
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  onFMRecordDeleteHandlerByNotification(
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
                                                is permanent and cannot be
                                                undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                                                onClick={() => [
                                                  deletePaymentRecordFromFM(
                                                    record.id,
                                                  ),
                                                  setShowPreview(false),
                                                ]}
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
                  onClick={() => [setIsRecordModalOpen(false), resetData()]}
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
                    "Update Payment"
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
                onClick={editFMPaymentOnNotification}
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
      </section>
    </>
  );
}
