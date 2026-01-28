import { Button } from "@/components/ui/button";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdOutlineFileDownload,
} from "react-icons/md";
import { useEffect, useState } from "react";
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
import { LuSearch } from "react-icons/lu";
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
}: {
  data: {
    data: LrInputs[];
    count: number;
  };
  sectionChangeHandler: (section: Sections) => void;
  setSelectedLRDataToEdit: (data: LrInputs) => void;
  setFormStatus: (status: "edit" | "create") => void;
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
  const [search, setSearch] = useState("");
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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      requestId: LRData.lrNumber,
      title: "LR delete",
      message: LRData.branch?.branchName,
      description: LRData.branchId,
      status: "delete",
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
          <p className="text-xl font-medium">LRs</p>
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
        <div className="overflow-y-auto pr-2">

          <table className={`w-full ${showPreview ? "text-xs" : ""} `}>
            <thead>
              <tr>
                <th className="flex items-center gap-2 text-start font-[400] text-[#797979] border">
                  <p>LR#</p>
                </th>
                <th className="text-start font-[400] text-[#797979] border">
                  <div className="flex items-center gap-2">
                    <p>Client Name</p>
                  </div>
                </th>
                <th className="text-start font-[400] text-[#797979] border">
                  <div className="flex items-center gap-2">
                    <p>Date</p>
                  </div>
                </th>
                <th className="flex items-center gap-2 text-start font-[400] text-[#797979] border">
                  <p>From</p>
                </th>
                <th className="text-start font-[400] text-[#797979] border">To</th>
                {!showPreview && <th className="text-start font-[400] text-[#797979] border">Branch</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLRs?.map((data) => (
                <tr
                  className={`hover:bg-accent cursor-pointer ${selectedLR?.lrNumber === data.lrNumber ? "bg-accent" : ""}`}
                  key={data.lrNumber}
                  onClick={() => selectLRForPreview(data)}
                >
                  <td className="py-2 border">{data.lrNumber}</td>
                  <td className="py-2 border">{data.client.name}</td>
                  <td className="py-2 border">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 border">{data.from}</td>
                  <td className="py-2 border">{data.to}</td>
                  {!showPreview && <td className="py-2 border">
                    {data.branch?.branchName || data.admin?.branchName}
                  </td>}
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
          <h3 className="text-2xl font-medium">LR# {selectedLR?.lrNumber}</h3>
          <button className="bg-primary/50 cursor-pointer rounded-full p-1">
            <RxCross2
              size={20}
              color="white"
              onClick={() => setShowPreview(false)}
            />
          </button>
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="rounded-2xl"
              onClick={() => [
                setSelectedLRDataToEdit(selectedLR!),
                setFormStatus("edit"),
              ]}
            >
              Edit details
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger className="border-primary cursor-pointer rounded-2xl border p-1 px-4 font-medium">
                Send mail
              </DialogTrigger>
              <DialogContent className="h-[80vh] min-w-7xl overflow-y-auto">
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
                      Lorry Receipt for You Shipment - #{selectedLR?.lrNumber}
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
                        <label>Shipment</label>
                        <p>: {selectedLR?.consigneeName}</p>
                      </div>
                      <div className="flex">
                        <label>LR Number</label>
                        <p>: #{selectedLR?.lrNumber}</p> ``
                      </div>
                      <div className="flex">
                        <label>Date</label>
                        <p>: {selectedLR?.date}</p>
                      </div>
                      <div className="flex">
                        <label>Consignor</label>
                        <p>: {selectedLR?.consignorName}</p>
                      </div>
                      <div className="flex">
                        <label>Consignee</label>
                        <p>: {selectedLR?.consigneeName}</p>
                      </div>
                      <div className="flex">
                        <label>Origin</label>
                        <p>: {selectedLR?.from}</p>
                      </div>
                      <div className="flex">
                        <label>Destination</label>
                        <p>: {selectedLR?.to}</p>
                      </div>
                      <div className="flex">
                        <label>Vehicle Number</label>
                        <p>: {selectedLR?.Vehicle?.vehicleNumber}</p>
                      </div>
                      <div className="flex">
                        <label>Driver Contact</label>
                        <p>: {selectedLR?.Vehicle?.driverPhone}</p>
                      </div>
                      <div className="flex">
                        <label>No. of Packages</label>
                        <p>: {selectedLR?.noOfPackages}</p>
                      </div>
                      <div className="flex gap-2">
                        <label>Description</label>
                        <p className="w-150">: {selectedLR?.description}</p>
                      </div>
                    </div>
                    <div>
                      <p>Best Regards,</p>
                      <p>Shivam Jha</p>
                      <p>CEO</p>
                      <p>Shree LN Logistics</p>
                      <p>{selectedLR?.admin?.contactNumber}</p>
                      <p>{selectedLR?.branch?.contactNumber}</p>
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
                          LR #{selectedLR?.lrNumber}{" "}
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
                        onClick={() => [getPdfFile(), onSendEmailHandler()]}
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
                <AlertDialogTrigger className="cursor-pointer">
                  <RiDeleteBin6Line size={20} color="red" />
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
        <PDFViewer className="h-full w-full">
          <LRTemplate LRData={selectedLR} companyProfile={companyProfile} />
        </PDFViewer>
      </motion.div>
    </section>
  );
}
