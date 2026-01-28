import { TbEdit } from "react-icons/tb";
import { RxDotFilled } from "react-icons/rx";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { VscLoading } from "react-icons/vsc";
import { Checkbox } from "../ui/checkbox";
import {
  createBankDetailsApi,
  createCompanyProfileApi,
  createGeneralSettingsApi,
  getBankDetailsApi,
  getCompanyProfileApi,
  getGeneralSettingsApi,
  updateBankDetailsApi,
  updateCompanyProfileApi,
  updateGeneralSettingsApi,
} from "@/api/settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { Setting } from "@/Home";
import {
  changeAdminPasswordApi,
  getOtherSettingsApi,
  updateOtherSettingsApi,
} from "@/api/admin";
import { EditBranchPassword } from "../branch/Branch";

export interface ProfileInputs {
  id: string;
  email: string;
  contactNumber: string;
  alternateContactNumber: string;
  GSTIN: string;
  HSN: string;
  websiteURL: string;
  address: string;
}

interface GeneralSettingsInputs {
  id: string;
  expenseInputState: boolean;
  vehicleInputState: boolean;
  expenseInput: string;
  vehicleInput: string;
  expenseTypes: {
    state: boolean;
    name: string;
  }[];
  vehicleTypes: {
    state: boolean;
    name: string;
  }[];
}

export interface BankDetailsInputs {
  id: string;
  name: string;
  accountNumber: string;
  ifscCode: string;
}

