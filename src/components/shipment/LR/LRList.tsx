import { Button } from "@/components/ui/button";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdOutlineFileDownload,
} from "react-icons/md";
import { useEffect, useState, type MutableRefObject } from "react";
import {
  deleteLRApi,
  filterLRDetailsApi,
  filterLRDetailsForBranchApi,
  getLRByPageApi,
  getLRByPageForBranchApi,
  sendLREmailApi,
} from "@/api/shipment";
import { motion } from "motion/react";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Pencil, Mail, Paperclip } from "lucide-react";
import LRTemplate from "./LRTemplate";
import { PDFViewer } from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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

import { pdf } from "@react-pdf/renderer";
import logo from "../../../assets/logisticsLogo.svg";
import { toast } from "react-toastify";
import FormData from "form-data";
import { VscLoading } from "react-icons/vsc";
import { ProfileInputs } from "@/components/settings/Settings";
import { getCompanyProfileApi } from "@/api/settings";
import { LrInputs } from "@/types";
import { createNotificationApi } from "@/api/admin";
type Sections = "LRList" | "createNew";
const defaultGreeting =
  "Greetings from Shree LN Logistics, \nPlease find attached the Lorry Receipt (LR) for the following shipment.";

interface ExtendedLRInputs extends LrInputs {
  admin?: {
    branchName: string;
    contactNumber: string;
  };
  mailBody?: string;
}

