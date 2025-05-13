

import { FiSettings } from "react-icons/fi";
import { BiBell } from "react-icons/bi";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { FaChevronDown, FaRegClock } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";
import { RiDeleteBin6Line, RiEditBoxLine, RiTruckLine } from "react-icons/ri";
import { LiaHandsHelpingSolid } from "react-icons/lia";
import { Select as AntSelect } from "antd";

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

import { IoMdAdd } from "react-icons/io";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "antd";
import { GoDotFill } from "react-icons/go";
import { toast } from "react-toastify";
import { VscLoading } from "react-icons/vsc";
import { TbCopy } from "react-icons/tb";
import {
  createVehicleApi,
  createVendorApi,
  deleteVehicleApi,
  deleteVendorApi,
  getAllVehiclesApi,
  getAllVendorsApi,
  updateVehicleDetailsApi,
  updateVendorDetailsApi,
} from "@/api/partner";

export type VendorInputs = {
  id: string;
  name: string;
  GSTIN: string;
  branchName: string;
  contactPerson: string;
  contactNumber: string;
  pincode: string;
  address: string;
  TDS: string;
  email: string;
  city: string;
  state: string;
  outstandingLimit: string;
  vehicles: VehicleInputs[];
};

export type VehicleInputs = {
  id: string;
  vendorName: string;
  vehicletypes: string;
  vehicleNumber: string;
  ownerName: string;
  ownerPhone: string;
  driverName: string;
  driverPhone: string;
  insurance: string;
  RC: string;
};

type Option = { value: string; label: string };
type SortOrder = "asc" | "desc";

