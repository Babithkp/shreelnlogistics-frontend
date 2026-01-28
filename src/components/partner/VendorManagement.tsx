import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { FaChevronDown } from "react-icons/fa";

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
  // deleteVehicleApi,
  deleteVendorApi,
  filterVendorByNameApi,
  getAllVehiclesApi,
  getAllVendorsApi,
  getVendorForPageApi,
  updateVehicleDetailsApi,
  updateVendorDetailsApi,
} from "@/api/partner";
import { getGeneralSettingsApi } from "@/api/settings";
import { generalSettings, VehicleInputs, VendorInputs } from "@/types";
import { createNotificationApi } from "@/api/admin";
import { LuSearch } from "react-icons/lu";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { formatter } from "@/lib/utils";

type Option = { value: string; label: string };
type SortOrder = "asc" | "desc";

export default function VendorManagement({
  vendorsData,
  vehiclesData,
  onRefresh
}: {
  vendorsData: VendorInputs[];
  vehiclesData: VehicleInputs[];
  onRefresh: () => void;
}) {
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<VendorInputs[]>(
    vendorsData.slice(0, 50),
  );
  const [originalVendors, setOriginalVendors] = useState<VendorInputs[]>(
    vendorsData,
  );
  const [filteredVendors, setFilteredVendors] =
    useState<VendorInputs[]>(vendorsData);
  // const [vehicles, setVehicles] = useState<VehicleInputs[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleInputs[]>(
    vehiclesData.slice(0, 50),
  );
  const [vendorSortOrder, setVendorSortOrder] = useState<SortOrder>("asc");
  const [showVehicles, setShowVehicles] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorInputs>();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInputs>();
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [modalStatus, setModalStatus] = useState<"vendor" | "vehicle">(
    "vendor",
  );
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [branch, setBranch] = useState({
    branchId: "",
    branchName: "",
    isAdmin: false,
  });
  const [search, setSearch] = useState("");
  const [isVehicleNameMatched, setIsVehicleNameMatched] = useState(false);
  const [isVendorNameMatched, setIsVendorNameMatched] = useState(false);
  const [totalItems, setTotalItems] = useState(vendorsData.length);
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

  useEffect(() => {
    setOriginalVendors(vendorsData);
  }, [vendorsData]);

  async function getVendorForPage(page: number, limit: number) {
    const response = await getVendorForPageApi(page, limit);
    if (response?.status === 200) {
      const allVendors = response.data.data;
      setFilteredVendors(allVendors.vendorData);
      setVendors(allVendors.vendorData);
      setTotalItems(allVendors.vendorCount);
    }
  }

  async function fetchVehicleType() {
    const response = await getGeneralSettingsApi();
    if (response?.status === 200) {
      const vehicles: generalSettings = response.data.data;
      setVehicleTypes(vehicles.vehicleTypes);
    }
  }

  useEffect(() => {
    getVendorForPage(currentPage, itemsPerPage);
  }, [startIndex, endIndex]);

  useEffect(() => {
    fetchVehicleType();
    getVendorForPage(currentPage, itemsPerPage);
  }, []);

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

  async function filterVendorByName(search: string) {
    const response = await filterVendorByNameApi(search);
    if (response?.status === 200) {
      const allVendors = response.data.data;
      setFilteredVendors(allVendors);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredVendors(vendors);
      return;
    }
    filterVendorByName(search);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredVendors(vendors);
    }
  }, [search]);

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
      } else if (response?.status === 201) {
        setIsVehicleNameMatched(true);
        setTimeout(() => {
          setIsVehicleNameMatched(false);
        }, 2000);
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
        if (!branch.isAdmin) {
          const notificationData = {
            requestId: selectedVehicle?.id,
            title: "Vehicle edit",
            message: branch.branchName,
            description: selectedVehicle?.vendorName,
            status: "editable",
          };
          await createNotificationApi(notificationData);
        }
      } else if (response?.status === 201) {
        setIsVehicleNameMatched(true);
        setTimeout(() => {
          setIsVehicleNameMatched(false);
        }, 2000);
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
        fetchVendors();
        reset();
        setIsModalOpen(false);
        onRefresh()
      } else if (response?.status === 201) {
        setIsVendorNameMatched(true);
        setTimeout(() => {
          setIsVendorNameMatched(false);
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
        if (!branch.isAdmin) {
          const notificationData = {
            requestId: selectedVendor?.id,
            title: "Vendor edit",
            message: branch.branchName,
            description: selectedVendor?.name,
            status: "editable",
          };
          await createNotificationApi(notificationData);
        }
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
      if (!branch.isAdmin) {
        const notificationData = {
          requestId: selectedVendor?.id,
          title: "Vendor delete",
          message: branch.branchName,
          description: selectedVendor?.name,
          status: "editable",
        };
        await createNotificationApi(notificationData);
      }
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
      fetchVendors();
      if (!branch.isAdmin) {
        const notificationData = {
          requestId: selectedVendor?.id,
          title: "Vehicle delete",
          message: branch.branchName,
          description: selectedVendor?.name,
          status: "editable",
        };
        await createNotificationApi(notificationData);
      }
    } else {
      toast.error("Failed to Delete Vehicle");
    }
  };

  const sortVendorsByName = () => {
    const newOrder: SortOrder = vendorSortOrder === "asc" ? "desc" : "asc";
    const sorted = [...vendors].sort((a, b) =>
      newOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );
    setVendorSortOrder(newOrder);
    setFilteredVendors(sorted);
  };

  function extractVehicleTypeOptions(types: string[]): Option[] {
    return types.map((type) => ({
      label: type,
      value: type,
    }));
  }

  function extractVendorNameOptions(vendors: VendorInputs[]): Option[] {
    const vendorOptions = vendors.map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
    }));
    return vendorOptions;
  }

  function setOwnerDetails(name: string) {
    const selectedVendor = vendorsData.find((v) => v.name === name);

    if (selectedVendor) {
      VehicleSetValue("ownerName", selectedVendor.contactPerson);
      VehicleSetValue("ownerPhone", selectedVendor.contactNumber);
    } else {
      VehicleSetValue("ownerName", "");
      VehicleSetValue("ownerPhone", "");
    }
  }

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
    setValue("pan", data.pan);
  };

  const setVechicleDetails = (data: VehicleInputs) => {
    VehicleSetValue("vendorName", data.vendorName);
    VehicleSetValue("vehicletypes", data.vehicletypes);
    VehicleSetValue("vehicleNumber", data.vehicleNumber);
    VehicleSetValue("ownerName", data.ownerName);
    VehicleSetValue("ownerPhone", data.ownerPhone);
    VehicleSetValue("panNumber", data.panNumber);
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
      setFilteredVehicles(response.data.data);
    }
  }

  useEffect(() => {
    fetchVehicles();

    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetails = localStorage.getItem("branchDetails");
    if (isAdmin === "false" && branchDetails) {
      const branchData = JSON.parse(branchDetails);
      setBranch({
        branchId: branchData.id,
        branchName: branchData.branchName,
        isAdmin: false,
      });
    } else {
      setBranch({
        branchId: "",
        branchName: "",
        isAdmin: true,
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <LiaHandsHelpingSolid size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Vendors</p>
              <p className="text-xl">{vendorsData?.length}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total outstanding payment</p>
              <p className="text-xl">
                {formatter.format(
                  originalVendors.reduce(
                    (acc, data) =>
                      acc +
                      data.FM.reduce(
                        (acc, data) =>
                          acc + parseFloat(data.outStandingBalance || "0"),
                        0,
                      ),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <RiTruckLine size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total vehicles</p>
              <p className="text-xl">{vehiclesData?.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="flex max-h-[73vh] flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium">
            {showVehicles ? "All Vechiles" : "All Vendors"}
          </p>
          <div className="flex items-center gap-5">
            <Modal
              open={isModalOpen}
              width={1240}
              centered={true}
              footer={null}
              onCancel={() => setIsModalOpen(false)}
              style={{
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-wrap justify-between gap-5"
              >
                <p className="w-full text-xl font-semibold">New Vendor</p>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Vendor Name</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("name", { required: true })}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500">Vendor Name is required</p>
                  )}
                  {isVendorNameMatched && (
                    <p className="text-red-500">
                      Vendor Name already exists, please try another one
                    </p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Vendor’s GSTIN</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("GSTIN")}
                    />
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">
                      Branch Name (Optional)
                    </label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("branchName")}
                    />
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Contact Person</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Contact Number</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Email ID</label>
                    <input
                      type="email"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("email", {})}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Address</label>
                    <textarea
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("address", { required: true })}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-red-500">Address is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Pincode</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">City</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">State</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("state", {
                        required: true,
                      })}
                    />
                  </div>
                  {errors.state && (
                    <p className="text-red-500">State is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">PAN</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("pan", { required: true })}
                    />
                  </div>
                  {errors.pan && (
                    <p className="text-red-500">PAN is required</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
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
                          className="outline-primary rounded-md outline"
                        />
                      )}
                    />
                  </div>
                  {errors.TDS && (
                    <p className="text-red-500">{errors.TDS.message}</p>
                  )}
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Outstanding Limit</label>
                    <div className="border-primary flex items-center rounded-md border pl-2">
                      <p className="text-xs font-medium">INR</p>
                      <input
                        type="number"
                        placeholder="00000.00"
                        className="w-full p-1 py-2 pl-2 outline-none"
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
                <div className="flex w-full justify-end">
                  <Button className="rounded-xl px-7" disabled={isLoading}>
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
                  <div className="flex flex-col gap-2">
                    <label>Vendor Name</label>
                    <Controller
                      name="vendorName"
                      control={VehicleControl}
                      defaultValue={""}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          showSearch
                          options={extractVendorNameOptions(originalVendors)}
                          placeholder="Select Vendor Name"
                          className="outline-primary w-full rounded-md outline"
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
                  <div className="flex flex-col gap-2">
                    <label>Vehicle Type</label>
                    <Controller
                      name="vehicletypes"
                      control={VehicleControl}
                      defaultValue={""}
                      rules={{ required: "Please select vehicle types" }}
                      render={({ field }) => (
                        <AntSelect
                          {...field}
                          options={extractVehicleTypeOptions(vehicleTypes)}
                          placeholder="Select vehicle types"
                          className="outline-primary w-full rounded-md outline"
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
                  <div className="flex flex-col gap-2">
                    <label>Vehicle Number</label>
                    <Controller
                      name="vehicleNumber"
                      control={VehicleControl}
                      defaultValue={""}
                      rules={{ required: "Please enter vehicle number" }}
                      render={({ field }) => (
                        <input
                          type="text"
                          className="border-primary rounded-md border p-1 py-2 pl-2"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.vehicleNumber && (
                    <p className="text-red-500">Vehicle Number is required</p>
                  )}
                  {isVehicleNameMatched && (
                    <p className="text-red-500">
                      Vehicle Number already exists, please try another one
                    </p>
                  )}
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2">
                    <label>Owner Name</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label>Owner Contact</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
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
                  <div className="flex flex-col gap-2">
                    <label>Driver Name</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...VehicleRegister("driverName")}
                    />
                  </div>
                </div>
                <div className="w-[23%]">
                  <div className="flex flex-col gap-2">
                    <label>Driver Contact</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...VehicleRegister("driverPhone", {
                        required: true,
                      })}
                    />
                  </div>
                  {VehicleErrors.driverPhone && (
                    <p className="text-red-500">
                      Driver Number is required and should be 10 characters
                    </p>
                  )}
                </div>
                <div className="w-[32%]">
                  <div className="flex flex-col gap-2">
                    <label>Pan Number</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...VehicleRegister("panNumber", {
                        required: true,
                      })}
                    />
                  </div>
                  {VehicleErrors.panNumber && (
                    <p className="text-red-500">Pan Number is required</p>
                  )}
                </div>

                <div className="w-[32%]">
                  <div className="flex flex-col gap-2">
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
                          className="outline-primary w-full rounded-md outline"
                          size="large"
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.insurance && (
                    <p className="text-red-500">Insurance is required</p>
                  )}
                </div>
                <div className="w-[32%]">
                  <div className="flex flex-col gap-2">
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
                            { value: "Available", label: "Available" },
                            {
                              value: "Not Available",
                              label: "Not Available",
                            },
                          ]}
                          placeholder="Select RC"
                          size="large"
                          className="outline-primary rounded-md outline"
                        />
                      )}
                    />
                  </div>
                  {VehicleErrors.RC && (
                    <p className="text-red-500">{VehicleErrors.RC.message}</p>
                  )}
                </div>
                <div className="flex w-full justify-end gap-5">
                  <Button
                    type="button"
                    onClick={() => VehicleReset()}
                    className="rounded-xl px-7"
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                  <Button className="rounded-xl px-7" disabled={isLoading}>
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
            {!showVehicles && (
              <form
                className="flex items-center gap-5"
                onSubmit={handleSearch}
              >
                <div className="bg-secondary flex items-center gap-2 rounded-full p-2 px-5">
                  <LuSearch size={18} />
                  <input
                    placeholder="Search"
                    className="outline-none placeholder:font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button className="cursor-pointer rounded-xl p-5">
                  <LuSearch size={30} className="mx-3 scale-125" />
                </Button>
              </form>
            )}

            <Button
              className="bg-secondary hover:bg-muted/30 cursor-pointer rounded-xl text-black"
              onClick={() => setShowVehicles(!showVehicles)}
            >
              {showVehicles ? "Show Vendors" : "Show Vehicles"}
            </Button>
            <Button
              variant={"outline"}
              onClick={() => [
                VehicleReset(),
                setIsCreateVehicleOpen(true),
                setFormStatus("New"),
              ]}
              className="border-primary cursor-pointer rounded-xl py-5 text-[#2196F3]"
            >
              <IoMdAdd size={30} />
              Add Vehicle
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-xl py-5"
            >
              <IoMdAdd color="white" size={30} />
              Add Vendor
            </Button>
            {!showVehicles && !search && (
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
        {!showVehicles && (
          <div className="overflow-y-auto  ">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                    <p>Vendor Name</p>
                    <FaChevronDown
                      size={15}
                      className="cursor-pointer"
                      onClick={sortVendorsByName}
                    />
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    Owner Name
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    Fleet size
                  </th>
                  <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                    <p>Pending payment</p>
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    Total Hire Cost
                  </th>
                  <th className="text-start font-[400] text-[#797979]">TDS</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors?.map((vendor: VendorInputs) => (
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
                    <td className="py-2">
                      {formatter.format(
                        vendor.FM.reduce(
                          (acc, data) =>
                            acc + parseFloat(data.outStandingBalance || "0"),
                          0,
                        ),
                      )}
                    </td>
                    <td className="py-2">
                      {formatter.format(
                        vendor.FM?.reduce(
                          (acc, data) =>
                            acc +
                            parseFloat(data.hire || "0") +
                            parseFloat(data.detentionCharges || "0") +
                            parseFloat(data.rtoCharges || "0") +
                            parseFloat(data.otherCharges || "0") -
                            parseFloat(data.tds || "0"),
                          0,
                        ),
                      )}
                    </td>
                    <td className="py-2">{vendor.TDS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showVehicles && (
          <div className="overflow-y-auto  ">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-start font-[400] text-[#797979]">
                  Vendor Name
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  Vehicle Number
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  Vehicle Type
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  Pan Number
                </th>
                <th className="text-start font-[400] text-[#797979]">
                  Insurance
                </th>
                <th className="text-start font-[400] text-[#797979]">RC</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles?.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="py-2">{vehicle.vendorName || "-"}</td>
                  <td className="py-2">{vehicle.vehicleNumber}</td>
                  <td className="py-2">{vehicle.vehicletypes}</td>
                  <td className="py-2">{vehicle.panNumber}</td>
                  <td className="py-2">{vehicle.insurance}</td>
                  <td className="py-2">{vehicle.RC}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogTrigger className="hidden"></DialogTrigger>
        {modalStatus === "vendor" && (
          <DialogContent className="max-h-140 min-w-7xl overflow-auto">
            <DialogHeader className="flex flex-row items-start justify-between">
              <DialogTitle className="text-2xl">Vendor Details</DialogTitle>
              <div className="mr-10 flex gap-3">
                <Button
                  className="cursor-pointer bg-[#F0F8FF] text-black hover:bg-[#dfecf9]"
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
                      <AlertDialogDescription className="font-medium text-black">
                        Are you sure you want to remove this vendor? This action
                        will remove all the vehicles associated with this
                        vendor. This action is permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={() =>
                          onVendorDeleteHandler(selectedVendor!.id)
                        }
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
              <div className="flex items-center gap-5">
                <label className="font-medium">Vendor Name</label>
                <p>{selectedVendor?.name}</p>
              </div>
              <div className="col-span-2 flex items-center gap-5">
                <label className="font-medium">Vendor GSTIN</label>
                <p>{selectedVendor?.GSTIN}</p>
              </div>
              <div className="flex items-center gap-5">
                <label className="font-medium">Contact Person</label>
                <p>{selectedVendor?.contactPerson}</p>
              </div>
              <div className="flex items-center gap-5">
                <label className="font-medium">Contact Number</label>
                <p>{selectedVendor?.contactNumber}</p>
              </div>
              {selectedVendor?.email && (
                <div className="flex items-center gap-5">
                  <label className="font-medium">Email id</label>
                  <p>{selectedVendor?.email}</p>
                  <Popover>
                    <PopoverTrigger className="cursor-pointer">
                      <TbCopy
                        size={20}
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedVendor!.email.toString(),
                          )
                        }
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-2">
                      Copied!
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="col-span-full flex flex-col items-start gap-2">
                <label className="font-medium">Address</label>
                <p>{selectedVendor?.address}</p>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">Pin Code</label>
                <p>{selectedVendor?.pincode}</p>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">City</label>
                <p>{selectedVendor?.city}</p>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">State</label>
                <p>{selectedVendor?.state}</p>
              </div>
              <div className="col-span-full flex flex-col items-start gap-2">
                <label className="font-medium">Vehicle type available</label>
                <div className="grid w-full grid-cols-3 pl-5">
                  {selectedVendor?.vehicles.map((vehicles) => (
                    <div className="flex items-center gap-3">
                      <GoDotFill size={12} />
                      <p>{vehicles.vehicletypes}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">Pan</label>
                <p>{selectedVendor?.pan}</p>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">Current Outstanding</label>
                <p>
                  INR{" "}
                  {selectedVendor?.FM.reduce((acc, data) => {
                    return acc + parseFloat(data.outStandingBalance || "0");
                  }, 0)}
                </p>
              </div>
              <div className="flex items-start gap-5">
                <label className="font-medium">Outstanding Limit</label>
                <p>INR {selectedVendor?.outstandingLimit}</p>
              </div>
              {selectedVendor?.FM?.some(
                (fm) => fm.PaymentRecords?.length > 0,
              ) && (
                  <div className="col-span-full">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="bg-primary/30 px-4">
                          Recent Payments
                        </AccordionTrigger>
                        <AccordionContent className="bg-primary/30 rounded-b-md px-2">
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
                              </tr>
                            </thead>
                            <tbody>
                              {selectedVendor?.FM?.map((FMdata, i) => (
                                <>
                                  {FMdata.PaymentRecords.map((record) => (
                                    <tr
                                      className="hover:bg-accent text-center"
                                      key={record.id}
                                    >
                                      <td className="p-2">{i + 1}</td>
                                      <td>
                                        INR {parseFloat(record.amount).toFixed(2)}
                                      </td>
                                      <td>{record.date}</td>
                                      <td>{record.paymentMode}</td>
                                      <td>{record.transactionNumber}</td>
                                    </tr>
                                  ))}
                                </>
                              ))}
                            </tbody>
                          </table>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
            </div>
          </DialogContent>
        )}
        {modalStatus === "vehicle" && (
          <DialogContent className="max-h-140 min-w-7xl overflow-auto">
            <DialogHeader className="flex flex-row items-start justify-between">
              <DialogTitle className="text-2xl">
                Vehicle List - {selectedVendor?.name}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription></DialogDescription>
            <div className="flex flex-col gap-5">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-start font-medium text-[#797979]">
                      Sl no
                    </th>
                    <th className="text-start font-medium text-[#797979]">
                      Vehicle Number
                    </th>
                    <th className="text-start font-medium text-[#797979]">
                      Vehicle Type
                    </th>
                    <th className="text-start font-medium text-[#797979]">
                      Insturance
                    </th>
                    <th className="text-start font-medium text-[#797979]">
                      RC
                    </th>
                    <th className="font-medium text-[#797979]">Actions</th>
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
                      <td className="flex items-center justify-center">
                        <div className="flex gap-2">
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
                                <AlertDialogDescription className="font-medium text-black">
                                  Are you sure you want to remove this vehicle?
                                  This action is permanent and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                                  onClick={() =>
                                    onVehicleDeleteHandler(vehicle.id)
                                  }
                                >
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
                className="w-fit cursor-pointer bg-[#F0F8FF] text-black hover:bg-[#dfecf9]"
                onClick={() => setModalStatus("vendor")}
              >
                Vendor details
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
