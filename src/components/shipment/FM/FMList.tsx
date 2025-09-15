import { Button } from "@/components/ui/button";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
} from "react-icons/md";
import { useEffect, useState } from "react";
import {
  addPaymentRecordToFMApi,
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
import { Select as AntSelect } from "antd";
import { FMInputs, LrInputs, PaymentRecord, VendorInputs } from "@/types";
import { createNotificationApi } from "@/api/admin";
import {
  filterFMLRByVendorApi,
  filterFMLRByVendorForBranchApi,
  getAllVendorsApi,
} from "@/api/partner";
import { LuSearch } from "react-icons/lu";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

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

export default function FMList({
  data,
  sectionChangeHandler,
  setSelectedFMDataToEdit,
  setFormStatus,
  branchDetails,
}: {
  data: {
    data: FMInputs[];
    count: number;
  };
  sectionChangeHandler: (section: FMSection) => void;
  setSelectedFMDataToEdit: (data: FMInputs) => void;
  setFormStatus: (status: "edit" | "create") => void;
  branchDetails?: BranchDetails;
}) {
  const [FMData, setFMData] = useState<FMInputs[]>(data.data);
  const [filteredFMs, setFilteredFMs] = useState<FMInputs[]>(data.data);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFM, setSelectedFM] = useState<ExtendedFmInputs | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
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
  const [search, setSearch] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterInputs, setFilterInputs] = useState<{
    name: string;
    from: string;
    to: string;
  }>({
    name: "",
    from: "",
    to: "",
  });
  const [section, setSection] = useState({
    FMList: true,
    vendorStatement: false,
  });
  const [FMStatement, setFMStatement] = useState<FMInputs[]>([]);
  const [pendingLRs, setPendingLRs] = useState<LrInputs[]>([]);
  const [FilteredFMStatement, setFilteredFMStatement] = useState<FMInputs[]>(
    [],
  );
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
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

  const onFilterHandler = async () => {
    if (!filterInputs.name) {
      toast.error("Please enter a name");
      return;
    }
    setPendingLRs([]);
    setFilterLoading(true);
    if (isAdmin) {
      const response = await filterFMLRByVendorApi(filterInputs);
      if (response?.status === 200) {
        const AllFM = response.data.data;
        console.log(AllFM);

        setFMStatement(AllFM.FMs);
        setFilteredFMStatement(AllFM.FMs);
        setPendingLRs(AllFM.LRs);

        setSection({
          FMList: false,
          vendorStatement: true,
        });
      }
    } else if (branch.branchId) {
      const response = await filterFMLRByVendorForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        const AllFM = response.data.data;
        setFMStatement(AllFM.FMs);
        setFilteredFMStatement(AllFM.FMs);
        setPendingLRs(AllFM.LRs);

        setSection({
          FMList: false,
          vendorStatement: true,
        });
      }
    }
    setFilterLoading(false);
  };

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
    totalHire: number,
    totalAdvance: number,
    totalAdvancePending: number,
    pendingAmount: number,
    lrData: any[],
    lrTotal: number,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image to workbook
    const imageBuffer = await fetch(
      "https://shreeln-bucket.s3.ap-south-1.amazonaws.com/logo.png",
    ).then((res) => res.arrayBuffer());

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png", // or "jpeg"
    });

    // Position image at top (cell A1)
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 300, height: 80 },
    });

    // Add some text below the image
    worksheet.getCell("A6").value = clientName;
    worksheet.getCell("A8").value = `Total Hire - INR ${totalHire}`;
    worksheet.getCell("A10").value = `Total Advance - INR ${totalAdvance}`;
    worksheet.getCell("D8").value =
      `Total Advance Pending - INR ${totalAdvancePending}`;
    worksheet.getCell("D10").value = `Total Outstanding - INR ${pendingAmount}`;
    worksheet.getCell("K3").value = "Vendor summary";
    worksheet.getCell("O9").value = "LR waiting for POD Generation";
    worksheet.getCell("O11").value = `Total freight amount - INR ${lrTotal}`;
    worksheet.getCell("O6").value = `${branchName}`;
    // Add headers

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      headers.forEach((key, idx) => {
        worksheet.getCell(12, idx + 1).value = key;
      });
    }

    // Add rows for Main Data
    data.forEach((item, i) => {
      Object.values(item).forEach((val, j) => {
        worksheet.getCell(13 + i, j + 1).value = val as ExcelJS.CellValue;
      });
    });

    if (lrData.length > 0) {
      // Add headers for LR Data at same row 13 but starting from column H (col 8)
      const lrHeaders = Object.keys(lrData[0]);
      lrHeaders.forEach((key, idx) => {
        worksheet.getCell(13, idx + 15).value = key; // starting at H13
      });
    }

    // Add rows for LR Data
    lrData.forEach((item, i) => {
      Object.values(item).forEach((val, j) => {
        worksheet.getCell(14 + i, j + 15).value = val as ExcelJS.CellValue; // rows start from 14, cols from H
      });
    });

    // Generate and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
  };

  const formatFMData = (data: FMInputs[]) => {
    return data.map((FM) => ({
      "FM#": FM.fmNumber,
      Date: new Date(FM.date).toLocaleDateString(),
      "Hire Value": FM.hire,
      Advance: FM.advance ?? "0",
      "Advance Pending": FM.outStandingAdvance,
      Outstanding: FM.outStandingBalance,
      "0-30": FM.zeroToThirty,
      "30-60": FM.thirtyToSixty,
      "60-90": FM.sixtyToNinety,
      ">90": FM.ninetyPlus,
      TDS: FM.tds,
    }));
  };

  const formatLRData = (data: LrInputs[]) => {
    return data.map((lr) => ({
      "LR No.": lr.lrNumber,
      Date: lr.date,
      Origin: lr.from,
      Destination: lr.to,
      "Vehicle Number": lr.Vehicle.vehicleNumber,
      "Freight Amount": lr.totalAmt,
    }));
  };

  const exportFMExcelHandler = () => {
    if (FilteredFMStatement.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatFMData(FilteredFMStatement),
      "Vendor Statement",
      FilteredFMStatement[0].vendorName,
      FilteredFMStatement.reduce((acc, FM) => acc + parseFloat(FM.hire), 0),
      FilteredFMStatement.reduce((acc, FM) => acc + parseFloat(FM.advance), 0),
      FilteredFMStatement.reduce((acc, FM) => acc + FM.outStandingAdvance, 0),
      FilteredFMStatement.reduce(
        (acc, FM) => acc + parseFloat(FM.outStandingBalance),
        0,
      ),
      formatLRData(pendingLRs),
      pendingLRs.reduce((acc, lr) => acc + lr.totalAmt, 0),
    );
    toast.success("File Downloaded");
  };

  const onCategoryFilterHandler = (value: string) => {
    if (value === "All") {
      setFilteredFMStatement(FMStatement);
    } else if (value === "Adance Paid") {
      setFilteredFMStatement(
        FMStatement.filter((FM) => FM.outStandingAdvance === 0),
      );
    } else if (value === "Advance Pending") {
      setFilteredFMStatement(
        FMStatement.filter(
          (FM) =>
            parseFloat(FM.advance) > FM.outStandingAdvance &&
            FM.outStandingAdvance !== 0,
        ),
      );
    } else if (value === "Cleared") {
      setFilteredFMStatement(
        FMStatement.filter((FM) => FM.outStandingBalance === "0"),
      );
    }
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

      return;
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
  async function fetchVendors() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setVendors(response.data.data);
    }
  }

  useEffect(() => {
    fetchCompanyProfile();
    fetchVendors();
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
      <div className="relative mb-5 flex flex-wrap justify-between gap-5 rounded-lg bg-white p-2">
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
        <AntSelect
          showSearch
          options={vendors.map((vendor) => ({
            value: vendor.name,
            label: vendor.name,
          }))}
          onChange={(value) => {
            setFilterInputs({
              ...filterInputs,
              name: value,
            });
          }}
          value={filterInputs.name}
          size="large"
          placeholder="Select a vendor"
          className="w-[48%] bg-transparent"
        />
        <AntSelect
          showSearch
          options={[
            { label: "All", value: "All" },
            { label: "Adance Paid", value: "Adance Paid" },
            { label: "Advance Pending", value: "Advance Pending" },
            { label: "Cleared", value: "Cleared" },
          ]}
          onChange={(value) => {
            onCategoryFilterHandler(value);
          }}
          size="large"
          placeholder="Select a category"
          className="w-[49%] bg-transparent"
        />
        <div className="flex w-[20%] items-center gap-2">
          <p>From:</p>
          <div className="rounded-md bg-blue-50 p-1 pr-3">
            <input
              type="date"
              className="ml-2 w-full bg-transparent outline-none"
              onChange={(e) => {
                setFilterInputs({
                  ...filterInputs,
                  from: e.target.value,
                });
              }}
              value={filterInputs.from}
            />
          </div>
        </div>
        <div className="flex w-[20%] items-center gap-2">
          <p>To:</p>
          <div className="rounded-md bg-blue-50 p-1 pr-3">
            <input
              type="date"
              className="ml-2 w-full bg-transparent outline-none"
              onChange={(e) => {
                setFilterInputs({
                  ...filterInputs,
                  to: e.target.value,
                });
              }}
              value={filterInputs.to}
            />
          </div>
        </div>
        <Button className="rounded-md px-10" onClick={onFilterHandler}>
          {filterLoading ? "Loading..." : "Filter"}
        </Button>
        <Button
          variant={"outline"}
          className="rounded-md bg-[#B0BEC5] px-10 text-white"
          onClick={() =>
            setSection({
              FMList: true,
              vendorStatement: false,
            })
          }
          disabled={filterLoading}
        >
          Reset
        </Button>
        <Button className="rounded-md px-10" onClick={exportFMExcelHandler}>
          Export
        </Button>
      </div>
      {section.FMList && (
        <section className="flex gap-5">
          <motion.div
            animate={{ width: showPreview ? "50%" : "100%" }}
            transition={{ duration: 0.3 }}
            className={`flex h-fit max-h-[73vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-3`}
          >
            <div className={`flex items-center justify-between`}>
              <p className="text-xl font-medium">FMs</p>
              <div className="flex gap-5">
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
                    Advance
                  </th>
                  {!showPreview && (
                    <th className="border text-center font-[400] text-[#797979]">
                      Advance outstanding
                    </th>
                  )}
                  <th className="border text-center font-[400] text-[#797979]">
                    Balance
                  </th>
                  {!showPreview && (
                    <>
                      <th className="border text-center font-[400] text-[#797979]">
                        TDS
                      </th>
                      <th className="border text-center font-[400] text-[#797979]">
                        0-30
                      </th>
                      <th className="border text-center font-[400] text-[#797979]">
                        30-60
                      </th>
                      <th className="border text-center font-[400] text-[#797979]">
                        60-90
                      </th>
                      <th className="border text-center font-[400] text-[#797979]">
                        &gt;90
                      </th>
                    </>
                  )}
                  <th className="border text-center font-[400] text-[#797979]">
                    Pending Amount
                  </th>
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
                      {formatter.format(parseInt(data.hire))}
                    </td>
                    <td className="border py-2">
                      {data.advance
                        ? formatter.format(parseInt(data.advance))
                        : 0}
                    </td>
                    {!showPreview && (
                      <td className="border py-2">
                        {formatter.format(data.outStandingAdvance)}
                      </td>
                    )}
                    <td className="border py-2">
                      {formatter.format(parseInt(data.netBalance))}
                    </td>
                    {!showPreview && (
                      <>
                        <td className="border py-2">
                          {data.TDS === "Declared"
                            ? "0"
                            : formatter.format(
                                parseFloat(data.netBalance) * 0.01,
                              )}
                        </td>
                        <td className="border py-2">
                          {formatter.format(parseInt(data.zeroToThirty))}
                        </td>
                        <td className="border py-2">
                          {formatter.format(parseInt(data.thirtyToSixty))}
                        </td>
                        <td className="border py-2">
                          {formatter.format(parseInt(data.sixtyToNinety))}
                        </td>
                        <td className="border py-2">
                          {formatter.format(parseInt(data.ninetyPlus))}
                        </td>
                      </>
                    )}
                    <td className="border py-2">
                      {formatter.format(parseFloat(data.outStandingBalance))}
                    </td>
                    <td
                      className={`border py-2 text-center font-medium capitalize ${statusColorMap[data.status] || "text-blue-500"}`}
                    >
                      {data.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <motion.div
            className="hidden h-[73vh] flex-col gap-5 rounded-md bg-white p-5"
            animate={{
              width: showPreview ? "50%" : "0%",
              display: showPreview ? "flex" : "none",
              opacity: showPreview ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-medium">
                FM# {selectedFM?.fmNumber}
              </h3>
              <div className="flex items-center gap-5">
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
                        <p>
                          Freight Memo details for - #{selectedFM?.fmNumber}
                        </p>
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
                              <p key={lrnumers.lrNumber}>
                                {lrnumers.lrNumber},{" "}
                              </p>
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
                                    (
                                    {attachment?.size
                                      .toString()
                                      .substring(0, 3)}
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
                                  <th className="font-medium">
                                    Amount Received
                                  </th>
                                  <th className="font-medium">Date</th>
                                  <th className="font-medium">Payment mode</th>
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
                                                  This will send the admin an
                                                  edit request. Upon approval
                                                  the changes will be updated
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
                                                  Are you sure you want to
                                                  delete this Payment Record?
                                                  This action is permanent and
                                                  cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                                                  onClick={() =>
                                                    deletePaymentRecordFromFM(
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
      )}
      {section.vendorStatement && (
        <section className="flex h-fit max-h-[88vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5 text-xs">
          {pendingLRs.length > 0 && (
            <p className="font-medium">{pendingLRs.length} Pending LRs to FM</p>
          )}
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">FM#</th>
                <th className="font-[500] text-slate-500">Vendor Name</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Hire Value</th>
                <th className="font-[500] text-slate-500">Advance</th>
                <th className="font-[500] text-slate-500">Advance Pending</th>
                <th className="font-[500] text-slate-500">Outstanding</th>
                <th className="font-[500] text-slate-500">0-30</th>
                <th className="font-[500] text-slate-500">30-60</th>
                <th className="font-[500] text-slate-500">60-90</th>
                <th className="text-end font-[500] text-slate-500">&gt;90</th>
                <th className="text-end font-[500] text-slate-500">TDS</th>
              </tr>
            </thead>
            <tbody>
              {FilteredFMStatement.map((data) => (
                <tr key={data.fmNumber}>
                  <td className="py-2">{data.fmNumber}</td>
                  <td className="py-2 text-center">{data.vendorName}</td>
                  <td className="py-2 text-center">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-center">INR {data.hire}</td>
                  <td className="py-2 text-center">
                    INR {data.advance ? data.advance : 0}
                  </td>
                  <td className="py-2 text-center">
                    INR {data.outStandingAdvance}
                  </td>
                  <td className="py-2 text-center">
                    INR {data.outStandingBalance}
                  </td>
                  <td className="py-2 text-center">INR {data.zeroToThirty}</td>
                  <td className="py-2 text-center">INR {data.thirtyToSixty}</td>
                  <td className="py-2 text-center">INR {data.sixtyToNinety}</td>
                  <td className="py-2 text-end">INR {data.ninetyPlus}</td>
                  <td className="py-2 text-end">INR {data.tds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