export default function VendorManagement({vendorsData, vehiclesData}:{vendorsData:VendorInputs[], vehiclesData:VehicleInputs[]}) {
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorInputs[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<VendorInputs[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInputs[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleInputs[]>([]);
  const [vendorSortOrder, setVendorSortOrder] = useState<SortOrder>("asc");
  const [showVehicles, setShowVehicles] = useState(false);
  const [isVendorNameAvailable, setIsVendorNameAvailable] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorInputs>();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInputs>();
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [modalStatus, setModalStatus] = useState<"vendor" | "vehicle">(
    "vendor"
  );

  useEffect(()=>{
    setVehicles(vehiclesData)
    setFilteredVehicles(vehiclesData)
    setVendors(vendorsData)
    setFilteredVendors(vendorsData)
  },[vendorsData, vehiclesData])

  const {
    handleSubmit,
    control,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VendorInputs>();

  const {
    handleSubmit: VehicleHandleSubmit,
    control: VehicleControl,
    register: VehicleRegister,
    reset: VehicleReset,
    setValue: VehicleSetValue,
    watch: VehicleWatch,
    formState: { errors: VehicleErrors },
  } = useForm<VehicleInputs>();

  const onVehicleSubmit = async (data: VehicleInputs) => {
    setIsLoading(true);
    if (formStatus === "New") {
      const response = await createVehicleApi(data);
      if (response?.status === 200) {
        toast.success("Vehicle Created");
        VehicleReset();
        setIsCreateVehicleOpen(false);
        fetchVendors();
        fetchVehicles();
      } else {
        toast.error("Something Went Wrong");
      }
    } else if (formStatus === "editing" && selectedVehicle) {
      const response = await updateVehicleDetailsApi(data, selectedVehicle?.id);
      if (response?.status === 200) {
        toast.success("Vehicle Updated");
        VehicleReset();
        setIsCreateVehicleOpen(false);
        fetchVendors();
      } else {
        toast.error("Something Went Wrong");
      }
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: VendorInputs) => {
    if (data.branchName) {
      const firstName = data.name;
      const lastName = data.branchName;
      data.name = firstName + "-" + lastName;
    }
    setIsLoading(true);
    if (formStatus === "New") {
      const response = await createVendorApi(data);
      if (response?.status === 200) {
        toast.success("Vendor Created");
        reset();
        setIsModalOpen(false);
        fetchVendors();
      } else if (response?.status === 201) {
        setIsVendorNameAvailable(false);
        setTimeout(() => {
          setIsVendorNameAvailable(true);
        }, 2000);
      } else {
        toast.error("Something Went Wrong");
      }
    } else if (formStatus === "editing" && selectedVendor) {
      const response = await updateVendorDetailsApi(data, selectedVendor?.id);
      if (response?.status === 200) {
        toast.success("Vendor Updated");
        reset();
        setIsModalOpen(false);
        fetchVendors();
      } else if (response?.status === 201) {
        setIsVendorNameAvailable(false);
        setTimeout(() => {
          setIsVendorNameAvailable(true);
        }, 2000);
      } else {
        toast.error("Something Went Wrong");
      }
    }
    setIsLoading(false);
  };

  const onVendorDeleteHandler = async (id: string) => {
    const response = await deleteVendorApi(id);
    if (response?.status === 200) {
      toast.success("Vendor Deleted");
      fetchVendors();
      setIsDetailsModalOpen(false);
    } else {
      toast.error("Failed to Delete Vendor");
    }
  };

  const onVehicleDeleteHandler = async (id: string) => {
    const response = await deleteVehicleApi(id);
    if (response?.status === 200) {
      toast.success("Vehicle Deleted");
      fetchVehicles();
      setIsDetailsModalOpen(false);
      fetchVehicles();
      fetchVendors();
    } else {
      toast.error("Failed to Delete Vehicle");
    }
  };

  const sortVendorsByName = () => {
    const newOrder: SortOrder = vendorSortOrder === "asc" ? "desc" : "asc";
    const sorted = [...vendors].sort((a, b) =>
      newOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    setVendorSortOrder(newOrder);
    setFilteredVendors(sorted);
  };

  function extractVendorNameOptions(vendors: VendorInputs[]): Option[] {
    const vendorOptions = vendors.map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
    }));
    vendorOptions.push({ value: "Others", label: "Others" });
    return vendorOptions;
  }

  function setOwnerDetails(name: string) {
    const selectedVendor = vendors.find((v) => v.name === name);

    if (selectedVendor) {
      VehicleSetValue("ownerName", selectedVendor.contactPerson);
      VehicleSetValue("ownerPhone", selectedVendor.contactNumber);
    }else{
      VehicleSetValue("ownerName", "");
      VehicleSetValue("ownerPhone", "");
    }
  }

  const formatText = (value: string) => {
    const clean = value.replace(/\s/g, "").toUpperCase();
    const formatted = clean
      .slice(0, 10) // limit to 8 chars (6 + 3 spaces)
      .split("")
      .map((char, i) => {
        if (i === 2 || i === 4 || i === 6) return " " + char;
        return char;
      })
      .join("");

    return formatted;
  };

  const setVendorDetails = (data: VendorInputs) => {
    setValue("name", data.name);
    setValue("GSTIN", data.GSTIN);
    setValue("contactPerson", data.contactPerson);
    setValue("contactNumber", data.contactNumber);
    setValue("pincode", data.pincode);
    setValue("address", data.address);
    setValue("TDS", data.TDS);
    setValue("email", data.email);
    setValue("city", data.city);
    setValue("state", data.state);
    setValue("outstandingLimit", data.outstandingLimit);
  };

  const setVechicleDetails = (data: VehicleInputs) => {
    VehicleSetValue("vendorName", data.vendorName);
    VehicleSetValue("vehicletypes", data.vehicletypes);
    VehicleSetValue("vehicleNumber", data.vehicleNumber);
    VehicleSetValue("ownerName", data.ownerName);
    VehicleSetValue("ownerPhone", data.ownerPhone);
    VehicleSetValue("driverName", data.driverName);
    VehicleSetValue("driverPhone", data.driverPhone);
    VehicleSetValue("insurance", data.insurance);
    VehicleSetValue("RC", data.RC);
  };

  async function fetchVendors() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setVendors(response.data.data);
      setFilteredVendors(response.data.data);
    }
  }

  async function fetchVehicles() {
    const response = await getAllVehiclesApi();
    if (response?.status === 200) {
      setVehicles(response.data.data);
      setFilteredVehicles(response.data.data);
    }
  }

  return (
    <>
      <div className="flex w-full justify-between ">
        <div>
          <p className="text-sm text-[#707EAE] font-medium ">Admin</p>
          <p className="font-medium text-3xl">Vendor Management</p>
        </div>
        <div className="bg-white p-3 rounded-full flex px-5 gap-5">
          <div className="bg-[#F4F7FE] rounded-full flex p-2 items-center gap-2">
            <LuSearch size={18} />
            <input
              placeholder="Search"
              className="outline-none placeholder:font-medium"
            />
          </div>

          <div className="flex items-center">
            <FiSettings size={22} color="#A3AED0" />
          </div>
          <div className="flex items-center">
            <BiBell size={24} color="#A3AED0" />
          </div>
        </div>
      </div>
      <div className="flex gap-10">
        <div className="bg-white rounded-xl p-5 w-full flex ">
          <div className="items-center gap-5 flex">
            <div className="p-3 rounded-full bg-[#F4F7FE]">
              <LiaHandsHelpingSolid size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className=" text-sm text-muted">Vendors</p>
              <p className=" text-xl">{vendors?.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 w-full flex ">
          <div className="items-center gap-5 flex">
            <div className="p-3 rounded-full bg-[#F4F7FE]">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className=" text-sm text-muted">Total outstanding payment</p>
              <p className=" text-xl">INR 25,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 w-full flex ">
          <div className="items-center gap-5 flex">
            <div className="p-3 rounded-full bg-[#F4F7FE]">
              <RiTruckLine size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className=" text-sm text-muted">Total vehicles</p>
              <p className=" text-xl">{vehicles?.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 w-full flex ">
          <div className="items-center gap-5 flex">
            <div className="p-3 rounded-full bg-[#F4F7FE]">
              <FaRegClock size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className=" text-sm text-muted">Average delivery time</p>
              <p className=" text-xl">10 Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-md flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <p className="font-medium text-xl">Vendors</p>
          <div className="flex gap-5">
            <Modal
              open={isModalOpen}
              width={1240}
              centered={true}
              footer={null}
              onCancel={() => setIsModalOpen(false)}
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-wrap justify-between gap-5"
              >
                <p className="w-full text-xl font-semibold">New Vendor</p>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Vendor Name</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("name", { required: true })}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500">Vendor Name is required</p>
                  )}
                  {!isVendorNameAvailable && (
                    <p className="text-red-500">
                      Vendor Name already exists, please try another one
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Vendor’s GSTIN</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("GSTIN", {
                        required: true,
                        minLength: 15,
                        maxLength: 15,
                      })}
                    />
                  </div>
                  {errors.GSTIN && (
                    <p className="text-red-500">
                      Vendor GSTIN is required and should be 15 characters
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">
                      Branch Name (Optional)
                    </label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("branchName")}
                    />
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Contact Person</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("contactPerson", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="text-red-500">Contact Person is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Contact Number</label>
                    <input
                      type="number"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("contactNumber", {
                        required: true,
                        minLength: 10,
                        maxLength: 10,
                      })}
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-red-500">
                      Contact Number is required and should be 10 characters
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Email ID</label>
                    <input
                      type="email"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("email", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500">
                      Contact Number is required and should be 10 characters
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Address</label>
                    <textarea
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("address", { required: true })}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-red-500">Address is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Pincode</label>
                    <input
                      type="number"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("pincode", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.pincode && (
                    <p className="text-red-500">Pincode is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">City</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("city", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.city && (
                    <p className="text-red-500">City is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">State</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...register("state", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.state && (
                    <p className="text-red-500">State is required</p>
                  )}
                </div>

                <div className="w-[49%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">TDS</label>
                    <Controller
                      control={control}
                      name="TDS"
                      defaultValue=""
                      rules={{ required: "Please select TDS" }}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={[
                            { value: "Declared", label: "Declared" },
                            { value: "Not-declared", label: "Not declared" },
                          ]}
                          placeholder="Select TDS"
                          size="large"
                          className="outline outline-primary rounded-md"
                        />
                      )}
                    />
                  </div>
                  {errors.TDS && (
                    <p className="text-red-500">{errors.TDS.message}</p>
                  )}
                </div>
                <div className="w-[49%]">
                  <div className="flex flex-col gap-2 ">
                    <label className="font-medium">Outstanding Limit</label>
                    <div className="flex border border-primary  rounded-md items-center pl-2 ">
                      <p className="text-xs font-medium">INR</p>
                      <input
                        type="number"
                        placeholder="00000.00"
                        className="pl-2 p-1 py-2 outline-none w-full"
                        {...register("outstandingLimit", {
                          required: true,
                        })}
                      />
                    </div>
                  </div>
                  {errors.outstandingLimit && (
                    <p className="text-red-500">
                      Outstanding Limit is required
                    </p>
                  )}
                </div>
                <div className="w-full justify-end flex">
                  <Button className="px-7 rounded-xl" disabled={isLoading}>
                    {isLoading ? (
                      <VscLoading size={24} className="animate-spin" />
                    ) : formStatus === "New" ? (
                      "Create Vendor"
                    ) : (
                      "Update Vendor"
                    )}
                  </Button>
                </div>
              </form>
            </Modal>
            <Modal
              open={isCreateVehicleOpen}
              width={1240}
              centered={true}
              footer={null}
              onCancel={() => setIsCreateVehicleOpen(false)}
            >
              <form
                onSubmit={VehicleHandleSubmit(onVehicleSubmit)}
                className="flex flex-wrap justify-between gap-5"
              >
                <p className="w-full text-xl font-medium">
                  {formStatus === "New" ? "New Vehicle" : "Edit Vehicle"}
                </p>
                <div className="w-[32%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Vendor Name</label>
                    <Controller
                      name="vendorName"
                      control={VehicleControl}
                      defaultValue={""}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={extractVendorNameOptions(vendors)}
                          placeholder="Select Vendor Name"
                          className="w-full outline outline-primary  rounded-md "
                          size="large"
                          onChange={(value) => {
                            field.onChange(value);
                            setOwnerDetails(value);
                          }}
                          disabled={formStatus === "editing"}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="w-[32%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Vehicle Type</label>
                    <Controller
                      name="vehicletypes"
                      control={VehicleControl}
                      defaultValue={""}
                      rules={{ required: "Please select vehicle types" }}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={[
                            { value: "Car", label: "Car" },
                            { value: "Motorcycle", label: "Motorcycle" },
                          ]}
                          placeholder="Select vehicle types"
                          className="w-full outline outline-primary  rounded-md "
                          size="large"
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.vehicletypes && (
                    <p className="text-red-500">
                      Vehicle types available is required
                    </p>
                  )}
                </div>
                <div className="w-[32%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Vehicle Number</label>
                    <Controller
                      name="vehicleNumber"
                      control={VehicleControl}
                      defaultValue={""}
                      rules={{ required: "Please enter vehicle number" }}
                      render={({ field }) => (
                        <input
                          type="text"
                          className="border border-primary p-1 py-2 rounded-md pl-2"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatText(e.target.value))
                          }
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.vehicleNumber && (
                    <p className="text-red-500">Vehicle Number is required</p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Owner Name</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      style={
                        formStatus === "editing"
                          ? {
                              backgroundColor: "#F5F5F5",
                              cursor: "not-allowed",
                              color: "#C7C3C3FF",
                            }
                          : {}
                      }
                      {...VehicleRegister("ownerName", {
                        validate: (value) =>
                          VehicleWatch("vendorName")
                            ? !!value || "Owner Name is required"
                            : true,
                      })}
                      disabled={formStatus === "editing"}
                    />
                  </div>
                  {VehicleErrors.ownerName && (
                    <p className="text-red-500">
                      {"VehicleErrors.ownerName.message"}
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Owner Contact</label>
                    <input
                      type="number"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      style={
                        formStatus === "editing"
                          ? {
                              backgroundColor: "#F5F5F5",
                              cursor: "not-allowed",
                              color: "#C7C3C3FF",
                            }
                          : {}
                      }
                      {...VehicleRegister("ownerPhone", {
                        validate: (value) => {
                          if (VehicleWatch("vendorName")) {
                            if (!value) return "Owner Number is required";
                            if (value.toString().length !== 10)
                              return "Owner Number should be exactly 10 digits";
                          }
                          return true;
                        },
                      })}
                      disabled={formStatus === "editing"}
                    />
                  </div>
                  {VehicleErrors.ownerPhone && (
                    <p className="text-red-500">
                      {VehicleErrors.ownerPhone.message}
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Driver Name</label>
                    <input
                      type="text"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...VehicleRegister("driverName", {
                        validate: (value) =>
                          !VehicleWatch("vendorName")
                            ? !!value || "Driver Name is required"
                            : true,
                      })}
                    />
                  </div>
                  {VehicleErrors.driverName && (
                    <p className="text-red-500">
                      {VehicleErrors.driverName.message}
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Driver Contact</label>
                    <input
                      type="number"
                      className="border border-primary p-1 py-2 rounded-md pl-2"
                      {...VehicleRegister("driverPhone", {
                        minLength: 10,
                        maxLength: 10,
                        validate: (value) =>
                          !VehicleWatch("vendorName")
                            ? !!value ||
                              "Driver Number is required and should be 10 characters"
                            : true,
                      })}
                    />
                  </div>
                  {VehicleErrors.driverPhone && (
                    <p className="text-red-500">
                      {VehicleErrors.driverPhone.message}
                    </p>
                  )}
                </div>

                <div className="w-[49%]">
                  <div className="flex flex-col gap-2 ">
                    <label>Insurance</label>
                    <Controller
                      name="insurance"
                      control={VehicleControl}
                      defaultValue={""}
                      rules={{ required: "Please select insurance" }}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={[
                            { value: "Insured", label: "Insured" },
                            { value: "Not insured", label: "Not insured" },
                          ]}
                          placeholder="Select insurance"
                          className="w-full outline outline-primary  rounded-md "
                          size="large"
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.insurance && (
                    <p className="text-red-500">Insurance is required</p>
                  )}
                </div>
                <div className="w-[49%]">
                  <div className="flex flex-col gap-2 ">
                    <label>RC</label>
                    <Controller
                      control={VehicleControl}
                      name="RC"
                      defaultValue=""
                      rules={{ required: "Please select RC" }}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={[
                            { value: "Available", label: "Avialable" },
                            { value: "Not Avialable", label: "Not Avialable" },
                          ]}
                          placeholder="Select RC"
                          size="large"
                          className="outline outline-primary rounded-md"
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.RC && (
                    <p className="text-red-500">{VehicleErrors.RC.message}</p>
                  )}
                </div>
                <div className="w-full justify-end flex gap-5">
                  <Button
                    onClick={() => VehicleReset()}
                    className="px-7 rounded-xl"
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                  <Button className="px-7 rounded-xl" disabled={isLoading}>
                    {isLoading ? (
                      <VscLoading size={24} className="animate-spin" />
                    ) : formStatus === "New" ? (
                      "Add Vehicle"
                    ) : (
                      "Update Vehicle"
                    )}
                  </Button>
                </div>
              </form>
            </Modal>

            <Button
              className="bg-secondary hover:bg-muted/30 rounded-xl text-black cursor-pointer"
              onClick={() => setShowVehicles(!showVehicles)}
            >
              {showVehicles ? "Show Vendors" : "Show Vehicles"}
            </Button>
            <Button
              variant={"outline"}
              onClick={() => [
                setIsCreateVehicleOpen(true),
                VehicleReset(),
                setFormStatus("New"),
              ]}
              className="text-[#2196F3] rounded-xl py-5 border-primary cursor-pointer"
            >
              <IoMdAdd size={30} />
              Add Vehicle
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl py-5 cursor-pointer"
            >
              <IoMdAdd color="white" size={30} />
              Add Vendor
            </Button>
          </div>
        </div>
        {!showVehicles && (
          <table>
            <thead>
              <tr>
                <th className="font-[400] text-start text-[#797979] flex items-center gap-2">
                  <p>Vendor Name</p>
                  <FaChevronDown
                    size={15}
                    className="cursor-pointer"
                    onClick={sortVendorsByName}
                  />
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Owner Name
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Fleet size
                </th>
                <th className="font-[400] text-start text-[#797979] flex items-center gap-2">
                  <p>Pending payment</p>
                  <FaChevronDown size={15} className="cursor-pointer" />
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Total Hire Cost
                </th>
                <th className="font-[400] text-start text-[#797979]">TDS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors?.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="hover:bg-accent cursor-pointer"
                  onClick={() => [
                    setIsDetailsModalOpen(true),
                    setSelectedVendor(vendor),
                  ]}
                >
                  <td className="py-2">{vendor.name}</td>
                  <td className="py-2">{vendor.contactPerson}</td>
                  <td className="py-2">{vendor.vehicles.length}</td>
                  <td className="py-2">INR 0</td>
                  <td className="py-2">INR 0</td>
                  <td className="py-2">{vendor.TDS}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {showVehicles && (
          <table>
            <thead>
              <tr>
                <th className="font-[400] text-start text-[#797979]">
                  Vendor Name
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Vehicle Number
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Vehicle Type
                </th>
                <th className="font-[400] text-start text-[#797979]">
                  Insurance
                </th>
                <th className="font-[400] text-start text-[#797979]">RC</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles?.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="py-2">{vehicle.vendorName || "-"}</td>
                  <td className="py-2">{vehicle.vehicleNumber}</td>
                  <td className="py-2">{vehicle.vehicletypes}</td>
                  <td className="py-2">{vehicle.insurance}</td>
                  <td className="py-2">{vehicle.RC}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogTrigger className="hidden"></DialogTrigger>
        {modalStatus === "vendor" && (
          <DialogContent className="min-w-7xl">
            <DialogHeader className="flex flex-row justify-between items-start ">
              <DialogTitle className="text-2xl">Vendor Details</DialogTitle>
              <div className="mr-10 flex gap-3 ">
                <Button
                  className="bg-[#F0F8FF] hover:bg-[#dfecf9] text-black cursor-pointer"
                  onClick={() => setModalStatus("vehicle")}
                >
                  Vehicle List
                </Button>
                <button
                  className="cursor-pointer"
                  onClick={() => [
                    setVendorDetails(selectedVendor!),
                    setSelectedVendor(selectedVendor!),
                    setFormStatus("editing"),
                    setIsModalOpen(true),
                  ]}
                >
                  <RiEditBoxLine size={20} />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger className="cursor-pointer">
                    <RiDeleteBin6Line size={20} color="red" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alert!</AlertDialogTitle>
                      <AlertDialogDescription className="text-black font-medium">
                        Are you sure you want to remove this vendor? This action
                        will remove all the vehicles associated with this
                        vendor. This action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() => onVendorDeleteHandler(selectedVendor!.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <div className="grid grid-cols-3 gap-5">
              <div className="flex  gap-5 items-center">
                <label className="font-medium">Vendor Name</label>
                <p>{selectedVendor?.name}</p>
              </div>
              <div className="flex  gap-5 items-center col-span-2">
                <label className="font-medium">Vendor GSTIN</label>
                <p>{selectedVendor?.GSTIN}</p>
              </div>
              <div className="flex  gap-5 items-center ">
                <label className="font-medium">Contact Person</label>
                <p>{selectedVendor?.contactPerson}</p>
              </div>
              <div className="flex  gap-5 items-center ">
                <label className="font-medium">Contact Number</label>
                <p>{selectedVendor?.contactNumber}</p>
              </div>
              <div className="flex  gap-5 items-center ">
                <label className="font-medium">Email id</label>
                <p>{selectedVendor?.email}</p>
                <Popover>
                  <PopoverTrigger className="cursor-pointer ">
                    <TbCopy
                      size={20}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedVendor!.email.toString()
                        )
                      }
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-2">Copied!</PopoverContent>
                </Popover>
              </div>
              <div className="flex  gap-2 items-start flex-col col-span-full ">
                <label className="font-medium">Address</label>
                <p>{selectedVendor?.address}</p>
              </div>
              <div className="flex  gap-5 items-start ">
                <label className="font-medium">Pin Code</label>
                <p>{selectedVendor?.pincode}</p>
              </div>
              <div className="flex  gap-5 items-start ">
                <label className="font-medium">City</label>
                <p>{selectedVendor?.city}</p>
              </div>
              <div className="flex  gap-5 items-start ">
                <label className="font-medium">State</label>
                <p>{selectedVendor?.state}</p>
              </div>
              <div className="flex  gap-2 items-start flex-col col-span-full">
                <label className="font-medium">Vehicle type available</label>
                <div className=" pl-5 grid grid-cols-3 w-full ">
                  {selectedVendor?.vehicles.map((vehicles) => (
                    <div className="flex items-center gap-3 ">
                      <GoDotFill size={12} />
                      <p>{vehicles.vehicletypes}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex  gap-5 items-start ">
                <label className="font-medium">Current Outstanding</label>
                <p>INR {selectedVendor?.outstandingLimit}</p>
              </div>
              <div className="flex  gap-5 items-start col-span-2 justify-end">
                <label className="font-medium">Outstanding Limit</label>
                <p>INR {selectedVendor?.outstandingLimit}</p>
              </div>
              <div className="col-span-full">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="bg-primary/30 px-4">
                      Recent Payments
                    </AccordionTrigger>
                    <AccordionContent className="bg-primary/30 px-2 rounded-b-md">
                      <table className="bg-white rounded-md px-2 w-full">
                        <thead>
                          <tr>
                            <th className="font-medium p-1">Sl no</th>
                            <th className="font-medium">Amount Received</th>
                            <th className="font-medium">Date</th>
                            <th className="font-medium">Payment mode</th>
                            <th className="font-medium">
                              Trans. ID/Cheque Number
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center hover:bg-accent">
                            <td className="p-2">1</td>
                            <td>INR 25,000</td>
                            <td>20/10/2022</td>
                            <td>Cash</td>
                            <td>1234567890</td>
                          </tr>
                        </tbody>
                      </table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </DialogContent>
        )}
        {modalStatus === "vehicle" && (
          <DialogContent className="min-w-7xl">
            <DialogHeader className="flex flex-row justify-between items-start">
              <DialogTitle className="text-2xl">
                Vehicle List - {selectedVendor?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <div className="flex flex-col gap-5">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="font-medium text-start text-[#797979]">
                      Sl no
                    </th>
                    <th className="font-medium text-start text-[#797979]">
                      Vehicle Number
                    </th>
                    <th className="font-medium text-start text-[#797979]">
                      Vehicle Type
                    </th>
                    <th className="font-medium text-start text-[#797979]">
                      Insturance
                    </th>
                    <th className="font-medium text-start text-[#797979]">
                      RC
                    </th>
                    <th className="font-medium  text-[#797979]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVendor?.vehicles.map((vehicle, i) => (
                    <tr key={vehicle.id}>
                      <td className="p-1">{i + 1}</td>
                      <td>{vehicle.vehicleNumber}</td>
                      <td>{vehicle.vehicletypes}</td>
                      <td>{vehicle.insurance}</td>
                      <td>{vehicle.RC}</td>
                      <td className="flex justify-center items-center">
                        <div className="flex gap-2 ">
                          <button
                            className="cursor-pointer"
                            onClick={() => [
                              setVechicleDetails(vehicle),
                              setSelectedVehicle(vehicle),
                              setIsCreateVehicleOpen(true),
                              setFormStatus("editing"),
                              setIsDetailsModalOpen(false),
                            ]}
                          >
                            <RiEditBoxLine size={20} />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger className="cursor-pointer">
                              <RiDeleteBin6Line size={20} color="red" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Alert!</AlertDialogTitle>
                                <AlertDialogDescription className="text-black font-medium">
                                  Are you sure you want to remove this vehicle?
                                  This action is permanent and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50" onClick={() => onVehicleDeleteHandler(vehicle.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button
                className="bg-[#F0F8FF] hover:bg-[#dfecf9] text-black cursor-pointer w-fit"
                onClick={() => setModalStatus("vendor")}
              >
                Vendor details
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
