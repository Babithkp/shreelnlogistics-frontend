import { LuSearch } from "react-icons/lu";
import {
  Select as SelectN,
  SelectContent as SelectContentN,
  SelectItem as SelectItemN,
  SelectTrigger as SelectTriggerN,
} from "@/components/ui/select copy";

import { Modal } from "antd";
import { FiSettings } from "react-icons/fi";
import { BiBell } from "react-icons/bi";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { Button } from "../ui/button";
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
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createClientApi, getAllClientsApi } from "@/api/admin";
import { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { PiUsersThree } from "react-icons/pi";
import { FaChevronDown } from "react-icons/fa6";
import { RiDeleteBin6Line, RiEditBoxLine } from "react-icons/ri";
import { TbCopy } from "react-icons/tb";
import { deleteClientApi, updateClientDetailsApi } from "@/api/branch";

export type ClientInputs = {
  id: string;
  name: string;
  GSTIN: string;
  branchName: string;
  contactPerson: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  panNumber: string;
  creditLimit: string;
  createdAt: string;
};
type SortOrder = "asc" | "desc" | "";

export default function ClientManagement({ data }: { data: ClientInputs[] }) {
  const [isloading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState<ClientInputs[]>([]);
  const [sortState, setSortState] = useState<{
    name: SortOrder;
    createdAt: SortOrder;
    pendingPayment: SortOrder;
  }>({
    name: "",
    createdAt: "",
    pendingPayment: "",
  });
  const [isClientNameAvailable, setIsClientNameAvailable] = useState(true);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] =
    useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInputs>();
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientInputs>();

  const onSubmit: SubmitHandler<ClientInputs> = async (data) => {
    if (data.branchName) {
      const firstName = data.name;
      const lastName = data.branchName;
      data.name = firstName + "-" + lastName;
    }
    setIsLoading(true);
    if (formStatus === "New") {
      const response = await createClientApi(data);
      if (response?.status === 200) {
        toast.success("Client Created");
        reset();
        setIsOpen(false);
        getClientDetails();
      } else if (response?.status === 201) {
        setIsClientNameAvailable(false);
        setTimeout(() => {
          setIsClientNameAvailable(true);
        }, 2000);
      } else {
        toast.error("Client Creation Failed");
      }
    } else if (formStatus === "editing" && selectedClient) {
      const response = await updateClientDetailsApi(data, selectedClient?.id);
      if (response?.status === 200) {
        toast.success("Client Updated");
        reset();
        setIsOpen(false);
        getClientDetails();
      } else if (response?.status === 201) {
        setIsClientNameAvailable(false);
        setTimeout(() => {
          setIsClientNameAvailable(true);
        }, 2000);
      } else {
        toast.error("Client Update Failed");
      }
    }
    setIsLoading(false);
  };

  const onDeleteClientSubmit: SubmitHandler<ClientInputs> = async (data) => {
    const response = await deleteClientApi(data.id);
    if (response?.status === 200) {
      toast.success("Client Deleted");
      getClientDetails();
      setIsClientDetailsModalOpen(false);
    } else {
      toast.error("Failed to Delete Client");
    }
  };

  async function getClientDetails() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setFilteredClients(response.data.data);
    } else {
      toast.error("Failed to fetch Client Details");
    }
  }

  const setClientDetails = (data: ClientInputs) => {
    setValue("name", data.name);
    setValue("GSTIN", data.GSTIN);
    setValue("contactPerson", data.contactPerson);
    setValue("email", data.email);
    setValue("contactNumber", data.contactNumber);
    setValue("address", data.address);
    setValue("city", data.city);
    setValue("state", data.state);
    setValue("pincode", data.pincode);
    setValue("panNumber", data.panNumber);
    setValue("creditLimit", data.creditLimit);
  };

  const handleSort = (key: keyof typeof sortState) => {
    const toggleOrder = (current: SortOrder): SortOrder =>
      current === "asc" ? "desc" : "asc";

    const currentOrder = sortState[key] || "asc";
    const newOrder = toggleOrder(currentOrder);

    setSortState((prevState) => ({
      ...prevState,
      [key]: newOrder,
    }));

    const sorted = [...data].sort((a, b) => {
      if (key === "pendingPayment") {
        const aNum = Number(a[key as keyof ClientInputs]);
        const bNum = Number(b[key as keyof ClientInputs]);
        return newOrder === "asc" ? aNum - bNum : bNum - aNum;
      } else if (key === "createdAt") {
        const aDate = new Date(a[key as keyof ClientInputs]).getTime();
        const bDate = new Date(b[key as keyof ClientInputs]).getTime();
        return newOrder === "asc" ? aDate - bDate : bDate - aDate;
      } else if (key === "name") {
        return newOrder === "asc"
          ? String(a[key]).localeCompare(String(b[key]))
          : String(b[key]).localeCompare(String(a[key]));
      }
      return 0;
    });

    setFilteredClients(sorted);
  };

  useEffect(() => {
    setFilteredClients(data);
  }, [data]);
  return (
    <>
      <div className="flex w-full justify-between">
        <div>
          <p className="text-sm font-medium text-[#707EAE]">Admin</p>
          <p className="text-3xl font-medium">Client Management</p>
        </div>
        <div className="flex gap-5 rounded-full bg-white p-3 px-5">
          <div className="flex items-center gap-2 rounded-full bg-[#F4F7FE] p-2">
            <LuSearch size={18} />
            <input
              placeholder="Search"
              className="outline-none placeholder:font-medium"
            />
          </div>
          <div>
            <SelectN>
              <SelectTriggerN className="bg-primary gap-0 rounded-full border-none shadow-none">
                <p className="font-medium text-white">Generate Quote</p>
              </SelectTriggerN>
              <SelectContentN>
                <SelectItemN value="light">Light</SelectItemN>
                <SelectItemN value="dark">Dark</SelectItemN>
                <SelectItemN value="system">System</SelectItemN>
              </SelectContentN>
            </SelectN>
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
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiUsersThree size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Clients</p>
              <p className="text-xl">{filteredClients.length}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total pending payment</p>
              <p className="text-xl">INR 25,000</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-md bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium">Clients</p>
          <div>
            <button
              className="bg-primary hover:bg-primary flex cursor-pointer items-center gap-2 rounded-2xl p-2 px-4 font-medium text-white"
              onClick={() => [setIsOpen(true)]}
            >
              <IoMdAdd size={24}/> Create Client
            </button>
            <Modal
              open={isOpen}
              onClose={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
              width={1240}
              centered={true}
              footer={null}
            >
              <div className="text-lg font-medium">
                {formStatus == "New" ? "New Client" : "Edit Client"}
              </div>
              <form
                className="flex flex-wrap justify-between gap-5"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Client Name</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("name", { required: true })}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">
                        Client Name is required
                      </p>
                    )}
                    {!isClientNameAvailable && (
                      <p className="mt-1 text-sm text-red-500">
                        Client Name already exists, please try another one
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Client GSTIN</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("GSTIN", {
                        required: true,
                        minLength: 15,
                        maxLength: 15,
                      })}
                    />
                    {errors.GSTIN && (
                      <p className="mt-1 text-sm text-red-500">
                        Client GSTIN should be 15 digits
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Branch Name (Optional)</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("branchName")}
                    />
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("contactPerson", { required: true })}
                    />
                    {errors.contactPerson && (
                      <p className="mt-1 text-sm text-red-500">
                        Contact Person is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Email ID</label>
                    <input
                      type="email"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("email", { required: true })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        Email ID is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Contact Number</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("contactNumber", {
                        required: true,
                        minLength: 10,
                        maxLength: 10,
                      })}
                    />
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-500">
                        Contact Number should be 10 digits
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex flex-col gap-2">
                    <label>Address</label>
                    <textarea
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("address", { required: true })}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-500">
                        Address is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>City</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("city", { required: true })}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-500">
                        City is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>State</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("state", { required: true })}
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-500">
                        State is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[30%]">
                  <div className="flex flex-col gap-2">
                    <label>Pincode</label>
                    <input
                      type="number"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("pincode", {
                        required: true,
                        minLength: 4,
                      })}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-500">
                        Pincode is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[48%]">
                  <div className="flex flex-col gap-2">
                    <label>Pan</label>
                    <input
                      type="text"
                      className="border-primary rounded-md border p-1 py-2 pl-2"
                      {...register("panNumber", {
                        required: true,
                      })}
                    />
                    {errors.panNumber && (
                      <p className="mt-1 text-sm text-red-500">
                        Pan number is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[48%]">
                  <div className="flex flex-col gap-2">
                    <label>Credit limit</label>
                    <div className="border-primary flex items-center rounded-md border pl-2">
                      <p className="text-xs font-medium">INR</p>
                      <input
                        type="text"
                        placeholder="00000.00"
                        className="w-full p-2 outline-none"
                        {...register("creditLimit", {
                          required: true,
                        })}
                      />
                    </div>
                    {errors.creditLimit && (
                      <p className="mt-1 text-sm text-red-500">
                        Credit Limit is required
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex w-full justify-end">
                  <Button className="rounded-xl px-7" disabled={isloading}>
                    {isloading ? (
                      <VscLoading size={24} className="animate-spin" />
                    ) : formStatus === "New" ? (
                      "Create Client"
                    ) : (
                      "Update Client"
                    )}
                  </Button>
                </div>
              </form>
            </Modal>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>Client Name</p>
                <FaChevronDown
                  size={15}
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                />
              </th>
              <th className="text-start font-[400] text-[#797979]">City</th>
              <th className="text-start font-[400] text-[#797979]">
                Contact Person
              </th>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>Pending payment</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Client Since</p>
                  <FaChevronDown
                    size={15}
                    className="cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClients?.map((client) => (
              <tr
                className="hover:bg-accent cursor-pointer"
                key={client.id}
                onClick={() => [
                  setSelectedClient(client),
                  setIsClientDetailsModalOpen(true),
                ]}
              >
                <td className="py-2">{client.name}</td>
                <td className="py-2">{client.city}</td>
                <td className="py-2">{client.contactPerson}</td>
                <td className="py-2">INR 0</td>
                <td className="py-2">{client.createdAt.substring(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={isClientDetailsModalOpen}
        onOpenChange={setIsClientDetailsModalOpen}
      >
        <DialogTrigger className="hidden"></DialogTrigger>
        <DialogContent className="min-w-7xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-2xl">Client Details</DialogTitle>
            <div className="mr-10 flex gap-3">
              <button
                className="cursor-pointer"
                onClick={() => [
                  setClientDetails(selectedClient!),
                  setSelectedClient(selectedClient!),
                  setFormStatus("editing"),
                  setIsOpen(true),
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
                      Are you sure you want to remove this client? This action
                      is permanent and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                      onClick={() => onDeleteClientSubmit(selectedClient!)}
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
              <label className="font-medium">Client Name</label>
              <p>{selectedClient?.name}</p>
            </div>
            <div className="col-span-2 flex items-center gap-5">
              <label className="font-medium">Client GSTIN</label>
              <p>{selectedClient?.GSTIN}</p>
            </div>

            <div className="flex items-center gap-5">
              <label className="font-medium">Contact Person</label>
              <p>{selectedClient?.contactPerson}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Contact Number</label>
              <p>{selectedClient?.contactNumber}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Email id</label>
              <p>{selectedClient?.email}</p>
              <Popover>
                <PopoverTrigger className="cursor-pointer">
                  <TbCopy
                    size={20}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        selectedClient!.email.toString(),
                      )
                    }
                  />
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2">Copied!</PopoverContent>
              </Popover>
            </div>
            <div className="col-span-full flex flex-col items-start gap-2">
              <label className="font-medium">Address</label>
              <p>{selectedClient?.address}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Pin code</label>
              <p>{selectedClient?.pincode}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">City</label>
              <p>{selectedClient?.city}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">State</label>
              <p>{selectedClient?.state}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Pending payment</label>
              <p>INR 0</p>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-5 pr-10">
              <label className="font-medium">Credit Limit</label>
              <p>INR 0</p>
            </div>
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
                        <tr className="hover:bg-accent text-center">
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
      </Dialog>
    </>
  );
}
