import { Button } from "@/components/ui/button";
import { MdOutlineAdd } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";
import { useEffect, useState } from "react";
import {
  deleteFMApi,
  deleteLRApi,
  getFMApi,
  getLRApi,
  sendLREmailApi,
} from "@/api/shipment";
import { motion } from "motion/react";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
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
import { FMSection } from "./FMPage";
import { FMInputs } from "./FMCreate";
import FMTemplate from "./FMTemplate";

const defaultGreeting =
  "Greetings from Shree LN Logistics, \nPlease find attached the Lorry Receipt (LR) for the following shipment.";

export default function FMList({
  sectionChangeHandler,
  setSelectedFMDataToEdit,
  setFormStatus,
}: {
  sectionChangeHandler: (section: FMSection) => void;
  setSelectedFMDataToEdit: (data: FMInputs) => void;
  setFormStatus: (status: "edit" | "create") => void;
}) {
  interface ExtendedFmInputs extends FMInputs {
    admin?: {
      branchName: string;
      contactNumber: string;
    };
    branch?: {
      branchName: string;
      contactNumber: string;
    };
    mailBody?: string;
  }
  const [FMData, setFMData] = useState<ExtendedFmInputs[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFM, setSelectedFM] = useState<ExtendedFmInputs>();
  const [isOpen, setIsOpen] = useState(false);
  const [mailGreeting, setMailGreeting] = useState(defaultGreeting);
  const [emailIds, setEmailIds] = useState("");
  const [attachment, setAttachment] = useState<Blob>();
  const [isLoading, setIsLoading] = useState(false);

  //   const getPdfFile = async () => {
  //     const pdfFile = await pdf(<LRTemplate LRData={selectedLR} />).toBlob();
  //     setAttachment(pdfFile);
  //   };

  const selectLRForPreview = (LRData: FMInputs) => {
    setSelectedFM(LRData);
    setShowPreview(true);
    // getPdfFile();
  };

  const onDeleteLRHandler = async (id: string) => {
    const response = await deleteFMApi(id);
    if (response?.status === 200) {
      toast.success("FM is Deleted");
      setShowPreview(false);
      fetchFMs();
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
    emailIds.split(",").forEach(async (email: string) => {
      if (
        selectedFM &&
        email !== undefined &&
        email !== null &&
        email.trim() !== ""
      ) {
        selectedFM.mailBody = mailGreeting;
        const formData = new FormData();
        formData.append("file", attachment, "LorryReceipt.pdf");
        formData.append("LrData", JSON.stringify(selectedFM));

        const response = await sendLREmailApi(email, formData);
        if (response?.status === 200) {
          toast.success("LR Email Sent");
        } else {
          toast.error("Something Went Wrong, Check All Fields");
        }
      }
    });
    setIsLoading(false);
  };

  async function fetchFMs() {
    const response = await getFMApi();
    if (response?.status === 200) {
      setFMData(response.data.data);
    }
  }

  useEffect(() => {
    fetchFMs();
  }, []);

  return (
    <section className="flex gap-5">
      <motion.div
        animate={{ width: showPreview ? "50%" : "100%" }}
        transition={{ duration: 0.3 }}
        className={`flex h-fit max-h-[88vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5`}
      >
        <div className={`flex items-center justify-between`}>
          <p className="text-xl font-medium">FMs</p>
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
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>FM#</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Client Name</p>
                  <FaChevronDown size={15} className="cursor-pointer" />
                </div>
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Date</p>
                  <FaChevronDown size={15} className="cursor-pointer" />
                </div>
              </th>
              <th className="flex items-center gap-2  font-[400] text-[#797979] text-center">
               Hire Value
              </th>
              <th className="text-center font-[400] text-[#797979]">Advance</th>
              <th className="text-center font-[400] text-[#797979]">Balance</th>
              <th className="text-center font-[400] text-[#797979]">0-30</th>
              <th className="text-center font-[400] text-[#797979]">30-60</th>
              <th className="text-center font-[400] text-[#797979]">60-90</th>
              <th className="text-center font-[400] text-[#797979]">&gt;90</th>
            </tr>
          </thead>
          <tbody>
            {FMData.map((data) => (
              <tr
                className="hover:bg-accent cursor-pointer"
                onClick={() => selectLRForPreview(data)}
              >
                <td className="py-2">{data.fmNumber}</td>
                <td className="py-2">{data.vendorName}</td>
                <td className="py-2">{data.date}</td>
                <td className="py-2">{data.hire}</td>
                <td className="py-2 text-center">{data.advance}</td>
                <td className="py-2 text-center">{data.balance}</td>
                <td className="py-2 text-center">{data.zeroToThirty}</td>
                <td className="py-2 text-center">{data.thirtyToSixty}</td>
                <td className="py-2 text-center">{data.sixtyToNinety}</td>
                <td className="py-2 text-center">{data.ninetyPlus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      <motion.div
        className="hidden flex-col gap-5 rounded-md bg-white p-5"
        animate={{
          width: showPreview ? "50%" : "0%",
          display: showPreview ? "flex" : "none",
          opacity: showPreview ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium">LR# 12</h3>
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
              <DialogContent className="min-w-7xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Send Mail</DialogTitle>
                </DialogHeader>
                <DialogDescription></DialogDescription>
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between border-b pb-1 text-sm">
                    <p>To</p>
                    <input
                      type="text"
                      className="w-[90%] pl-2"
                      value={emailIds}
                      onChange={(e) => setEmailIds(e.target.value)}
                    />
                    <p>Cc BCC</p>
                  </div>
                  <div className="flex gap-5 border-b pb-1 text-sm">
                    <p>Subject</p>
                    <p>Lorry Receipt for You Shipment - #</p>
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
                        {/* <p>: {selectedLR?.consigneeName}</p> */}
                      </div>
                      <div className="flex">
                        <label>LR Number</label>
                        {/* <p>: #{selectedLR?.lrNumber}</p> */}
                      </div>
                      <div className="flex">
                        <label>Date</label>
                        {/* <p>: {selectedLR?.date}</p> */}
                      </div>
                      <div className="flex">
                        <label>Consignor</label>
                        {/* <p>: {selectedLR?.consignorName}</p> */}
                      </div>
                      <div className="flex">
                        <label>Consignee</label>
                        {/* <p>: {selectedLR?.consigneeName}</p> */}
                      </div>
                      <div className="flex">
                        <label>Origin</label>
                        {/* <p>: {selectedLR?.from}</p> */}
                      </div>
                      <div className="flex">
                        <label>Destination</label>
                        {/* <p>: {selectedLR?.to}</p> */}
                      </div>
                      <div className="flex">
                        <label>Vehicle Number</label>
                        {/* <p>: {selectedLR?.vehicleNo}</p> */}
                      </div>
                      <div className="flex">
                        <label>Driver Contact</label>
                        {/* <p>: {selectedLR?.driverPhone}</p> */}
                      </div>
                      <div className="flex">
                        <label>No. of Packages</label>
                        {/* <p>: {selectedLR?.noOfPackages}</p> */}
                      </div>
                      <div className="flex gap-2">
                        <label>Description</label>
                        {/* <p className="w-150">: {selectedLR?.description}</p> */}
                      </div>
                    </div>
                    <div>
                      <p>Best Regards,</p>
                      <p>Shivam Jha</p>
                      <p>CEO</p>
                      <p>Shree LN Logistics</p>
                      {/* <p>{selectedLR?.admin?.contactNumber}</p> */}
                      {/* <p>{selectedLR?.branch?.contactNumber}</p> */}
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
                          {/* LR #{selectedLR?.lrNumber}{" "} */}
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
          <AlertDialog>
            <AlertDialogTrigger className="cursor-pointer">
              <RiDeleteBin6Line size={20} color="red" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alert!</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-black">
                  Are you sure you want to delete this Freight Memo? This action
                  is permanent and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                  onClick={() => onDeleteLRHandler(selectedFM!.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <PDFViewer className="h-[75vh] w-full">
          <FMTemplate FmData={selectedFM} />
        </PDFViewer>
      </motion.div>
    </section>
  );
}
