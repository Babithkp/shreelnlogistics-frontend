import {
  MdOutlineAdd,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
} from "react-icons/md";
import { Button } from "../ui/button";
import { Controller, useForm } from "react-hook-form";
import { Modal, Select } from "antd";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { RiDeleteBin6Line, RiEditBoxLine, RiUpload2Line } from "react-icons/ri";
import {
  createNotificationApi,
  getAllClientsApi,
  uploadLRFileApi,
} from "@/api/admin";
import { toast } from "react-toastify";
import {
  createPODApi,
  deletePODApi,
  filterPODByTextApi,
  getPodByPageApi,
  updatePODDetailsApi,
} from "@/api/pod";
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
import { ClientInputs, LrInputs } from "@/types";
import {
  filterOnlyCompletePrimitiveDiffs,
  getUnmatchingFields,
} from "@/lib/utils";
import { LuSearch } from "react-icons/lu";
import { getLRApi } from "@/api/shipment";
import axios from "axios";

export interface PODInputs {
  id: string;
  lrNumber: string;
  date: string;
  from: string;
  to: string;
  clientName: string;
  clientGSTIN: string;
  receivingDate: string;
  receivingBranch: string;
  documentLink: string;
  branchesId: string;
  adminId: string;
}
type Option = { value: string; label: string };

