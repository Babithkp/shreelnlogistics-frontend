import { Modal } from "antd";

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
import { createClientApi, createNotificationApi } from "@/api/admin";
import { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { PiUsersThree } from "react-icons/pi";
import { RiDeleteBin6Line, RiEditBoxLine } from "react-icons/ri";
import { TbCopy } from "react-icons/tb";
import { deleteClientApi, updateClientDetailsApi } from "@/api/branch";
import { ClientInputs } from "@/types";
import { LuSearch } from "react-icons/lu";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { filterClientByNameApi, getClientForPageApi } from "@/api/partner";
import { formatter } from "@/lib/utils";

export default function ClientManagement({ data }: { data: ClientInputs[] }) {
  const [isloading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<ClientInputs[]>(data.slice(0, 50));
  const [filteredClients, setFilteredClients] = useState<ClientInputs[]>(
    data.slice(0, 50),
  );
  const [originalClients, setOriginalClients] = useState<ClientInputs[]>(data);
  const [isClientNameAvailable, setIsClientNameAvailable] = useState(true);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] =
    useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientInputs>();
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [branch, setBranch] = useState({
    branchId: "",
    branchName: "",
    isAdmin: false,
  });


  const allRecords = selectedClient?.bill?.flatMap(
    (bill) => bill.PaymentRecords || [],
  );
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(data.length);
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
    setOriginalClients(data);
  }, [data]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientInputs>();

  async function filterClientByName(search: string) {
    const response = await filterClientByNameApi(search);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredClients(allTransactions);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredClients(clients);
      return;
    }
    filterClientByName(search);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredClients(clients);
    }
  }, [search]);

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
        fetchTransactions(currentPage, itemsPerPage);
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
        fetchTransactions(currentPage, itemsPerPage);
        if (!branch.isAdmin) {
          const notificationData = {
            requestId: selectedClient?.id,
            title: "Client edit",
            message: branch.branchName,
            description: selectedClient?.name,
            status: "editable",
          };
          await createNotificationApi(notificationData);
        }
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
      fetchTransactions(currentPage, itemsPerPage);
      setIsClientDetailsModalOpen(false);
      if (!branch.isAdmin) {
        const notificationData = {
          requestId: selectedClient?.id,
          title: "Client delete",
          message: branch.branchName,
          description: selectedClient?.name,
          status: "editable",
        };
        await createNotificationApi(notificationData);
      }
    } else {
      toast.error("Failed to Delete Client");
    }
  };

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

  async function fetchTransactions(page: number, limit: number) {
    const response = await getClientForPageApi(page, limit);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setClients(allTransactions.clientData);
      setFilteredClients(allTransactions.clientData);
      setTotalItems(allTransactions.clientCount);
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, itemsPerPage);
  }, [startIndex, endIndex]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetails = localStorage.getItem("branchDetails");
    if (isAdmin === "false" && branchDetails) {
      const branchData = JSON.parse(branchDetails);
      setBranch({
        branchId: branchData.id,
        branchName: branchData.branchName,
        isAdmin: false,
      });
    }
    fetchTransactions(currentPage, itemsPerPage);
  }, []);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiUsersThree size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Clients</p>
              <p className="text-xl">{originalClients.length}</p>
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
              <p className="text-xl">
                {formatter.format(
                  originalClients.reduce(
                    (acc, data) =>
                      acc +
                      data.bill.reduce(
                        (acc, bill) => acc + bill.pendingAmount,
                        0,
                      ),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex max-h-[73vh] flex-col gap-2 overflow-y-auto rounded-md bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-xl font-medium">Clients</p>
          <div className="flex items-center gap-5">
            <form className="flex items-center gap-5" onSubmit={handleSearch}>
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
            <button
              className="bg-primary hover:bg-primary flex cursor-pointer items-center gap-2 rounded-2xl p-2 px-4 font-medium text-white"
              onClick={() => [setIsOpen(true), reset(), setFormStatus("New")]}
            >
              <IoMdAdd size={24} /> Create Client
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
        <table className="w-full">
          <thead>
            <tr>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>Client Name</p>
              </th>
              <th className="text-start font-[400] text-[#797979]">City</th>
              <th className="text-start font-[400] text-[#797979]">
                Contact Person
              </th>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>Pending payment</p>
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Client Since</p>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClients?.map((client, i) => (
              <tr
                className="hover:bg-accent cursor-pointer"
                key={i}
                onClick={() => [
                  setSelectedClient(client),
                  setIsClientDetailsModalOpen(true),
                ]}
              >
                <td className="py-2">{client.name}</td>
                <td className="py-2">{client.city}</td>
                <td className="py-2">{client.contactPerson}</td>
                <td className="py-2">
                  {formatter.format(
                    client.bill.reduce(
                      (acc, bill) => (acc += bill.pendingAmount),
                      0,
                    ),
                  )}
                </td>
                <td className="py-2">
                  {new Date(client.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
              <p>INR {selectedClient?.bill.reduce((acc, bill) => acc + bill.pendingAmount, 0)}</p>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-5 pr-10">
              <label className="font-medium">Credit Limit</label>
              <p>INR {selectedClient?.creditLimit}</p>
            </div>
            <div className="col-span-full">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger className="bg-primary/30 px-4">
                    Recent Payments
                  </AccordionTrigger>
                  <AccordionContent className="bg-primary/30 max-h-[30vh] overflow-y-auto rounded-b-md px-2">
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
                        {allRecords?.map((record, index) => (
                          <tr
                            className="hover:bg-accent text-center"
                            key={record.id}
                          >
                            <td className="p-2">{index + 1}</td>
                            <td>INR {record.amount}</td>
                            <td>
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td>{record.paymentMode}</td>
                            <td>{record.transactionNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