export default function Settings({ data }: { data?: Setting }) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGeneralSettingsModalOpen, setIsGeneralSettingsModalOpen] =
    useState(false);
  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileInputs>();
  const [generalData, setGeneralData] = useState<GeneralSettingsInputs>({
    id: "",
    expenseTypes: [],
    vehicleTypes: [],
    expenseInput: "",
    vehicleInput: "",
    expenseInputState: false,
    vehicleInputState: false,
  });
  const [bankDetailsData, setBankDetailsData] = useState<BankDetailsInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditPasswordModalOpen, setIsEditPasswordModalOpen] = useState(false);
  const [otherSettings, setOtherSettings] = useState({
    billId: "",
    expenseId: "",
    creditId: "",
  });
  const [isOtherSettingsModalOpen, setIsOtherSettingsModalOpen] =
    useState(false);
  const [othersError, setOthersError] = useState({
    billId: false,
    expenseId: false,
    creditId: false,
  });
  const [isloading, setIsloading] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<EditBranchPassword>();

  const addExpenseType = () => {
    setGeneralData((prev) => ({
      ...prev,
      expenseTypes: [
        ...prev.expenseTypes,
        { state: true, name: generalData.expenseInput },
      ],
      expenseInput: "",
      expenseInputState: false,
    }));
  };
  const addVehicleType = () => {
    setGeneralData((prev) => ({
      ...prev,
      vehicleTypes: [
        ...prev.vehicleTypes,
        { state: true, name: generalData.vehicleInput },
      ],
      vehicleInput: "",
      vehicleInputState: false,
    }));
  };

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<ProfileInputs>();

  const {
    handleSubmit: bankSettingsHandleSubmit,
    register: bankSettingsRegister,
    setValue: bankSettingsSetValue,
    formState: { errors: bankSettingsErrors },
  } = useForm<BankDetailsInputs>();

  const onChangePasswordSubmit: SubmitHandler<EditBranchPassword> = async (
    data,
  ) => {
    const finalInput = {
      adminPassword: data.adminPassword,
      newPassword: data.newPassword,
    };
    setIsloading(true);
    const response = await changeAdminPasswordApi(finalInput);
    if (response?.status === 200) {
      toast.success("Password Changed");
      setIsEditPasswordModalOpen(false);
      resetPassword();
    } else {
      toast.error("Failed to Change Password");
    }
    setIsloading(false);
  };

  const onSubmit: SubmitHandler<ProfileInputs> = async (
    data: ProfileInputs,
  ) => {
    setIsLoading(true);
    if (!profileData) {
      const response = await createCompanyProfileApi(data);
      if (response?.status === 200) {
        toast.success("Company Profile has been Created");
        setIsProfileModalOpen(false);
        fetchProfileData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      const response = await updateCompanyProfileApi(profileData.id, data);
      if (response?.status === 200) {
        toast.success("Company Profile has been updated");
        setIsProfileModalOpen(false);
        fetchProfileData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  const onGeneralSettingsSubmit = async () => {
    setIsLoading(true);
    if (generalData.id === "") {
      const data = {
        expenseTypes: generalData.expenseTypes
          .filter((e) => e.state)
          .map((e) => e.name),

        vehicleTypes: generalData.vehicleTypes
          .filter((e) => e.state)
          .map((e) => e.name),
      };

      const response = await createGeneralSettingsApi(data);
      if (response?.status === 200) {
        toast.success("Generatal Settings has been Created");
        setIsGeneralSettingsModalOpen(false);
        setGeneralData({
          id: "",
          expenseTypes: [],
          vehicleTypes: [],
          expenseInput: "",
          vehicleInput: "",
          expenseInputState: false,
          vehicleInputState: false,
        });
        fetchGeneralSettingsData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      const data = {
        expenseTypes: generalData.expenseTypes
          .filter((e) => e.state)
          .map((e) => e.name),

        vehicleTypes: generalData.vehicleTypes
          .filter((e) => e.state)
          .map((e) => e.name),
      };

      const response = await updateGeneralSettingsApi(generalData.id, data);
      if (response?.status === 200) {
        toast.success("Profile Settings has been updated");
        setIsGeneralSettingsModalOpen(false);
        setGeneralData({
          id: "",
          expenseTypes: [],
          vehicleTypes: [],
          expenseInput: "",
          vehicleInput: "",
          expenseInputState: false,
          vehicleInputState: false,
        });
        fetchGeneralSettingsData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  const onBankSettingsSubmit: SubmitHandler<BankDetailsInputs> = async (
    data: BankDetailsInputs,
  ) => {
    setIsLoading(true);
    if (!bankDetailsData) {
      const response = await createBankDetailsApi(data);
      if (response?.status === 200) {
        toast.success("Bank Details has been Created");
        setIsBankDetailsModalOpen(false);
        fetchBankDetailsData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      const response = await updateBankDetailsApi(bankDetailsData?.id, data);
      if (response?.status === 200) {
        toast.success("Bank Details has been updated");
        setIsBankDetailsModalOpen(false);
        fetchBankDetailsData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  async function fetchGeneralSettingsData() {
    const responseGeneralSettings = await getGeneralSettingsApi();
    if (responseGeneralSettings?.status === 200) {
      setGeneralData({
        id: responseGeneralSettings.data.data.id,
        expenseTypes: responseGeneralSettings.data.data.expenseTypes.map(
          (name: any) => ({
            state: true,
            name: name,
          }),
        ),
        vehicleTypes: responseGeneralSettings.data.data.vehicleTypes.map(
          (name: any) => ({
            state: true,
            name: name,
          }),
        ),
        expenseInput: "",
        vehicleInput: "",
        expenseInputState: false,
        vehicleInputState: false,
      });
    }
  }

  const onOtherSettingsSubmit = async () => {
    const keys = ["billId", "expenseId", "creditId"] as const;

    for (const key of keys) {
      if (!otherSettings[key]) {
        setOthersError({
          billId: false,
          expenseId: false,
          creditId: false,
          [key]: true,
        });
        return;
      }
    }

    setOthersError({
      billId: false,
      expenseId: false,
      creditId: false,
    });

    setIsLoading(true);
    if (otherSettings.billId && otherSettings.expenseId) {
      const response = await updateOtherSettingsApi(otherSettings);
      if (response?.status === 200) {
        toast.success("Other Settings Updated");
        setIsOtherSettingsModalOpen(false);
        fetchOtherSettingsData();
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    }
    setIsLoading(false);
  };

  async function fetchProfileData() {
    const responseProfile = await getCompanyProfileApi();
    if (responseProfile?.status === 200) {
      setProfileData(responseProfile.data.data);
      console.log(responseProfile.data.data);

      setValue("email", responseProfile.data.data.email);
      setValue("contactNumber", responseProfile.data.data.contactNumber);
      setValue(
        "alternateContactNumber",
        responseProfile.data.data.alternateContactNumber,
      );
      setValue("GSTIN", responseProfile.data.data.GSTIN);
      setValue("HSN", responseProfile.data.data.HSN);
      setValue("websiteURL", responseProfile.data.data.websiteURL);
      setValue("address", responseProfile.data.data.address);
    }
  }

  async function fetchBankDetailsData() {
    const responseBankDetails = await getBankDetailsApi();
    if (responseBankDetails?.status === 200) {
      setBankDetailsData(responseBankDetails.data.data);
      bankSettingsSetValue(
        "accountNumber",
        responseBankDetails.data.data.accountNumber,
      );
      bankSettingsSetValue("ifscCode", responseBankDetails.data.data.ifscCode);
      bankSettingsSetValue("name", responseBankDetails.data.data.name);
    }
  }

  async function fetchOtherSettingsData() {
    const responseOtherSettings = await getOtherSettingsApi();
    if (responseOtherSettings?.status === 200) {
      const data = responseOtherSettings.data.data;
      setOtherSettings({
        billId: data.billId,
        expenseId: data.expenseId,
        creditId: data.creditId,
      });
    }
  }

  useEffect(() => {
    if (!data) return;
    setBankDetailsData(data.bankDetails);
    bankSettingsSetValue("accountNumber", data.bankDetails.accountNumber);
    bankSettingsSetValue("ifscCode", data.bankDetails.ifscCode);
    bankSettingsSetValue("name", data.bankDetails.name);
    setProfileData(data.ProfileInputs);
    setValue("email", data.ProfileInputs.email);
    setValue("contactNumber", data.ProfileInputs.contactNumber);
    setValue(
      "alternateContactNumber",
      data.ProfileInputs.alternateContactNumber,
    );
    setValue("GSTIN", data.ProfileInputs.GSTIN);
    setValue("HSN", data.ProfileInputs.HSN);
    setValue("websiteURL", data.ProfileInputs.websiteURL);
    setValue("address", data.ProfileInputs.address);
  }, []);

  useEffect(() => {
    fetchGeneralSettingsData();
    fetchOtherSettingsData();
  }, []);

  return (
    <>
      <section>
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-medium">Basic Settings</p>
          <div className="flex flex-col gap-3 rounded-md bg-white p-5 px-10">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Profile Details</p>
              <TbEdit
                size={24}
                color="black"
                onClick={() => setIsProfileModalOpen(true)}
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col gap-5 text-sm">
                <div>
                  <label className="font-medium">Address (regd office)</label>
                  <p className="w-[30%]">{profileData?.address}</p>
                </div>
                <div>
                  <label className="font-medium">Email ID</label>
                  <p className="w-[20%]">{profileData?.email}</p>
                </div>
                <div>
                  <label className="font-medium">Company GSTIN</label>
                  <p className="w-[20%]">{profileData?.GSTIN}</p>
                </div>
              </div>
              <div className="flex w-[50%] flex-col gap-5 text-sm">
                <div>
                  <label className="font-medium">Contact Number</label>
                  <p className="w-[20%]">{profileData?.contactNumber}</p>
                </div>
                <div>
                  <label className="font-medium">
                    Alternate Contact Number
                  </label>
                  <p className="w-[20%]">
                    {profileData?.alternateContactNumber}
                  </p>
                </div>
                <div>
                  <label className="font-medium">Website URL</label>
                  <p className="w-[20%]">{profileData?.websiteURL}</p>
                </div>
                <div>
                  <label className="font-medium">HSN/ SAC</label>
                  <p className="w-[20%]">{profileData?.HSN}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-white p-5 px-10 ">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">General Settings</p>
              <TbEdit
                size={24}
                color="black"
                onClick={() => setIsGeneralSettingsModalOpen(true)}
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-sm max-h-[40vh] overflow-y-auto">
              <div className="flex w-1/2 flex-col gap-3">
                <label className="font-medium">Vehicle List</label>
                <div className="grid grid-cols-3 gap-6">
                  {generalData.vehicleTypes.map((vehicle, index) => (
                    <p className="flex text-center" key={index}>
                      <RxDotFilled size={20} /> {vehicle.name}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex w-[50%] flex-col gap-3">
                <label className="font-medium">Expense Categories</label>
                <div className="grid grid-cols-3 gap-6">
                  {generalData.expenseTypes.map((expense, index) => (
                    <p className="flex text-center" key={index}>
                      <RxDotFilled size={20} /> {expense.name}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-white p-5 px-10">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Other Settings</p>
              <TbEdit
                size={24}
                color="black"
                onClick={() => setIsOtherSettingsModalOpen(true)}
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-between pr-25">
              <div className="flex gap-3">
                <label className="font-medium">Currect Bill Number:</label>
                <p>{otherSettings.billId}</p>
              </div>
              <div className="flex gap-3">
                <label className="font-medium">Current Expense ID:</label>
                <p>{otherSettings.expenseId}</p>
              </div>
              <div className="flex gap-3">
                <label className="font-medium">Credit ID:</label>
                <p>{otherSettings.creditId}</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-medium">Company Settings</p>
          <div className="flex flex-col gap-3 rounded-md bg-white p-5 px-10">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">Bank Details</p>
              <TbEdit
                size={24}
                color="black"
                onClick={() => setIsBankDetailsModalOpen(true)}
                className="cursor-pointer"
              />
            </div>
            <div className="flex justify-between pr-30 text-sm">
              <div className="flex w-full justify-between">
                <div className="flex flex-col gap-2">
                  <label className="font-medium">Bank Name</label>
                  <p>{bankDetailsData?.name}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium">Account Number</label>
                  <p>{bankDetailsData?.accountNumber}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium">IFSC Code</label>
                  <p>{bankDetailsData?.ifscCode}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Dialog
              open={isEditPasswordModalOpen}
              onOpenChange={setIsEditPasswordModalOpen}
            >
              <DialogTrigger className="cursor-pointer border-primary border p-2 font-medium rounded-md text-sm text-primary" >
                Change Admin Password
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-base text-black">
                  This will update the password for admin.
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
                    <Button className="bg-primary px-7" disabled={isloading}>
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
          </div>
        </div>
      </section>
      <Modal
        open={isProfileModalOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => setIsProfileModalOpen(false)}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap justify-between gap-5"
        >
          <p className="w-full text-xl font-semibold">Profile settings</p>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Email ID</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("email", { required: true })}
              />
            </div>
            {errors.email && <p className="text-red-500">Email is required</p>}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Contact Number</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("contactNumber", { required: true })}
              />
            </div>
            {errors.contactNumber && (
              <p className="text-red-500">Contact Number is required</p>
            )}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Alternate Contact Number</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("alternateContactNumber", { required: true })}
              />
            </div>
            {errors.alternateContactNumber && (
              <p className="text-red-500">
                Alternate Contact Number is required
              </p>
            )}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">GSTIN</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("GSTIN", {
                  required: true,
                  minLength: 15,
                  maxLength: 15,
                })}
              />
            </div>
            {errors.GSTIN && (
              <p className="text-red-500">
                GSTIN is required and should be 15 characters
              </p>
            )}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">HSN</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("HSN", { required: true })}
              />
            </div>
            {errors.HSN && <p className="text-red-500">HSN is required</p>}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Website URL</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...register("websiteURL", {
                  required: true,
                })}
              />
            </div>
            {errors.websiteURL && (
              <p className="text-red-500">Website URL is required</p>
            )}
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Address</label>
              <textarea
                className="border-primary h-[10vh] rounded-md border p-1 py-2 pl-2"
                {...register("address", { required: true })}
              />
            </div>
            {errors.address && (
              <p className="text-red-500">Address is required</p>
            )}
          </div>

          <div className="flex w-full justify-end">
            <Button className="rounded-xl px-7" disabled={isLoading}>
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : profileData ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={isBankDetailsModalOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => setIsBankDetailsModalOpen(false)}
        style={{
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <form
          onSubmit={bankSettingsHandleSubmit(onBankSettingsSubmit)}
          className="flex flex-wrap justify-between gap-5"
        >
          <p className="w-full text-xl font-semibold">Bank details</p>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Bank Name</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...bankSettingsRegister("name", { required: true })}
              />
            </div>
            {bankSettingsErrors.name && (
              <p className="text-red-500">Bank Name is required</p>
            )}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Account Number</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...bankSettingsRegister("accountNumber", { required: true })}
              />
            </div>
            {bankSettingsErrors.accountNumber && (
              <p className="text-red-500">Account Number is required</p>
            )}
          </div>
          <div className="w-[30%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">IFSC Code</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                {...bankSettingsRegister("ifscCode", { required: true })}
              />
            </div>
            {bankSettingsErrors.ifscCode && (
              <p className="text-red-500">IFSC Number is required</p>
            )}
          </div>

          <div className="flex w-full justify-end">
            <Button className="rounded-xl px-7" disabled={isLoading}>
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : bankDetailsData ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={isGeneralSettingsModalOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => setIsGeneralSettingsModalOpen(false)}
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col gap-3">
          <p className="w-full text-xl font-semibold">Expense types</p>
          <div className="flex items-start gap-10">
            <div className="grid grid-cols-3 gap-10">
              {generalData.expenseTypes.map((expense, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <Checkbox
                    checked={expense.state}
                    onCheckedChange={(e: boolean) => {
                      setGeneralData((prev) => ({
                        ...prev,
                        expenseTypes: prev.expenseTypes.map((item, i) =>
                          i === index ? { ...item, state: e } : item,
                        ),
                      }));
                    }}
                  />
                  <p>{expense.name}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                onCheckedChange={(e: boolean) => {
                  setGeneralData((prev) => ({
                    ...prev,
                    expenseInputState: e,
                  }));
                }}
                checked={generalData.expenseInputState}
              />
              <input
                placeholder="Type here..."
                className="outline-none"
                disabled={!generalData.expenseInputState}
                value={generalData.expenseInput}
                onChange={(e) =>
                  setGeneralData((prev) => ({
                    ...prev,
                    expenseInput: e.target.value,
                  }))
                }
              />
              <Button
                className=""
                disabled={!generalData.expenseInputState}
                onClick={addExpenseType}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <p className="w-full text-xl font-semibold">Vehicle types</p>
          <div className="flex items-start gap-10">
            <div className="grid grid-cols-3 gap-10">
              {generalData.vehicleTypes.map((vehicle, index) => (
                <div className="flex items-center gap-2" key={index}>
                  <Checkbox
                    checked={vehicle.state}
                    onCheckedChange={(e: boolean) => {
                      setGeneralData((prev) => ({
                        ...prev,
                        vehicleTypes: prev.vehicleTypes.map((item, i) =>
                          i === index ? { ...item, state: e } : item,
                        ),
                      }));
                    }}
                  />
                  <p>{vehicle.name}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                onCheckedChange={(e: boolean) => {
                  setGeneralData((prev) => ({
                    ...prev,
                    vehicleInputState: e,
                  }));
                }}
                checked={generalData.vehicleInputState}
              />
              <input
                placeholder="Type here..."
                className="outline-none"
                disabled={!generalData.vehicleInputState}
                value={generalData.vehicleInput}
                onChange={(e) =>
                  setGeneralData((prev) => ({
                    ...prev,
                    vehicleInput: e.target.value,
                  }))
                }
              />
              <Button
                className=""
                disabled={!generalData.vehicleInputState}
                onClick={addVehicleType}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-end">
          <Button
            className="rounded-xl px-7"
            disabled={isLoading}
            onClick={onGeneralSettingsSubmit}
          >
            {isLoading ? (
              <VscLoading size={24} className="animate-spin" />
            ) : generalData.id === "" ? (
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </Modal>
      <Modal
        open={isOtherSettingsModalOpen}
        width={1240}
        centered={true}
        footer={null}
        onCancel={() => setIsOtherSettingsModalOpen(false)}

      >
        <form className="flex flex-wrap justify-between gap-5">
          <p className="w-full text-xl font-semibold">Other settings</p>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Current Bill Number</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                onChange={(e) =>
                  setOtherSettings((prev) => ({
                    ...prev,
                    billId: e.target.value,
                  }))
                }
                value={otherSettings.billId}
              />
            </div>
            {othersError.billId && (
              <p className="text-red-500">Bill ID is required</p>
            )}
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Current expense ID</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                onChange={(e) =>
                  setOtherSettings((prev) => ({
                    ...prev,
                    expenseId: e.target.value,
                  }))
                }
                value={otherSettings.expenseId}
              />
            </div>
            {othersError.expenseId && (
              <p className="text-red-500">Expense ID is required</p>
            )}
          </div>
          <div className="w-[49%]">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Credit ID</label>
              <input
                type="text"
                className="border-primary rounded-md border p-1 py-2 pl-2"
                onChange={(e) =>
                  setOtherSettings((prev) => ({
                    ...prev,
                    creditId: e.target.value,
                  }))
                }
                value={otherSettings.creditId}
              />
            </div>
            {othersError.creditId && (
              <p className="text-red-500">Credit ID is required</p>
            )}
          </div>

          <div className="flex w-full justify-end">
            <Button
              className="rounded-xl px-7"
              disabled={isLoading}
              type="button"
              onClick={onOtherSettingsSubmit}
            >
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : bankDetailsData ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
