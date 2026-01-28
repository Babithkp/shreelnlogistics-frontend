import { RiDeleteBin6Line, RiEditBoxLine } from "react-icons/ri";
import { Button } from "../ui/button";
import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
} from "react-icons/md";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Select } from "antd";
import { VscLoading } from "react-icons/vsc";
import { getAllVendorsApi } from "@/api/partner";
import {
  createNotificationApi,
  getAllClientsApi,
  getCreditIdApi,
} from "@/api/admin";
import {
  numberToIndianWords,
  filterOnlyCompletePrimitiveDiffs,
  formatter,
  getUnmatchingFields,
} from "@/lib/utils";
import { getGeneralSettingsApi } from "@/api/settings";
import {
  createCreditApi,
  deleteClientApi,
  filterCreditsApi,
  getCreditByPageApi,
  updateCreditDetailsApi,
} from "@/api/expense";
import { toast } from "react-toastify";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TbCopy } from "react-icons/tb";
import { CreditInputs, generalSettings, VendorInputs } from "@/types";
import { LuSearch } from "react-icons/lu";

export default function Credit({ setSection }: { setSection: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<VendorInputs[]>([]);
  const [linkTo, setLinkTo] = useState<string>("");
  const [generalSettings, setGeneralSettings] = useState<generalSettings>();
  const [credits, setCredits] = useState<CreditInputs[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CreditInputs[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<CreditInputs | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [branch, setBranch] = useState({
    id: "",
    branchName: "",
    isAdmin: false,
  });
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [notificationData, setNotificationData] =
    useState<Record<string, any>>();
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const {
    handleSubmit,
    register,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreditInputs>();

  const amount = watch("amount");

  useEffect(() => {
    if (amount) {
      const amountInWords = numberToIndianWords(Number(amount));
      setValue("amountInWords", amountInWords);
    } else {
      setValue("amountInWords", "");
    }
  }, [amount, setValue]);

  async function filterExpenseByTitle(text: string, branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await filterCreditsApi(text, branchIdToBeUsed);
    if (response?.status === 200) {
      const allExpenses = response.data.data;
      setFilteredCredits(allExpenses);
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredCredits(credits);
        return;
      }

      if (branch.isAdmin) {
        filterExpenseByTitle(text);
      } else {
        filterExpenseByTitle(text, branch.id);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search, credits]);

  const onSubmit = async (data: CreditInputs) => {
    if (branch.isAdmin) {
      data.adminId = branch.id;
    } else {
      data.branchesId = branch.id;
    }
    setIsLoading(true);
    if (formStatus === "New" && !selectedCredit) {
      const response = await createCreditApi(data);
      if (response?.status === 200) {
        toast.success("Credit Created");
        reset();
        setIsOpen(false);

        if (isAdmin) {
          fetchCredit();
        } else if (!isAdmin && branch.id) {
          fetchCredit(branch.id);
        }
      } else if (response?.status === 201) {
        toast.warning("Expense Id already exists, please try another one");
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else if (formStatus === "editing" && selectedCredit) {
      if (!branch.isAdmin) {
        setIsOpen(false);
        setNotificationData(
          filterOnlyCompletePrimitiveDiffs(
            getUnmatchingFields(data, selectedCredit!),
          ),
        );
        setIsLoading(false);
        setNotificationAlertOpen(true);
        return;
      }
      const response = await updateCreditDetailsApi(selectedCredit?.id, data);
      if (response?.status === 200) {
        toast.success("Credit Updated");
        reset();
        setIsOpen(false);
        if (isAdmin) {
          fetchCredit();
        } else if (!isAdmin && branch.id) {
          fetchCredit(branch.id);
        }
      }
    }
    setIsLoading(false);
  };
  const onCreditEditNotificationSubmit = async () => {
    const data = {
      requestId: selectedCredit?.creditId,
      title: "Credit edit",
      message: branch.branchName,
      description: branch.id,
      status: "editable",
      data: JSON.stringify(notificationData),
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
      setNotificationAlertOpen(false);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setNotificationAlertOpen(false);
  };

  const onDeleteCreditHandlerOnNotification = async (credit: CreditInputs) => {
    const data = {
      requestId: credit.creditId,
      title: "Credit delete",
      message: branch?.branchName,
      description: branch.id,
      status: "delete",
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  async function fetchCredit(branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await getCreditByPageApi(
      currentPage,
      itemsPerPage,
      branchIdToBeUsed,
    );
    if (response?.status === 200) {
      const allExpenses = response.data.data;
      setFilteredCredits(allExpenses.creditData);
      setCredits(allExpenses.creditData);
      setTotalItems(allExpenses.creditCount);
    }
  }

  const setCreditDetails = (data: CreditInputs) => {
    setValue("creditId", data.creditId);
    setValue("description", data.description);
    setValue("date", data.date);
    setValue("category", data.category);
    setValue("customerName", data.customerName);
    setValue("linkTo", data.linkTo);
    setValue("billNumber", data.billNumber);
    setValue("fmNumber", data.fmNumber);
    setValue("amount", data.amount);
    setValue("amountInWords", data.amountInWords);
    setValue("paymentType", data.paymentType);
    setValue("transactionNumber", data.transactionNumber);
    setValue("title", data.title);
  };
  async function deleteCredit() {
    if (!selectedCredit) {
      return;
    }
    const response = await deleteClientApi(selectedCredit?.id);
    if (response?.status === 200) {
      toast.success("Expense Deleted");
      setIsDetailsModalOpen(false);
      if (isAdmin) {
        fetchCredit();
      } else if (!isAdmin && branch.id) {
        fetchCredit(branch.id);
      }
    } else {
      toast.error("Failed to Delete Expense");
    }
  }

  async function fetchVendors() {
    const responseVendors = await getAllVendorsApi();
    const responseClients = await getAllClientsApi();
    const responseGeneralSettings = await getGeneralSettingsApi();
    if (
      responseVendors?.status === 200 &&
      responseClients?.status === 200 &&
      responseGeneralSettings?.status === 200
    ) {
      setMembers(responseVendors.data.data.concat(responseClients.data.data));
      setGeneralSettings(responseGeneralSettings.data.data);
    }
  }

  async function getExpenseId() {
    const response = await getCreditIdApi();
    if (response?.status === 200) {
      setValue("creditId", response.data.data.creditId);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchCredit();
    } else if (!isAdmin && branch.id) {
      fetchCredit(branch.id);
    }
  }, [startIndex, endIndex]);

  useEffect(() => {
    if (isAdmin) {
      fetchCredit();
    } else if (!isAdmin && branch.id) {
      fetchCredit(branch.id);
    }
  }, [isAdmin, branch.id]);

  useEffect(() => {
    fetchVendors();
    const isAdmin = localStorage.getItem("isAdmin");

    const branch = localStorage.getItem("branchDetails");
    if (branch) {
      const branchDetails = JSON.parse(branch);
      if (branchDetails) {
        if (isAdmin === "true") {
          setIsAdmin(true);
          setValue("adminId", branchDetails.id);
          setBranch({
            id: branchDetails.id,
            branchName: "",
            isAdmin: true,
          });
        } else {
          setIsAdmin(false);
          setValue("branchesId", branchDetails.id);
          setBranch({
            id: branchDetails.id,
            branchName: branchDetails.branchName,
            isAdmin: false,
          });
        }
      }
    }
  }, []);

  return (
    <>
      <section className="flex h-fit max-h-[73vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
        <div className={`flex items-center justify-between`}>
          <p className="text-xl font-medium">All Credits</p>
          <div className="flex items-center gap-5">
            <div className="bg-secondary flex items-center gap-2 rounded-full p-2 px-5">
              <LuSearch size={18} />
              <input
                placeholder="Search"
                className="outline-none placeholder:font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              className="border-primary cursor-pointer rounded-2xl p-5"
              variant={"outline"}
              onClick={() => [
                setSection({
                  expenses: true,
                  credits: false,
                }),
              ]}
            >
              View Expenses
            </Button>
            <Button
              className="bg-primary hover:bg-primary cursor-pointer rounded-2xl p-5"
              onClick={() => [
                setIsOpen(true),
                reset(),
                setSelectedCredit(null),
                setFormStatus("New"),
                getExpenseId(),
              ]}
            >
              <MdOutlineAdd size={34} />
              Record Credit
            </Button>
            {!search && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <p>
                  {endIndex}-{startIndex}
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
          <table className="w-full">
            <thead>
              <tr>
                <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                  <p>Credit ID</p>
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  <div className="flex items-center gap-2">
                    <p>Title</p>
                  </div>
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  <div className="flex items-center gap-2">
                    <p>Expense Date</p>
                  </div>
                </th>
                <th className="text-start font-[400] text-[#797979]">Category</th>
                <th className="font-[400] text-[#797979]">Branch</th>
                <th className="font-[400] text-[#797979]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits?.map((expense) => (
                <tr
                  key={expense.creditId}
                  className="hover:bg-accent cursor-pointer"
                  onClick={() => [
                    setSelectedCredit(expense),
                    setIsDetailsModalOpen(true),
                  ]}
                >
                  <td className="py-2">{expense.creditId}</td>
                  <td className="py-2">{expense.title}</td>
                  <td className="py-2">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="py-2">{expense.category}</td>
                  {expense.Branches && (
                    <td className="py-2 text-center">
                      {expense.Branches?.branchName}
                    </td>
                  )}
                  {expense.Admin && (
                    <td className="py-2 text-center">
                      {expense.Admin?.branchName}
                    </td>
                  )}
                  <td className="py-2">
                    {formatter.format(parseFloat(expense.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={isOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => setIsOpen(false)}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap justify-between gap-5"
        >
          <p className="w-full text-xl font-medium">
            {formStatus === "New" ? "New Expenses" : "Edit Expenses"}
          </p>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Credit ID</label>
              <input
                type="text"
                className={
                  "border-primary cursor-not-allowed rounded-md border p-2"
                }
                {...register("creditId", { required: true })}
                readOnly
              />
              {errors.creditId && (
                <p className="text-red-500">Credit ID is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Credit Title</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("title", { required: true })}
              />
              {errors.title && (
                <p className="text-red-500">Credit Title is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Date</label>
              <input
                type="date"
                className="border-primary rounded-md border p-2"
                {...register("date", { required: true })}
              />
              {errors.date && <p className="text-red-500">date is required</p>}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Category</label>
              <Controller
                name="category"
                control={control}
                defaultValue={""}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    showSearch
                    options={generalSettings?.expenseTypes.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
              {errors.category && (
                <p className="text-red-500">Category is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Client Name</label>
              <Controller
                name="customerName"
                control={control}
                defaultValue={""}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    showSearch
                    options={members?.map((member) => {
                      return {
                        value: member.name,
                        label: member.name,
                      };
                    })}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Link To</label>

              <Controller
                name="linkTo"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setLinkTo(value);
                    }}
                    options={[
                      { value: "CustomerBill", label: "Customer Bill" },
                      { value: "FM", label: "FM" },
                    ]}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className={`${linkTo !== "CustomerBill" && "text-muted"}`}>
                Bill#
              </label>
              <input
                type="text"
                className={`rounded-md border p-2 ${linkTo !== "CustomerBill" ? "border-muted cursor-not-allowed" : "border-primary"}`}
                {...register("billNumber", {
                  required: linkTo === "CustomerBill",
                })}
                disabled={linkTo !== "CustomerBill"}
              />
              {errors.billNumber && (
                <p className="text-red-500">Bill Number is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label className={`${linkTo !== "FM" && "text-muted"}`}>
                FM#
              </label>
              <input
                className={`rounded-md border p-2 ${linkTo !== "FM"
                  ? "border-muted cursor-not-allowed"
                  : "border-primary"
                  }`}
                {...register("fmNumber", { required: linkTo === "FM" })}
                disabled={linkTo !== "FM"}
              />
              {errors.fmNumber && (
                <p className="text-red-500">FM Number is required</p>
              )}
            </div>
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label>Amount</label>
              <div className="border-primary flex gap-2 rounded-md border p-2">
                <p>INR</p>
                <input
                  className="w-full outline-none"
                  {...register("amount", { required: true })}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500">Amount is required</p>
              )}
            </div>
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label>Amount In words (auto-generated)</label>
              <input
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("amountInWords")}
                disabled
              />
            </div>
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label>Payment Type</label>
              <Controller
                name="paymentType"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    size="large"
                    {...field}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    options={[
                      { value: "Cash", label: "Cash" },
                      { value: "IMPS", label: "IMPS" },
                      { value: "RTGS", label: "RTGS" },
                      { value: "NEFT", label: "NEFT" },
                      { value: "Cheque", label: "Cheque" },
                    ]}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
            </div>
            {errors.paymentType && (
              <p className="text-red-500">Payment Type is required</p>
            )}
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label>Transaction Reference Number</label>
              <input
                className="border-primary rounded-md border p-2"
                {...register("transactionNumber", { required: true })}
              />
            </div>
            {errors.transactionNumber && (
              <p className="text-red-500">
                Transaction Reference Number is required
              </p>
            )}
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label>Description</label>
              <input
                className="border-primary rounded-md border p-2"
                {...register("description", { required: true })}
              />
            </div>
            {errors.description && (
              <p className="text-red-500">
                Transaction Reference Number is required
              </p>
            )}
          </div>

          <div className="flex w-full justify-end gap-5">
            <Button
              type="button"
              variant={"outline"}
              className="border-primary text-primary"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button className="rounded-xl px-7" disabled={isLoading}>
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : formStatus === "New" ? (
                "Record Credit"
              ) : (
                "Update Credit"
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogTrigger className="hidden"></DialogTrigger>
        <DialogContent className="min-w-7xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-2xl">
              Credit ID - {selectedCredit?.creditId}
            </DialogTitle>
            <div className="mr-10 flex gap-3">
              <button
                className="cursor-pointer"
                onClick={() => [
                  setFormStatus("editing"),
                  setIsDetailsModalOpen(false),
                  setIsOpen(true),
                  setCreditDetails(selectedCredit!),
                ]}
              >
                <RiEditBoxLine size={20} />
              </button>
              {!branch.isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer">
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        This will send the admin an delete request. Upon
                        approval the Expense will be deleted
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() =>
                          onDeleteCreditHandlerOnNotification(selectedCredit!)
                        }
                      >
                        Proceed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {branch.isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer">
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        Are you sure you want to remove this expense? This
                        action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={deleteCredit}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <div className="grid grid-cols-3 gap-5">
            <div className="flex items-center gap-5">
              <label className="font-medium">Credit ID</label>
              <p>{selectedCredit?.creditId}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Category</label>
              <p>{selectedCredit?.category}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Recording Branch</label>
              {selectedCredit?.Branches && (
                <p>{selectedCredit?.Branches?.branchName}</p>
              )}
              {selectedCredit?.Admin && (
                <p>{selectedCredit?.Admin.branchName}</p>
              )}
            </div>
            {selectedCredit?.linkTo && (
              <div className="flex items-center gap-5">
                <label className="font-medium">Linked to</label>
                <p>{selectedCredit?.linkTo}</p>
              </div>
            )}
            {selectedCredit?.billNumber && (
              <div className="col-span-2 flex items-center gap-2">
                <label className="font-medium">Bill#</label>
                <p>{selectedCredit?.billNumber}</p>
                <Popover>
                  <PopoverTrigger className="cursor-pointer">
                    <TbCopy
                      size={20}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedCredit!.billNumber.toString(),
                        )
                      }
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-2">Copied!</PopoverContent>
                </Popover>
              </div>
            )}
            {selectedCredit?.fmNumber && (
              <div className="col-span-2 flex items-start gap-2">
                <label className="font-medium">FM#</label>
                <p>{selectedCredit?.fmNumber}</p>
                <Popover>
                  <PopoverTrigger className="cursor-pointer">
                    <TbCopy
                      size={20}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedCredit!.fmNumber.toString(),
                        )
                      }
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-2">Copied!</PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-start gap-5">
              <label className="font-medium">Amount</label>
              <p>INR {selectedCredit?.amount}</p>
            </div>
            <div className="flex items-start gap-5">
              <label className="font-medium">Payment Type</label>
              <p>{selectedCredit?.paymentType}</p>
            </div>
            <div className="flex items-start gap-5">
              <label className="font-medium">Transaction ID</label>
              <p>{selectedCredit?.transactionNumber}</p>
            </div>
            <div className=" flex flex-col items-start gap-2 capitalize">
              <label className="font-medium">Amount in words</label>
              <p>{selectedCredit?.amountInWords}</p>
            </div>
            <div className="flex flex-col items-start gap-5">
              <label className="font-medium">Description</label>
              <p>{selectedCredit?.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            <AlertDialogAction onClick={onCreditEditNotificationSubmit}>
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