export default function Pod({
  data,
  onRefresh,
}: {
  data: {
    data: PODInputs[];
    count: number;
  };
  onRefresh: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"New" | "editing">("New");
  const [isLoading, setIsLoading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [client, setClient] = useState<ClientInputs[]>([]);
  const [isError, setIsError] = useState(false);
  const [file, setFile] = useState<File | null>();
  const [pods, setPods] = useState<PODInputs[]>(data.data);
  const [filteredPods, setFilteredPods] = useState<PODInputs[]>(data.data);
  const [selectedPOD, setSelectedPOD] = useState<PODInputs | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [branch, setBranch] = useState({
    isAdmin: false,
    branchId: "",
    branchName: "",
  });
  const [notificationAlertOpen, setNotificationAlertOpen] = useState(false);
  const [notificationData, setNotificationData] =
    useState<Record<string, any>>();
  const [search, setSearch] = useState("");
  const [LRList, setLRList] = useState<LrInputs[]>([]);
  const [totalItems, setTotalItems] = useState(data.count);
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

  useEffect(() => {
    if (branch.branchName) {
      setValue("receivingBranch", branch.branchName);
    }
  }, [branch]);

  function extractClientOptions(vendors: ClientInputs[]): Option[] {
    return vendors.map((vendor) => ({
      value: vendor.name,
      label: vendor.name,
    }));
  }
  const setClientData = (data: ClientInputs) => {
    setValue("clientGSTIN", data.GSTIN);
  };

  const coursebyInputHandler = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const file = files[0];
      setFile(file);
    }
  };

  async function filterPODByText(text: string, branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await filterPODByTextApi(text, branchIdToBeUsed);
    if (response?.status === 200) {
      const filtered = response.data.data;
      setFilteredPods(filtered);
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredPods(pods);
      return;
    }
    filterPODByText(search);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredPods(pods);
    }
  }, [search]);

  const setPODDetails = (data: string) => {
    const lr = LRList.find((lr) => lr.lrNumber === data);
    if (lr) {
      setValue("from", lr.from);
      setValue("to", lr.to);
      setValue("clientName", lr.client.name);
      setValue("date", lr.date);
      setValue("clientGSTIN", lr.client.GSTIN);
    }
  };

  const {
    handleSubmit,
    register,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<PODInputs>({
    defaultValues: {
      receivingDate: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: PODInputs) => {
    setIsLoading(true);
    if (branch.isAdmin) {
      data.adminId = branch.branchId;
    } else {
      data.branchesId = branch.branchId;
    }
    if (formStatus === "editing" && file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await uploadLRFileApi(formData);
      if (uploadResponse?.status === 200) {
        toast.success("File has been uploaded successfully");
        data.documentLink = uploadResponse.data.data[0].url;

        if (!branch.isAdmin) {
          setIsOpen(false);
          setNotificationData(
            filterOnlyCompletePrimitiveDiffs(
              getUnmatchingFields(data, selectedPOD!),
            ),
          );
          setIsLoading(false);
          setNotificationAlertOpen(true);
          return;
        }

        const response = await updatePODDetailsApi(data, selectedPOD?.id!);
        if (response?.status === 200) {
          toast.success("POD has been updated");
          reset();
          setIsOpen(false);
          if (isAdmin) {
            getPODByPage(currentPage, itemsPerPage);
          } else if (!isAdmin && branch.branchId) {
            getPODByPage(currentPage, itemsPerPage, branch.branchId);
          }
        } else {
          toast.error("Something Went Wrong, Check All Fields");
        }
      }
    } else if (formStatus === "editing" && !file) {
      if (!branch.isAdmin) {
        setIsOpen(false);
        setNotificationData(
          filterOnlyCompletePrimitiveDiffs(
            getUnmatchingFields(data, selectedPOD!),
          ),
        );
        setIsLoading(false);
        setNotificationAlertOpen(true);
        return;
      }
      const response = await updatePODDetailsApi(data, selectedPOD?.id!);
      if (response?.status === 200) {
        toast.success("POD has been updated");
        reset();
        setIsOpen(false);
        if (isAdmin) {
          getPODByPage(currentPage, itemsPerPage);
        } else if (!isAdmin && branch.branchId) {
          getPODByPage(currentPage, itemsPerPage, branch.branchId);
        }
      } else {
        toast.error("Something Went Wrong, Check All Fields");
      }
    } else {
      if (!file) {
        setIsError(true);
        setTimeout(() => {
          setIsError(false);
        }, 2000);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await uploadLRFileApi(file);
      if (uploadResponse?.status === 200) {
        const upload = await axios.put(
          uploadResponse.data.data.uploadUrl,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        if (upload.status === 200) {
          toast.success("File has been uploaded successfully");
          data.documentLink = uploadResponse?.data.data.fileUrl;
          const response = await createPODApi(data);
          if (response?.status === 200) {
            toast.success("POD has been created");
            setIsOpen(false);
            if (isAdmin) {
              getPODByPage(currentPage, itemsPerPage);
            } else if (!isAdmin && branch.branchId) {
              getPODByPage(currentPage, itemsPerPage, branch.branchId);
            }
            onRefresh();
            setFile(null);
            reset({
              receivingBranch: branch.branchName,
            });
          } else {
            toast.error("Something Went Wrong, Check All Fields");
          }
        }
      }
    }
    setIsLoading(false);
  };

  const onPodEditNotificationSubmit = async () => {
    const data = {
      requestId: selectedPOD?.lrNumber,
      title: "POD edit",
      message: branch.branchName,
      description: branch.branchId,
      status: "editable",
      data: JSON.stringify(notificationData),
      fileId: selectedPOD?.id,
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
      setNotificationAlertOpen(false);
      if (isAdmin) {
        getPODByPage(currentPage, itemsPerPage);
      } else if (!isAdmin && branch.branchId) {
        getPODByPage(currentPage, itemsPerPage, branch.branchId);
      }
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setNotificationAlertOpen(false);
  };

  const onDeletePodHandlerOnNotification = async (pod: PODInputs) => {
    const data = {
      requestId: pod.lrNumber,
      title: "POD delete",
      message: branch?.branchName,
      description: branch.branchId,
      status: "delete",
      fileId: pod.id,
    };
    const response = await createNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Request has been sent to admin");
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const onDeletePodHandler = async () => {
    if (selectedPOD) {
      await deletePod(selectedPOD?.id);
    }
  };

  const setValuesToInputs = (data: PODInputs) => {
    setValue("lrNumber", data.lrNumber);
    setValue("date", data.date);
    setValue("from", data.from);
    setValue("to", data.to);
    setValue("clientName", data.clientName);
    setValue("clientGSTIN", data.clientGSTIN);
    setValue("receivingDate", data.receivingDate);
    setValue("receivingBranch", data.receivingBranch);
    setValue("documentLink", data.documentLink);
  };

  async function deletePod(id: string) {
    const response = await deletePODApi(id);
    if (response?.status === 200) {
      toast.success("POD Deleted");
      if (isAdmin) {
        getPODByPage(currentPage, itemsPerPage);
      } else if (!isAdmin && branch.branchId) {
        getPODByPage(currentPage, itemsPerPage, branch.branchId);
      }
      setIsDetailsModalOpen(false);
    } else {
      toast.error("Failed to Delete POD");
    }
  }

  async function fetchLRs() {
    const response = await getLRApi();
    if (response?.status === 200) {
      setLRList(
        response.data.data.filter(
          (lr: any) => !Array.isArray(lr.pod) || lr.pod.length === 0,
        ),
      );
    }
  }

  async function fetchClients() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setClient(response.data.data);
    }
  }

  async function getPODByPage(page: number, limit: number, branchId?: string) {
    let branchIdToBeUsed = null;
    if (branchId) {
      branchIdToBeUsed = branchId;
    }
    const response = await getPodByPageApi(page, limit, branchIdToBeUsed);
    if (response?.status === 200) {
      const allPods = response.data.data;
      setPods(allPods.PODData);
      setFilteredPods(allPods.PODData);
      setTotalItems(allPods.PODCount);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      getPODByPage(currentPage, itemsPerPage);
    } else if (!isAdmin && branch.branchId) {
      getPODByPage(currentPage, itemsPerPage, branch.branchId);
    }
  }, [startIndex, endIndex]);

  useEffect(() => {
    if (isAdmin) {
      getPODByPage(currentPage, itemsPerPage);
    } else if (!isAdmin && branch.branchId) {
      getPODByPage(currentPage, itemsPerPage, branch.branchId);
    }
  }, [isAdmin, branch.branchId]);

  useEffect(() => {
    if (branch?.branchName) {
      setValue("receivingBranch", branch.branchName);
    }
  }, [branch, setValue]);

  useEffect(() => {
    fetchClients();
    fetchLRs();
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);

      if (isAdmin === "true") {
        setIsAdmin(true);
        setBranch({
          branchId: branchDetails.id,
          branchName: branchDetails.branchName,
          isAdmin: true,
        });
      } else {
        setIsAdmin(false);
        setBranch({
          branchId: branchDetails.id,
          branchName: branchDetails.branchName,
          isAdmin: false,
        });
      }
    }
  }, []);

  return (
    <div className="relative">
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
      <section className="relative flex h-fit max-h-[83vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
        <div className={`flex items-center justify-between`}>
          <p className="text-xl font-medium">POD</p>
          <div className="flex items-center gap-5">
            <Button
              className="bg-primary hover:bg-primary cursor-pointer rounded-2xl p-5"
              onClick={() => [
                setIsOpen(true),
                reset({
                  receivingBranch: branch.branchName,
                }),
                setSelectedPOD(null),
                setFormStatus("New"),
                setFile(null),
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

        
        <table className="w-full">
          <thead>
            <tr>
              <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                <p>LR#</p>
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Client Name</p>
                </div>
              </th>
              <th className="text-start font-[400] text-[#797979]">
                <div className="flex items-center gap-2">
                  <p>Receiving Date</p>
                </div>
              </th>
              <th className="text-start font-[400] text-[#797979]">LR Date</th>
              <th className="font-[400] text-[#797979]">Time taken</th>
            </tr>
          </thead>
          <tbody>
            {filteredPods?.map((pod) => (
              <tr
                key={pod.id}
                className="hover:bg-accent cursor-pointer"
                onClick={() => [
                  setSelectedPOD(pod),
                  setIsDetailsModalOpen(true),
                ]}
              >
                <td className="py-2">{pod.lrNumber}</td>
                <td className="py-2">{pod.clientName}</td>
                <td className="py-2">{pod.receivingDate}</td>
                <td className="py-2">
                  {new Date(pod.date).toLocaleDateString()}
                </td>
                <td className="py-2 text-center">
                  {Math.floor(
                    (new Date(pod.receivingDate).getTime() -
                      new Date(pod.date).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
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
            {formStatus === "New" ? "Create POD" : "Edit POD"}
          </p>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>LR#</label>
              <Controller
                name="lrNumber"
                control={control}
                defaultValue={""}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    placeholder="Select LR"
                    onChange={(value) => {
                      field.onChange(value);
                      setPODDetails(value);
                    }}
                    showSearch
                    options={LRList.map((lr) => ({
                      value: lr.lrNumber,
                      label: lr.lrNumber,
                    }))}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
              {errors.lrNumber && (
                <p className="text-red-500">LR# is required</p>
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
              {errors.date && <p className="text-red-500">Date is required</p>}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>From</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("from", { required: true })}
              />
              {errors.from && <p className="text-red-500">From is required</p>}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>TO</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("to", { required: true })}
              />
              {errors.to && <p className="text-red-500">To is required</p>}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Client Name</label>
              <Controller
                name="clientName"
                control={control}
                defaultValue={""}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    placeholder="Select Client"
                    onChange={(value) => {
                      field.onChange(value);
                      const selectedClient = client.find(
                        (v) => v.name === value,
                      );
                      if (selectedClient) {
                        setClientData(selectedClient);
                      }
                    }}
                    showSearch
                    options={extractClientOptions(client)}
                    style={{
                      border: "1px solid #64BAFF",
                      borderRadius: "10px",
                    }}
                  />
                )}
              />
              {errors.clientName && (
                <p className="text-red-500">Client Name is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Client GSTIN</label>
              <input
                type="text"
                className="border-primary rounded-md border p-2"
                {...register("clientGSTIN", { required: true })}
              />
              {errors.clientGSTIN && (
                <p className="text-red-500">Client GSTIN is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Receiving Date</label>
              <input
                type="date"
                className="border-primary rounded-md border p-2"
                {...register("receivingDate", { required: true })}
              />
              {errors.receivingDate && (
                <p className="text-red-500">Receiving Date is required</p>
              )}
            </div>
          </div>
          <div className="w-[23%]">
            <div className="flex flex-col gap-2">
              <label>Receiving Branch</label>
              <input
                className="border-primary cursor-not-allowed rounded-md border p-2"
                {...register("receivingBranch", { required: true })}
                disabled
                value={branch.branchName}
              />
              {errors.receivingBranch && (
                <p className="text-red-500">Receiving Branch is required</p>
              )}
            </div>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-2">
              <label>Upload Document</label>
              <input
                type="file"
                className="hidden"
                ref={uploadRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={coursebyInputHandler}
              />
              <button
                type="button"
                className="border-primary flex flex-col items-center justify-center gap-5 rounded-md border p-3"
                onClick={() => uploadRef.current?.click()}
              >
                <RiUpload2Line size={40} className="text-primary" />
                <p className="text-slate-500">
                  {file
                    ? file.name
                    : "Upload POD (only .pdf, jpeg, jpg and png allowed)"}
                </p>
              </button>
              {isError && <p className="text-red-500">Document is required</p>}
            </div>
          </div>
          <div className="flex w-full justify-end gap-5">
            <Button className="rounded-xl px-7" disabled={isLoading}>
              {isLoading ? (
                <VscLoading size={24} className="animate-spin" />
              ) : formStatus === "New" ? (
                "Create POD"
              ) : (
                "Update POD"
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
              POD - LR#{selectedPOD?.lrNumber}
            </DialogTitle>
            <div className="mr-10 flex gap-3">
              <button
                className="cursor-pointer"
                onClick={() => [
                  setFormStatus("editing"),
                  setValuesToInputs(selectedPOD!),
                  setIsDetailsModalOpen(false),
                  setIsOpen(true),
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
                        onClick={() =>
                          onDeletePodHandlerOnNotification(selectedPOD!)
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
                        Are you sure you want to remove this POD? This action is
                        permanent and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#FF4C4C] hover:bg-[#FF4C4C]/50"
                        onClick={onDeletePodHandler}
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
              <label className="font-medium">LR#</label>
              <p>{selectedPOD?.lrNumber}</p>
            </div>
            <div className="col-span-2 flex items-center gap-5">
              <label className="font-medium">LR Date</label>
              <p>{selectedPOD?.date}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Client Name</label>
              <p>{selectedPOD?.clientName}</p>
            </div>
            <div className="flex items-center gap-5">
              <label className="font-medium">Contact GSTIN</label>
              <p>{selectedPOD?.clientGSTIN}</p>
            </div>
            <div className="flex items-start gap-2">
              <label className="font-medium">To</label>
              <p>{selectedPOD?.to}</p>
            </div>
            <div className="flex items-start gap-5">
              <label className="font-medium">From</label>
              <p>{selectedPOD?.from}</p>
            </div>
            <div className="flex items-start gap-5">
              <label className="font-medium">Receiving Date</label>
              <p>{selectedPOD?.receivingDate}</p>
            </div>
            <div className="flex items-start gap-5">
              <label className="font-medium">Receiving Branch</label>
              <p>{selectedPOD?.receivingBranch}</p>
            </div>

            <div className="col-span-3 flex flex-col gap-3">
              <label className="font-medium">Attachments</label>
              <a
                className="rounded-md bg-slate-200 p-2 font-medium hover:bg-slate-100"
                href={selectedPOD?.documentLink}
                onClick={() => {
                  toast.success("File has been downloaded successfully");
                }}
              >
                LR# {selectedPOD?.lrNumber}
                <span className="ml-5 text-slate-400">(Click to Download)</span>
              </a>
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
            <AlertDialogAction onClick={onPodEditNotificationSubmit}>
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