export default function LRList({
  data,
  sectionChangeHandler,
  setSelectedLRDataToEdit,
  setFormStatus,
  searchValue,
  searchSubmitRef,
}: {
  data: {
    data: LrInputs[];
    count: number;
  };
  sectionChangeHandler: (section: Sections) => void;
  setSelectedLRDataToEdit: (data: LrInputs) => void;
  setFormStatus: (status: "edit" | "create") => void;
  searchValue: string;
  searchSubmitRef: MutableRefObject<() => void>;
}) {
  const [LRData, setLRData] = useState<ExtendedLRInputs[]>(data.data);
  const [filteredLRs, setFilteredLRs] = useState<ExtendedLRInputs[]>(data.data);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLR, setSelectedLR] = useState<ExtendedLRInputs>();
  const [isOpen, setIsOpen] = useState(false);
  const [mailGreeting, setMailGreeting] = useState(defaultGreeting);
  const [emailIds, setEmailIds] = useState("");
  const [attachment, setAttachment] = useState<Blob>();
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<ProfileInputs>();
  const [branchId, setBranchId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const search = searchValue;
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

  async function fetchLRDataForPage() {
    const response = await getLRByPageApi(currentPage, itemsPerPage);
    if (response?.status === 200) {
      const allLRs = response.data.data;
      setLRData(allLRs.LRData);
      setFilteredLRs(allLRs.LRData);
      setTotalItems(allLRs.LRCount);
    }
  }

  async function fetchLRDataForPageForBranch() {
    const response = await getLRByPageForBranchApi(
      currentPage,
      itemsPerPage,
      branchId,
    );
    if (response?.status === 200) {
      const allLRs = response.data.data;
      setLRData(allLRs.LRData);
      setFilteredLRs(allLRs.LRData);
      setTotalItems(allLRs.LRCount);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchLRDataForPage();
    } else if (!isAdmin && branchId) {
      fetchLRDataForPageForBranch();
    }
  }, [isAdmin, branchId, currentPage]);

  useEffect(() => {
    if (selectedLR) {
      setEmailIds(selectedLR.emails.join(", "));
    }
  }, [selectedLR]);

  async function filterLRDetails(text: string) {
    const response = await filterLRDetailsApi(text);
    if (response?.status === 200) {
      const filteredLR = response.data.data;
      setFilteredLRs(filteredLR);
    }
  }

  async function filterLRDetailsForBranch(branchId: string, text: string) {
    const response = await filterLRDetailsForBranchApi(branchId, text);
    if (response?.status === 200) {
      const filteredLR = response.data.data;
      setFilteredLRs(filteredLR);
    }
  }

  const handleSearch = () => {
    if (search.trim().length === 0) {
      setFilteredLRs(LRData);
      return;
    }
    if (isAdmin) {
      filterLRDetails(search);
    } else {
      filterLRDetailsForBranch(branchId, search);
    }
  };

  useEffect(() => {
    searchSubmitRef.current = handleSearch;
  });

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredLRs(LRData);
      return;
    }
  }, [search]);

  const getPdfFile = async () => {
    const pdfFile = await pdf(
      <LRTemplate LRData={selectedLR} companyProfile={companyProfile} />,
    ).toBlob();
    setAttachment(pdfFile);
  };

  const downloadPdfFile = async () => {
    const pdfFile = await pdf(
      <LRTemplate LRData={selectedLR} companyProfile={companyProfile} />,
    ).toBlob();
    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LR-${selectedLR?.lrNumber}-${new Date().toLocaleDateString()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("PDF has been downloaded successfully");
  };

  const selectLRForPreview = (LRData: LrInputs) => {
    setSelectedLR(LRData);
    setShowPreview(true);
    getPdfFile();
  };

  const onDeleteLRHandler = async (id: string) => {
    const response = await deleteLRApi(id);
    if (response?.status === 200) {
      toast.success("LR Deleted");
      setShowPreview(false);
      if (isAdmin) {
        fetchLRDataForPage();
      } else if (!isAdmin && branchId) {
        fetchLRDataForPageForBranch();
      }
    } else {
      toast.error("Failed to Delete LR");
    }
  };

  const onDeleteLRHandlerOnNotification = async (LRData: LrInputs) => {
    const data = {
      entityType: "LR",
      actionType: "delete",
      requestId: LRData.lrNumber,
      status: "pending",
      createdByRole: LRData.branch?.branchName,
      createdById: LRData.branchId,
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const onSendEmailHandler = async () => {
    if (!emailIds) {
      toast.error("Please provide at least one email address");
      return;
    }

    const emails = emailIds
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email !== "");

    if (emails.length === 0) {
      toast.error("Please provide valid email addresses");
      return;
    }

    if (!selectedLR) {
      toast.error("No LR data selected");
      return;
    }

    setIsLoading(true);

    const baseLRData = { ...selectedLR, mailBody: mailGreeting };

    try {
      const emailPromises = emails.map(async (email) => {
        const formData = new FormData();
        formData.append("file", attachment, "LorryReceipt.pdf");
        formData.append("LrData", JSON.stringify(baseLRData));

        const response = await sendLREmailApi(email, formData);

        if (response?.status === 200) {
          toast.success(`LR Email sent to ${email}`);
        } else {
          toast.error(`Failed to send email to ${email}`);
        }
      });

      await Promise.all(emailPromises);
    } catch (err) {
      toast.error("An unexpected error occurred while sending emails");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  async function fetchCompanyProfile() {
    const response = await getCompanyProfileApi();
    if (response?.status === 200) {
      setCompanyProfile(response.data.data);
    }
  }

  useEffect(() => {
    const branchDetailsRaw = localStorage.getItem("branchDetails");
    const isAdmin = localStorage.getItem("isAdmin");
    if (!branchDetailsRaw) return;
    const branchDetails = JSON.parse(branchDetailsRaw);
    if (isAdmin === "true") {
      setIsAdmin(true);
      setBranchId(branchDetails.id);
    } else {
      setIsAdmin(false);
      setBranchId(branchDetails.id);
    }
    fetchCompanyProfile();
  }, []);

  return (
    <section className="relative flex gap-5">
      <motion.div
        animate={{ width: showPreview ? "50%" : "100%" }}
        transition={{ duration: 0.3 }}
        className={`flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm`}
      >
        <div className={`flex items-center justify-between`}>
          <p className="text-xl font-semibold text-slate-900">LRs</p>
          <div className="flex items-center gap-5">
            <Button
              className="gap-2 rounded-xl bg-primary px-5 text-white hover:bg-primary/90"
              onClick={() => [
                sectionChangeHandler("createNew"),
                setFormStatus("create"),
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
                  LR#
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                  Client Name
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                  Date
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                  From
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                  To
                </th>
                {!showPreview && (
                  <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                    Branch
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredLRs?.map((data) => (
                <tr
                  className={`cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 ${
                    selectedLR?.lrNumber === data.lrNumber
                      ? "bg-primary/5"
                      : ""
                  }`}
                  key={data.lrNumber}
                  onClick={() => selectLRForPreview(data)}
                >
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    {data.lrNumber}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {data.client.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{data.from}</td>
                  <td className="px-3 py-2.5 text-slate-700">{data.to}</td>
                  {!showPreview && (
                    <td className="px-3 py-2.5 text-slate-700">
                      {data.branch?.branchName || data.admin?.branchName}
                    </td>
                  )}
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
          <div className="flex items-center gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                LR #{selectedLR?.lrNumber}
              </p>
              <p className="text-xs text-slate-500">
                {selectedLR?.client?.name}
              </p>
            </div>
          </div>
          <button
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setShowPreview(false)}
          >
            <RxCross2 size={18} />
          </button>
        </div>
        <div className="flex w-full items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Button
              className="gap-2 rounded-lg bg-primary px-4 text-white hover:bg-primary/90"
              onClick={() => [
                setSelectedLRDataToEdit(selectedLR!),
                setFormStatus("edit"),
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
                        Email the Lorry Receipt PDF to one or more recipients
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
                          Lorry Receipt for You Shipment - #
                          {selectedLR?.lrNumber}
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

                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Shipment
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.consigneeName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          LR Number
                        </p>
                        <p className="text-slate-900">
                          #{selectedLR?.lrNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Date
                        </p>
                        <p className="text-slate-900">{selectedLR?.date}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Consignor
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.consignorName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Consignee
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.consigneeName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Origin
                        </p>
                        <p className="text-slate-900">{selectedLR?.from}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Destination
                        </p>
                        <p className="text-slate-900">{selectedLR?.to}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Vehicle Number
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.Vehicle?.vehicleNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Driver Contact
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.Vehicle?.driverPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          No. of Packages
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.noOfPackages}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-xs font-medium text-slate-500">
                          Description
                        </p>
                        <p className="text-slate-900">
                          {selectedLR?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-4 text-sm text-slate-700">
                    <p>Best Regards,</p>
                    <p className="font-medium text-slate-900">Shivam Jha</p>
                    <p>CEO</p>
                    <p>Shree LN Logistics</p>
                    <p>{selectedLR?.admin?.contactNumber}</p>
                    <p>{selectedLR?.branch?.contactNumber}</p>
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
                        LR #{selectedLR?.lrNumber}
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
                      onClick={() => [getPdfFile(), onSendEmailHandler()]}
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
          <div className="flex items-center gap-1">
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
                      This will send the admin an delete request. Upon approval
                      the LR will be deleted
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        onDeleteLRHandlerOnNotification(selectedLR!)
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
                      Are you sure you want to delete this Lorry Receipt? This
                      action is permanent and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                      onClick={() => onDeleteLRHandler(selectedLR!.id)}
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
            <LRTemplate LRData={selectedLR} companyProfile={companyProfile} />
          </PDFViewer>
        </div>
      </motion.div>
    </section>
  );
}
