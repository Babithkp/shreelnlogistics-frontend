import logo from "../../assets/logisticsLogo.svg";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import {
  addPaymentRecordToBillApi,
  deleteBillApi,
  deletePaymentRecordFromBillApi,
  getBillDetailsApi,
  sendBillEmailApi,
} from "@/api/billing";
import { pdf, PDFViewer } from "@react-pdf/renderer";

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
import { MdOutlineAdd } from "react-icons/md";
import { getCompanyProfileApi } from "@/api/settings";
import { BankDetailsInputs, ProfileInputs } from "../settings/Settings";
import { Controller, useForm } from "react-hook-form";
import { PiRecord } from "react-icons/pi";
import {
  convertToINRWords,
  filterOnlyCompletePrimitiveDiffs,
  getUnmatchingFields,
} from "@/lib/utils";
import { billInputs, PaymentRecord } from "@/types";
import { createNotificationApi } from "@/api/admin";
import { LuSearch } from "react-icons/lu";

const defaultMailGreeting = `Hope you're doing well.

Please find attached the *invoice* for the recent shipment executed as per the details below`;

export default function ViewBills({
  sectionChangeHandler,
  setSelectedBillToEdit,
  bankDetails,
  data
}: {
  sectionChangeHandler: (section: any) => void;
  setSelectedBillToEdit: (data: billInputs) => void;
  bankDetails?: BankDetailsInputs;
  data?: billInputs[];
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [billData, setBillData] = useState<billInputs[]>(data || []);
  const [filteredBills, setFilteredBills] = useState<billInputs[]>(data || []);
  const [selectedBill, setSelectedBill] = useState<billInputs>();
  const [isOpen, setIsOpen] = useState(false);
  const [mailGreeting, setMailGreeting] = useState(defaultMailGreeting);
  const [emailIds, setEmailIds] = useState("");
  const [attachment, setAttachment] = useState<Blob>();
  const [isLoading, setIsLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<ProfileInputs>();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
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
  const [search, setSearch] = useState("");

  const getPdfFile = async () => {
    const pdfFile = await pdf(
      <BillTemplate billInputs={selectedBill} bankDetails={bankDetails} companyProfile={companyProfile}/>,
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

  const amount = watch("amount");

  useEffect(() => {
    let totalPending;
    if (formstate === "edit") {
      totalPending = selectedBill?.PaymentRecords?.reduce(
        (acc, data) => acc + parseFloat(data.amount),
        0,
      );
    }
    if (amount && selectedBill) {
      const totalAmount = Number(amount);
      const amountInWords = convertToINRWords(totalAmount);
      const pendingAmount = selectedBill?.pendingAmount - totalAmount;
      setValue("amountInWords", amountInWords);
      setValue(
        "pendingAmount",
        (totalPending || 0) + parseFloat(pendingAmount.toFixed(2)),
      );
    } else {
      setValue("amountInWords", convertToINRWords(0));
      setValue("pendingAmount", 0);
    }
  }, [amount, setValue]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredBills(billData);
        return;
      }

      const filtered = billData.filter((bill) => {
        const fieldsToSearch = [
          bill.billNumber,
          bill.Client?.name,
          bill.Client?.GSTIN,
          bill.hsnSacCode,
          bill.placeOfSupply,
          bill.state,
          bill.statecode,
          ...bill.lrData.map((lr) => lr.lrNumber),
          bill.igstRate?.toString(),
          bill.cgstRate?.toString(),
          bill.sgstRate?.toString(),
          bill.subTotal?.toString(),
          bill.total?.toString(),
          bill.totalInWords,
          bill.billedIn,
          bill.zeroToThirty,
          bill.thirtyToSixty,
          bill.sixtyPlus,
          bill.createdAt,
          bill.adminId,
          bill.branchId,
          bill.branchesId,
        ];

        return fieldsToSearch
          .filter((field): field is string => typeof field === "string")
          .some((field) => field.toLowerCase().includes(text));
      });

      setFilteredBills(filtered);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, billData]);

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
        getBillDetails();
      } else {
        setBranch({
          branchId: branchDetails.id,
          adminId: "",
          branchName: branchDetails.branchName,
        });
        getBillDetails(branchDetails.id);
      }
    }
  }, []);

  return (
    <>
      <section className="relative flex gap-5">
        <div className="absolute -top-18 right-[13vw] flex items-center gap-2 rounded-full bg-white p-[15px] px-5">
          <LuSearch size={18} />
          <input
            placeholder="Search"
            className="outline-none placeholder:font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <motion.div
          animate={{ width: showPreview ? "50%" : "100%" }}
          transition={{ duration: 0.3 }}
          className={`flex h-fit w-full max-h-[85vh] flex-col gap-5 overflow-y-auto rounded-md bg-white p-5`}
        >
          <div className={`flex items-center justify-between`}>
            <p className="text-xl font-medium">Bills</p>
            <Button
              className="bg-primary hover:bg-primary cursor-pointer rounded-2xl p-5"
              onClick={() => [sectionChangeHandler({
                billList: false,
                createNew: true,
              })]}
            >
              <MdOutlineAdd size={34} />
              Create new
            </Button>
          </div>
          <table className={`w-full ${showPreview ? "text-xs" : ""}`}>
            <thead>
              <tr>
                <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                  <p>Bill No</p>
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  <div className="flex items-center gap-2">
                    <p>Client</p>
                  </div>
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  <div className="flex items-center gap-2">
                    <p>Date</p>
                  </div>
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  Bill Amount
                </th>
                <th className="font-[400] text-[#797979]">Pending Amt</th>
                {!showPreview && (
                  <>
                    <th className="font-[400] text-[#797979]">Tax</th>
                    <th className="font-[400] text-[#797979]">0-30</th>
                    <th className="font-[400] text-[#797979]">30-60</th>
                    <th className="font-[400] text-[#797979]">&gt;60</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((data) => (
                <tr
                  className="hover:bg-accent cursor-pointer"
                  key={data.id}
                  onClick={() => [
                    selectBillForPreview(data),
                    setEmailIds(data.Client.email),
                  ]}
                >
                  <td className="py-2">{data.billNumber}</td>
                  <td className="py-2">{data.Client?.name}</td>
                  <td className="py-2">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2">{data.subTotal.toFixed(2)}</td>
                  <td className="py-2 text-center">
                    {data.pendingAmount.toFixed(2)}
                  </td>
                  {!showPreview && (
                    <>
                      <td className="py-2 text-center">
                        {(
                          data.igstRate +
                          data.cgstRate +
                          data.sgstRate
                        ).toFixed(2)}
                      </td>
                      <td className="py-2 text-center">{data.zeroToThirty}</td>
                      <td className="py-2 text-center">{data.thirtyToSixty}</td>
                      <td className="py-2 text-center">{data.sixtyPlus}</td>
                    </>
                  )}
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
            <h3 className="text-2xl font-medium">
              Bill# {selectedBill?.billNumber}
            </h3>
            <div className="flex items-center gap-2">
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
                              .map((lr) => lr.lrNumber)
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
                              .map((lr) => lr.from)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <label>Delivery Location(s) :</label>
                          <p className="w-[70%]">
                            {selectedBill?.lrData.map((lr) => lr.to).join(", ")}
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
                      the FM will be deleted
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
          <PDFViewer className="h-[70vh] w-full">
            <BillTemplate
              billInputs={selectedBill}
              companyProfile={companyProfile}
              bankDetails={bankDetails}
            />
          </PDFViewer>
        </motion.div>
      </section>
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
              {formstate === "edit" && (
                <Button
                  type="button"
                  variant={"outline"}
                  className="border-primary text-primary"
                  onClick={resetData}
                  disabled={isLoading}
                >
                  Reset All
                </Button>
              )}
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
