import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { PiBuildingOfficeLight } from "react-icons/pi";
import { Button } from "../ui/button";
import { IoMdAdd } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

import { useForm, SubmitHandler } from "react-hook-form";
import { changeBranchPasswordApi, createBranchApi } from "@/api/admin";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import {
  deleteBranchApi,
  getAllBranchDetailsApi,
  updateBranchDetailsApi,
} from "@/api/branch";
import { RiEditBoxLine } from "react-icons/ri";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbCopy } from "react-icons/tb";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { BranchInputs, ExpensesInputs } from "@/types";
import { LuSearch } from "react-icons/lu";
import { getAllExpensesApi } from "@/api/expense";
import { formatter } from "@/lib/utils";
import { Skeleton } from "antd";

export type EditBranchPassword = {
  adminPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};


export default function Branch() {
  const [filteredBranches, setFilteredBranches] = useState<BranchInputs[]>([]);
  const [branches, setBranches] = useState<BranchInputs[]>([]);
  const [expenses, setExpenses] = useState<ExpensesInputs[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditPasswordModalOpen, setIsEditPasswordModalOpen] = useState(false);
  const [isloading, setIsloading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isBranchDetailsModalOpen, setIsBranchDetailsModalOpen] =
    useState(false);
  const [branchDetails, setBranchDetails] = useState<BranchInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [isBranchNameAvailable, setIsBranchNameAvailable] = useState(true);
  const [search, setSearch] = useState("");

  const deleteBranchHandler = async () => {
    const id = selectedBranch;
    if (!id) {
      return;
    }
    const response = await deleteBranchApi(id);
    if (response?.status === 200) {
      toast.success("Branch Deleted");
      getBranchDetails();
    } else {
      toast.error("Failed to Delete Branch");
    }
  };

  async function getBranchDetails() {
    const time1 = new Date().getTime();
    const response = await getAllBranchDetailsApi();
    if (response?.status === 200) {
      setFilteredBranches(response.data.data);
      setBranches(response.data.data);
      console.log("Time taken to fetch Branch Data", (new Date().getTime() - time1) / 1000);
    } else {
      toast.error("Failed to fetch Branch Details");
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredBranches(branches);
        return;
      }

      const filtered = branches.filter((branch) => {
        const fieldsToSearch: (string | number | undefined | null)[] = [
          branch.branchName,
          branch.branchManager,
          branch.contactNumber,
          branch.address,
          branch.city,
          branch.state,
          branch.pincode,
          branch.username,
          branch.totalBillingValue,
          branch.email,
        ];

        return fieldsToSearch.some((field) => {
          if (typeof field === "string") {
            return field.toLowerCase().includes(text);
          }
          if (typeof field === "number") {
            return field.toString().includes(text);
          }
          return false;
        });
      });

      setFilteredBranches(filtered);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, branches]);



  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BranchInputs>();
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<EditBranchPassword>();

  const setDataToEditDetails = (data: BranchInputs) => {
    setValue("branchName", data.branchName);
    setValue("branchManager", data.branchManager);
    setValue("contactNumber", data.contactNumber);
    setValue("address", data.address);
    setValue("city", data.city);
    setValue("state", data.state);
    setValue("pincode", data.pincode);
    setValue("username", data.username);
    setValue("password", data.password);
    setValue("employeeCount", data.employeeCount);
    setValue("email", data.email);
  };

  const onCreateBranchSubmit: SubmitHandler<BranchInputs> = async (data) => {
    setIsloading(true);
    if (formStatus === "New") {
      const response = await createBranchApi(data);
      if (response?.status === 200) {
        toast.success("Branch Created");
        reset();
        setIsCreateModalOpen(false);
        getBranchDetails();
      } else if (response?.status === 201) {
        setIsBranchNameAvailable(false);
        setTimeout(() => {
          setIsBranchNameAvailable(true);
        }, 2000);
      } else {
        toast.error("Branch Creation Failed");
      }
    } else if (formStatus === "editing") {
      data.id = selectedBranch;
      const response = await updateBranchDetailsApi(data);
      if (response?.status === 200) {
        toast.success("Branch Updated");
        reset();
        setIsCreateModalOpen(false);
        getBranchDetails();
      } else {
        toast.error("Branch Update Failed");
      }
    }
    setIsloading(false);
  };

  const onChangePasswordSubmit: SubmitHandler<EditBranchPassword> = async (
    data,
  ) => {
    const finalInput = {
      adminPassword: data.adminPassword,
      branchName: selectedBranch,
      newPassword: data.newPassword,
    };
    setIsloading(true);
    const response = await changeBranchPasswordApi(finalInput);
    if (response?.status === 200) {
      toast.success("Password Changed");
      setIsEditPasswordModalOpen(false);
      getBranchDetails();
      resetPassword();
    } else {
      toast.error("Failed to Change Password");
    }
    setIsloading(false);
  };

  async function getExpenses() {
    const response = await getAllExpensesApi();
    if (response?.status === 200) {
      setExpenses(response.data.data);
    }
  }
  useEffect(() => {
    getBranchDetails();
    getExpenses();
  }, []);

  return (
    <div className="flex gap-5 flex-col">
      <div className="relative flex gap-10">
        <div className="absolute -top-18 right-[13vw] flex items-center gap-2 rounded-full bg-white p-[15px] px-5">
          <LuSearch size={18} />
          <input
            placeholder="Search"
            className="outline-none placeholder:font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiBuildingOfficeLight size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-sm text-[#A3AED0]">Branches</p>
              <p className="text-xl">{branches.length}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-sm text-[#A3AED0]">Total Branch expenses</p>
              <p className="text-xl">
                {formatter.format(expenses
                  .reduce((acc, expense) => acc + parseFloat(expense.amount), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-md bg-white p-5 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium">Branches</p>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger
              className="bg-primary hover:bg-primary flex cursor-pointer items-center gap-2 rounded-2xl p-2 px-4 font-medium text-white"
              onClick={() => [setFormStatus("New"), reset()]}
            >
              <IoMdAdd color="white" size={20} />
              Create new
            </DialogTrigger>
            <DialogContent className="min-w-6xl">
              <DialogHeader>
                <DialogTitle>
                  {formStatus == "New" ? "New Branch" : "Edit Branch"}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription></DialogDescription>
              <form
                className="flex flex-wrap justify-between gap-5"
                onSubmit={handleSubmit(onCreateBranchSubmit)}
              >
                <div className="w-[23%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Branch Name</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("branchName", {
                        required: true,
                        minLength: 3,
                      })}
                    />
                  </div>
                  {errors.branchName && (
                    <p className="mt-1 text-sm text-red-500">
                      Branch Name must be atleast 3 characters
                    </p>
                  )}
                  {!isBranchNameAvailable && (
                    <p className="mt-1 text-sm text-red-500">
                      Branch Name already exists, please try another one
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Branch Manager</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("branchManager", {
                        required: true,
                        minLength: 3,
                      })}
                    />
                  </div>
                  {errors.branchManager && (
                    <p className="mt-1 text-sm text-red-500">
                      Branch Manager must be atleast 3 characters
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Contact Number</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("contactNumber", {
                        required: true,
                        maxLength: 10,
                        minLength: 10,
                      })}
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="mt-1 text-sm text-red-500">
                      Contact Number must be 10 characters
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Email ID</label>
                    <input
                      type="email"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("email", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      Email ID must be valid
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <div className="flex w-full flex-col gap-2">
                    <label>Address</label>
                    <textarea
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("address", { required: true })}
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                      Address is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>City</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("city", { required: true })}
                    />
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500">
                      City is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>State</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2"
                      {...register("state", { required: true })}
                    />
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-500">
                      State is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Pincode</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2"
                      {...register("pincode", { required: true, minLength: 4 })}
                    />
                  </div>
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-500">
                      Pincode is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Username</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2"
                      {...register("username", { required: true })}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">
                      Username is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Password</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2"
                      {...register("password", { required: true })}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      Password is required
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex w-full flex-col gap-2">
                    <label>Employee count</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2"
                      {...register("employeeCount", { required: true })}
                    />
                  </div>
                  {errors.employeeCount && (
                    <p className="mt-1 text-sm text-red-500">
                      Employee count is required
                    </p>
                  )}
                </div>
                <div className="flex w-full justify-end">
                  <Button
                    className="bg-primary hover:bg-primary cursor-pointer"
                    type="submit"
                    disabled={isloading}
                  >
                    {isloading ? (
                      <VscLoading size={24} className="animate-spin" />
                    ) : formStatus === "New" ? (
                      "Create Branch"
                    ) : (
                      "Update Branch"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {
          filteredBranches?.length > 0 ?
            <table className="h-full w-full">
              <thead>
                <tr className="text-[#797979]">
                  <th className="text-start font-medium">
                    <div className="flex items-center gap-3">
                      <p>Branch Name</p>
                    </div>
                  </th>
                  <th className="text-start font-medium">
                    <div className="flex items-center gap-3">
                      <p>Branch Manager</p>
                    </div>
                  </th>
                  <th className="text-start font-medium">
                    <div className="flex items-center gap-3">
                      <p>Employee count</p>

                    </div>
                  </th>
                  <th className="text-start font-medium">
                    <div className="flex items-center gap-3">
                      <p>Total Billing value</p>
                    </div>
                  </th>
                  <th className="text-start font-medium">Username</th>
                  <th className="text-start font-medium">Password</th>
                </tr>
              </thead>
              <tbody className="">
                {filteredBranches?.map((branch) => (
                  <tr className="hover:bg-accent cursor-pointer" key={branch.id}>
                    <td
                      className="py-3"
                      onClick={() => [
                        setIsBranchDetailsModalOpen(true),
                        setBranchDetails(branch),
                      ]}
                    >
                      {branch.branchName}
                    </td>
                    <td
                      className="py-3"
                      onClick={() => [
                        setIsBranchDetailsModalOpen(true),
                        setBranchDetails(branch),
                      ]}
                    >
                      {branch.branchManager}
                    </td>
                    <td
                      className="py-3"
                      onClick={() => [
                        setIsBranchDetailsModalOpen(true),
                        setBranchDetails(branch),
                      ]}
                    >
                      {branch.employeeCount}
                    </td>
                    <td
                      className="py-3"
                      onClick={() => [
                        setIsBranchDetailsModalOpen(true),
                        setBranchDetails(branch),
                      ]}
                    >
                      {formatter.format(branch?.bill?.reduce((acc, data) => acc + data.subTotal, 0))}
                    </td>
                    <td
                      className="py-3"
                      onClick={() => [
                        setIsBranchDetailsModalOpen(true),
                        setBranchDetails(branch),
                      ]}
                    >
                      {branch.username}
                    </td>
                    <td>
                      <Dialog
                        open={isEditPasswordModalOpen}
                        onOpenChange={setIsEditPasswordModalOpen}
                      >
                        <DialogTrigger
                          className="cursor-pointer"
                          onClick={() => setSelectedBranch(branch.branchName)}
                        >
                          <RiEditBoxLine size={24} color="#2196F3" />
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <DialogDescription className="text-base text-black">
                            This will update the password for the{" "}
                            <span className="font-medium">
                              {selectedBranch} Branch
                            </span>
                            . User will have to login again.
                          </DialogDescription>
                          <form
                            className="flex flex-col gap-5"
                            onSubmit={handlePasswordSubmit(onChangePasswordSubmit)}
                          >
                            <div className="">
                              <div className="flex flex-col gap-2">
                                <label>Enter admin password</label>
                                <input
                                  type="password"
                                  className="border-primary rounded-md border p-1 py-2 pl-2"
                                  {...registerPassword("adminPassword", {
                                    required: true,
                                  })}
                                />
                              </div>
                              {passwordErrors.adminPassword && (
                                <p className="mt-1 text-sm text-red-500">
                                  Admin password is required
                                </p>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-col gap-2">
                                <label>Enter new password</label>
                                <input
                                  type="password"
                                  className="border-primary rounded-md border p-1 py-2 pl-2"
                                  {...registerPassword("newPassword", {
                                    required: true,
                                  })}
                                />
                              </div>
                              {passwordErrors.newPassword && (
                                <p className="mt-1 text-sm text-red-500">
                                  Password is required
                                </p>
                              )}
                            </div>
                            <div>
                              <div className="flex flex-col gap-2">
                                <label>Confirm new password</label>
                                <input
                                  type="password"
                                  className="border-primary rounded-md border p-1 py-2 pl-2"
                                  {...registerPassword("confirmNewPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) =>
                                      value === watch("newPassword") ||
                                      "Passwords do not match",
                                  })}
                                />
                              </div>
                              {passwordErrors.confirmNewPassword && (
                                <p className="mt-1 text-sm text-red-500">
                                  {passwordErrors.confirmNewPassword.message}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-end gap-5">
                              <Button
                                variant={"outline"}
                                className="border-primary px-7"
                                onClick={() => [
                                  resetPassword(),
                                  setIsEditPasswordModalOpen(false),
                                ]}
                                disabled={isloading}
                                type="button"
                              >
                                Cancel
                              </Button>
                              <Button
                                className="bg-primary px-7"
                                disabled={isloading}
                              >
                                {isloading ? (
                                  <VscLoading size={24} className="animate-spin" />
                                ) : (
                                  "Update"
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table> :
            <div className="flex w-full h-full items-center justify-center">
              <Skeleton active  rootClassName="w-full h-full" paragraph={{ rows: 10 }} />
            </div>
        }
      </div>
      <Dialog
        open={isBranchDetailsModalOpen}
        onOpenChange={setIsBranchDetailsModalOpen}
      >
        <DialogTrigger className="hidden"></DialogTrigger>
        <DialogContent className="min-w-6xl">
          <DialogHeader className="flex">
            <div className="flex items-start justify-between pr-10">
              <DialogTitle className="text-2xl">Branch Details</DialogTitle>
              <div className="flex gap-5">
                <button
                  className="cursor-pointer"
                  onClick={() => [
                    setFormStatus("editing"),
                    setIsBranchDetailsModalOpen(false),
                    setDataToEditDetails(branchDetails!),
                    setIsCreateModalOpen(true),
                    setSelectedBranch(branchDetails!.id),
                  ]}
                >
                  <RiEditBoxLine size={20} />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger
                    className="cursor-pointer"
                    onClick={() => setSelectedBranch(branchDetails!.id)}
                  >
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-black">
                        Are you sure you want to remove this branch? This action
                        is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() => [
                          deleteBranchHandler(),
                          setIsCreateModalOpen(false),
                        ]}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <div className="grid grid-cols-3 gap-5">
            <div className="flex items-center gap-5">
              <label className="font-medium">Branch Name</label>
              <p>{branchDetails?.branchName}</p>
            </div>
            <div className="col-span-2 flex items-center gap-5">
              <label className="font-medium">Branch Manager</label>
              <p>{branchDetails?.branchManager}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Contact Number</label>
              <p>{branchDetails?.contactNumber}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Email Id</label>
              <p>{branchDetails?.email}</p>
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <TbCopy
                    size={20}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        branchDetails!.email.toString(),
                      )
                    }
                  />
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2">Copied!</PopoverContent>
              </Popover>
            </div>
            <div className="col-span-full flex flex-col items-start gap-2">
              <label className="font-medium">Address</label>
              <p>{branchDetails?.address}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">City</label>
              <p>{branchDetails?.city}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">State</label>
              <p>{branchDetails?.state}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Pin Code</label>
              <p>{branchDetails?.pincode}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Username</label>
              <p>{branchDetails?.username}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Password</label>
              <input
                value={branchDetails?.password}
                type={showPassword ? "text" : "password"}
                className="outline-none"
                disabled
              />
              <div className="flex gap-2">
                <button onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <AiFillEyeInvisible size={24} className="text-primary" />
                  ) : (
                    <AiFillEye size={24} className="text-primary" />
                  )}
                </button>
                <button
                  className="cursor-pointer"
                  onClick={() => [
                    setSelectedBranch(branchDetails!.branchName),
                    setIsEditPasswordModalOpen(true),
                  ]}
                >
                  <RiEditBoxLine size={24} color="#2196F3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Total Billing value</label>
              <p>{branchDetails?.bill?.reduce((acc, data) => acc + data.subTotal, 0).toFixed(2)}</p>
            </div>
            {branchDetails?.PaymentRecords &&
              branchDetails?.PaymentRecords?.length > 0 && (
                <div className="col-span-3 w-full">
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
                              <th className="font-medium">Amount</th>
                              <th className="font-medium">For</th>
                              <th className="font-medium">Date</th>
                              <th className="font-medium">Payment mode</th>
                              <th className="font-medium">
                                Trans. ID/Cheque Number
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchDetails?.PaymentRecords?.map(
                              (record, index) => (
                                <tr
                                  className="hover:bg-accent text-center"
                                  key={record.id}
                                >
                                  <td className="p-2">{index + 1}</td>
                                  <td>{record.amount}</td>
                                  <td>{record.IDNumber}</td>
                                  <td>{record.date}</td>
                                  <td>{record.paymentMode}</td>
                                  <td>{record.transactionNumber}</td>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
