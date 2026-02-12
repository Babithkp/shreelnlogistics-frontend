import { useEffect, useState } from "react";
import { BiBell } from "react-icons/bi";
import { FiSettings } from "react-icons/fi";
import { BranchDetails } from "./shipment/FM/FMPage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Notification, SectionsState } from "@/types";
import {
  deleteNotificationApi,
  getAllAdminNotificationsApi,
  updateNotificationApi,
} from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeByAgo } from "@/lib/utils";
import { IoRefreshOutline } from "react-icons/io5";
import {
  deleteFMByNotificationApi,
  deleteFMRecordByNotificationApi,
  deleteLRByNotificationApi,
  updateFMByNotificationApi,
  updateLRByNotificationApi,
  updateRecordPaymentByNotificationApi,
} from "@/api/shipment";
import { toast } from "react-toastify";
import {
  createNotificationForBranchApi,
  getBranchNotificationsApi,
} from "@/api/branch";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  deleteBillByNotificationApi,
  deleteBillRecordByNotificationApi,
  updateBillByNotificationApi,
  updateBillRecordByNotificationApi,
} from "@/api/billing";
import {
  deleteCreditByNotificationApi,
  deleteExpenseByNotificationApi,
  updateCreditByNotificationApi,
  updateExpenseByNotificationApi,
} from "@/api/expense";
import {
  deletePODByNotificationApi,
  updatePODByNotificationApi,
} from "@/api/pod";

const sectionLabels: Record<keyof SectionsState, string> = {
  dashboard: "Dashboard",
  LR: "Lorry Receipts",
  FM: "Freight Management",
  Bill: "Billing",
  vendor: "Vendor Management",
  client: "Client Management",
  outstanding: "Outstanding",
  branch: "Branches",
  expenses: "Expenses",
  statements: "Statements",
  pod: "POD",
  settings: "Settings",
  reports: "Reports",
};

type NotificationConfig = {
  getTitle: (n: Notification) => string;
  getDescription?: (n: Notification) => string;
  requiresApproval: boolean;
  onApprove?: (n: Notification) => Promise<void>;
  onDecline?: (n: Notification) => Promise<void>;
  showNotedButton?: boolean;
};



export default function Header({
  title,
  setSections,
  onFresh,
}: {
  title: SectionsState;
  setSections?: (value: SectionsState) => void;
  onFresh?: () => void;
}) {
  const activeSection = Object.entries(title).find(
    ([_, isActive]) => isActive,
  )?.[0] as keyof SectionsState;

  const [isAdmin, setIsAdmin] = useState(false);
  const [branchDetails, setBranchDetails] = useState<BranchDetails>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNewNotification, setIsNewNotification] = useState({
    status: false,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const reFreshHandler = async () => {
    setIsLoading(true);
    setTimeout(() => {
      onFresh && onFresh();
      if (isAdmin) {
        fetchAdminNotifications();
      } else {
        fetchBranchNotifications(branchDetails!.id);
      }
      setIsLoading(false);
    }, 2000);
  };

  const deleteNotificationHandler = async (id: string) => {
    setIsLoading(true);
    const response = await deleteNotificationApi(id);
    if (response?.status === 200) {
      if (isAdmin) {
        fetchAdminNotifications();
      } else {
        fetchBranchNotifications(branchDetails!.id);
      }
    }
    setIsLoading(false);
  };

  const changeToReadHandler = async () => {
    const unread = notifications.filter(n => n.status !== "read");

    await Promise.all(
      unread.map(n =>
        changeNotificationStatusHandler(n.id, "read"),
      ),
    );
  };


  const changeNotificationStatusHandler = async (
    id: string,
    status: string,
  ) => {
    const response = await updateNotificationApi(id, status);
    if (response?.status === 200) {
      if (isAdmin) {
        fetchAdminNotifications();
      } else {
        fetchBranchNotifications(branchDetails!.id);
      }
    }
  };

  async function fetchAdminNotifications() {
    const response = await getAllAdminNotificationsApi();
    if (response?.status === 200) {
      setNotifications(response.data.data);
      console.log(response.data.data);
      const oneTimeMessages = response.data.data.filter(
        (message: Notification) => message.status !== "read",
      );
      const count = oneTimeMessages.length;
      if (count > 0) {
        setIsNewNotification({
          status: true,
          count,
        });
      } else {
        setIsNewNotification({
          status: false,
          count,
        });
      }
    }
  }

  async function fetchBranchNotifications(branchId: string) {
    setIsLoading(true);
    const response = await getBranchNotificationsApi(branchId);
    if (response?.status === 200) {
      setNotifications(response.data.data);
      console.log(response.data.data);
      const oneTimeMessages = response.data.data.filter(
        (message: Notification) => message.status !== "read",
      );
      const count = oneTimeMessages.length;
      if (count > 0) {
        setIsNewNotification({
          status: true,
          count,
        });
      } else {
        setIsNewNotification({
          status: false,
          count,
        });
      }
    }
    setIsLoading(false);
  }

  function formatForUpdate(diffObj: Record<string, any>) {
    const formatted: Record<string, any> = {};

    for (const [key, value] of Object.entries(diffObj)) {
      if (value?.obj1 !== undefined && value?.obj1 !== null) {
        formatted[key] = value.obj1;
      }
    }

    return { data: formatted };
  }

  const onDeclineHandler = async (notification: Notification) => {
    const data = {
      requestId: notification.requestId,
      entityType: notification.entityType,
      actionType: "decline",
      createdByRole: notification.createdByRole,
      createdById: notification.createdById,
      data: null,
      status: "declined"
    };

    setIsLoading(true);
    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const onLRUpdateHandler = async (
    id: string,
    data: JSON,
    notificationId: string,
  ) => {
    const apiData = {
      data: formatForUpdate(data),
      lrNumber: id,
    };
    setIsLoading(true);
    const response = await updateLRByNotificationApi(apiData);
    if (response?.status === 200) {
      toast.success("Data Updated");
      await deleteNotificationHandler(notificationId);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };


  const onFMEditUpdateHandler = async (
    id: string,
    data: JSON,
    notificationId: string,
  ) => {
    setIsLoading(true);
    const response = await updateFMByNotificationApi(id, data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notificationId);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const onFMDeleteHandler = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deleteFMByNotificationApi(notification.requestId);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const onLRDeleteHandler = async (notification: Notification) => {
    const data = {
      id: notification.requestId,
    };
    setIsLoading(true);
    const response = await deleteLRByNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const editFMRecordPaymentOnNotification = async (
    notification: Notification,
  ) => {

    const data = formatForUpdate(notification.data!);
    const response = await updateRecordPaymentByNotificationApi(
      notification.requestId,
      (notification.data as any).id,
      data,
    );
    if (response?.status === 200) {
      toast.success("Data Updated");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deleteFMRecordByNotification = async (notification: Notification) => {
    const response = await deleteFMRecordByNotificationApi(
      notification.requestId,
      notification.data as any,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      false;
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };


  const updateBillByNotification = async (notification: Notification) => {
    const billId = notification.requestId;
    const data = {
      billId,
      data: notification.data,
    };
    setIsLoading(true);
    const response = await updateBillByNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      setIsLoading(false);
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };


  const deleteBillByNotification = async (notification: Notification) => {
    const data = {
      billId: notification.requestId,
    };
    setIsLoading(true);
    const response = await deleteBillByNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");

      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const updateBillRecordByNotification = async (notification: Notification) => {

    const data = {
      data: formatForUpdate(notification.data!).data,
      billId: notification.requestId,
      id: (notification.data! as any).id,
    };
    setIsLoading(true);
    const response = await updateBillRecordByNotificationApi(data);
    if (response?.status === 200) {
      toast.success("Data Updated");

      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const deleteBillRecordByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deleteBillRecordByNotificationApi(
      (notification.data as any),
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };


  const updateCreditByNotification = async (notification: Notification) => {
    const data = formatForUpdate(notification.data!);
    setIsLoading(true);
    const response = await updateCreditByNotificationApi(
      notification.requestId,
      data,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };
  const updateExpensesByNotification = async (notification: Notification) => {
    const data = formatForUpdate(notification.data!);
    setIsLoading(true);
    const response = await updateExpenseByNotificationApi(
      notification.requestId,
      data,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const deleteCreditByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deleteCreditByNotificationApi(
      notification.requestId,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };
  const deleteExpenseByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deleteExpenseByNotificationApi(
      notification.requestId,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const updatePodByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await updatePODByNotificationApi(
      formatForUpdate(notification.data!),
      notification.requestId,
    );
    if (response?.status === 200) {
      toast.success("Data Updated");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };


  const deletePodByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deletePODByNotificationApi(notification.requestId);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };


  const notificationConfig: Record<string, NotificationConfig> = {
    "Credit Limit:info": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Alert - Credit Limit exceeded for ${n.createdByRole}`,
    },

    "Outstanding limit:info": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Alert - Outstanding limit exceeded for ${n.createdByRole}`,
    },

    "LR:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete LR (LR No. ${n.requestId})`,
      getDescription: () =>
        `Are you sure you want to remove this Lorry Receipt ? This action is permanent and cannot be undone.`,
      onApprove: onLRDeleteHandler,
      onDecline: onDeclineHandler,
    },

    "LR:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit LR (LR No. ${n.requestId})`,
      onApprove: (n) =>
        onLRUpdateHandler(n.requestId, n.data!, n.id),
      onDecline: onDeclineHandler,
    },

    "LR:decline": {
      requiresApproval: false,
      showNotedButton: true,

      getTitle: (n) =>
        `Request for LR (LR No. ${n.requestId}) was declined`,
    },

    "LR:approved": {
      requiresApproval: false,
      showNotedButton: true,

      getTitle: (n) =>
        `Request for LR (LR No. ${n.requestId}) was approved`,
    },

    "FM:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete FM (FM No. ${n.requestId})`,
      getDescription() {
        return `Are you sure you want to delete this Freight Memo ? This action is permanent and cannot be undone.`;
      },
      onApprove: onFMDeleteHandler,
      onDecline: onDeclineHandler,
    },

    "FM:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit FM (FM No. ${n.requestId})`,
      onApprove: (n) =>
        onFMEditUpdateHandler(n.requestId, n.data!, n.id),
      onDecline: onDeclineHandler,
    },

    "FM:approved": {
      requiresApproval: false,
      showNotedButton: true,

      getTitle: (n) =>
        `Request for FM (FM No. ${n.requestId}) was approved`,
    },
    "FM:decline": {
      requiresApproval: false,
      showNotedButton: true,

      getTitle: (n) =>
        `Request for FM (FM No. ${n.requestId}) was declined`,
    },


    "Bill:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete Bill (Bill No. ${n.requestId})`,
      getDescription() {
        return `Are you sure you want to delete this Bill ? This action is permanent and cannot be undone.`;
      },
      onApprove: deleteBillByNotification,
      onDecline: onDeclineHandler,
    },

    "Bill:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit Bill (Bill No. ${n.requestId})`,
      onApprove: updateBillByNotification,
      onDecline: onDeclineHandler,
    },
    "Bill:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Bill (Bill No. ${n.requestId}) was approved`,
    },
    "Bill:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Bill (Bill No. ${n.requestId}) was declined`,
    },

    "POD:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit POD (LR No. ${n.requestId})`,
      onApprove: updatePodByNotification,
      onDecline: onDeclineHandler,
    },

    "POD:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete POD (LR No. ${n.requestId})`,
      getDescription: () =>
        `Are you sure you want to remove this POD ? This action is permanent and cannot be undone.`,
      onApprove: deletePodByNotification,
      onDecline: onDeclineHandler,
    },

    "POD:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for POD (LR No. ${n.requestId}) was approved`,
    },
    "POD:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for POD (LR No. ${n.requestId}) was declined`,
    },

    "Credit:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete Credit (Credit No. ${n.requestId})`,
      getDescription: () =>
        `Are you sure you want to remove this Credit ? This action is permanent and cannot be undone.`,
      onApprove: deleteCreditByNotification,
      onDecline: onDeclineHandler,
    },
    "Credit:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit Credit (Credit No. ${n.requestId})`,
      onApprove: updateCreditByNotification,
      onDecline: onDeclineHandler,
    },
    "Credit:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Credit (Credit No. ${n.requestId}) was approved`,
    },
    "Credit:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Credit (Credit No. ${n.requestId}) was declined`,
    },

    "Expense:delete": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to delete Expense (Expense No. ${n.requestId})`,
      getDescription: () =>
        `Are you sure you want to remove this Expense ? This action is permanent and cannot be undone.`,
      onApprove: deleteExpenseByNotification,
      onDecline: onDeclineHandler,
    },
    "Expense:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit Expense (Expense No. ${n.requestId})`,
      onApprove: updateExpensesByNotification,
      onDecline: onDeclineHandler,
    },
    "Expense:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Expense (Expense No. ${n.requestId}) was approved`,
    },
    "Expense:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Expense (Expense No. ${n.requestId}) was declined`,
    },

    "Bill record:delete": {
      requiresApproval: true,
      getDescription: () => "This Action will delete the Bill record. Are you sure you want to delete this Bill record? This action is permanent and cannot be undone.",
      getTitle: (n) =>
        `Request to delete Bill record (Bill No. ${n.requestId})`,
      onApprove: deleteBillRecordByNotification,
      onDecline: onDeclineHandler,
    },
    "Bill record:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit Bill record (Bill No. ${n.requestId})`,
      onApprove: updateBillRecordByNotification,
      onDecline: onDeclineHandler,
    },
    "Bill record:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Bill record (Bill No. ${(n.data as any).id}) was approved`,
    },
    "Bill record:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for Bill record (Bill No. ${(n.data as any).id}) was declined`,
    },

    "FM record:delete": {
      requiresApproval: true,
      getDescription: () => "This Action will delete the FM record. Are you sure you want to delete this FM record? This action is permanent and cannot be undone.",
      getTitle: (n) =>
        `Request to delete FM record (FM No. ${n.requestId})`,
      onApprove: deleteFMRecordByNotification,
      onDecline: onDeclineHandler,
    },
    "FM record:edit": {
      requiresApproval: true,
      getTitle: (n) =>
        `Request to edit FM record (FM No. ${n.requestId})`,
      onApprove: editFMRecordPaymentOnNotification,
      onDecline: onDeclineHandler,
    },
    "FM record:approved": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for FM record (FM No. ${(n.data as any).id}) was approved`,
    },
    "FM record:decline": {
      requiresApproval: false,
      showNotedButton: true,
      getTitle: (n) =>
        `Request for FM record (FM No. ${(n.data as any).id}) was declined`,
    },
  };



  function NotificationDetailsTable({
    notification,
  }: {
    notification: Notification;
  }) {
    if ((notification.entityType === "Bill record" || notification.entityType === "FM record") && notification.actionType === "delete") {
      return null;
    }

    return (
      <>
        {notification.entityType === "FM" || notification.entityType === "Bill" ?
          <table className="w-full">
            <thead>
              <tr className="bg-black/60 text-white">
                <th className="px-2 ">Sl no.</th>
                <th className="text-center">Field</th>
                <th className="text-center">New</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(notification.data as Record<string, any>).map(
                ([key, value], index) => (
                  <tr key={key}>
                    <td className="text-center">{index + 1}</td>
                    <td className="capitalize text-center">{key}</td>
                    <td className="text-center">
                      {key === "LRDetails" || key === "lrData" || key === "Client" ? typeof value === "object" &&
                        value !== null
                        ? Array.isArray(value)
                          ? value?.map(
                            (
                              item: any,
                              idx: number,
                            ) => (
                              <div key={idx}>
                                LR#
                                {item.lrNumber ||
                                  JSON.stringify(item)}
                              </div>
                            ),
                          )
                          : Object?.entries(value)
                            ?.map(
                              ([k, v]) => `${k}: ${v}`,
                            )
                            .join(", ")
                        : String(value) : String(value ?? "")}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          :
          <table className="w-full">
            <thead>
              <tr className="bg-black/60 text-white">
                <th className="px-2">Sl no.</th>
                <th>Field</th>
                <th>Old</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(notification.data as Record<string, any>).map(
                ([key, value], index) => (
                  <>
                    {key !== "id" && (<tr key={key}>
                      <td className="text-center">{index + 1}</td>
                      <td className="capitalize text-center">{key}</td>
                      <td className="text-center">
                        {String(value?.obj2 ?? "")}
                      </td>
                      <td className="text-center">
                        {String(value?.obj1 ?? "")}
                      </td>
                    </tr>)}
                  </>
                ),
              )}
            </tbody>
          </table>
        }
      </>
    );
  }




  useEffect(() => {
    const branchDetails = localStorage.getItem("branchDetails");
    if (!branchDetails) {
      return;
    }
    const branch = JSON.parse(branchDetails);
    setBranchDetails(branch);
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "true") {
      setIsAdmin(true);
      fetchAdminNotifications();
    } else {
      fetchBranchNotifications(branch.id);
    }
  }, []);

  return (
    <section className="flex w-full justify-between pb-5">
      <div>
        <p className="text-sm font-medium text-[#707EAE]">
          {isAdmin ? "Admin" : branchDetails?.branchName}
        </p>
        <p className="text-3xl font-medium capitalize">
          {sectionLabels[activeSection]}
        </p>
      </div>
      <div className="flex items-center gap-5 rounded-full bg-white p-3 px-5">
        <div className="flex items-center gap-2 rounded-full"></div>
        {isAdmin && (
          <button
            className="cursor-pointer"
            onClick={() =>
              setSections &&
              setSections({
                dashboard: false,
                LR: false,
                FM: false,
                Bill: false,
                outstanding: false,
                branch: false,
                expenses: false,
                statements: false,
                vendor: false,
                client: false,
                pod: false,
                reports: false,
                settings: true,
              })
            }
          >
            <FiSettings size={22} color="#A3AED0" />
          </button>
        )}
        <Popover onOpenChange={changeToReadHandler}>
          <PopoverTrigger className="flex cursor-pointer items-center">
            <BiBell size={24} color="#A3AED0" />
            {isNewNotification.status && (
              <Badge>{isNewNotification.count}</Badge>
            )}
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto bg-[#F0F8FF]"
          >
            {notifications.map((notification) => {
              const configKey = `${notification.entityType}:${notification.actionType}`;
              const config = notificationConfig[configKey];

              if (!config) return null;

              const isTerminalAction =
                notification.actionType === "info" ||
                notification.actionType === "decline" ||
                notification.actionType === "approved";

              const showNotedButton =
                config.showNotedButton === true || isTerminalAction;

              const showApprovalFlow =
                config.requiresApproval === true && !isTerminalAction;

              return (
                <div
                  key={notification.id}
                  className="flex flex-col gap-2 rounded-md bg-white p-3"
                >
                  {/* CREATED BY */}
                  <p className="text-sm font-medium">
                    {notification.createdByRole}
                  </p>

                  {/* TITLE */}
                  <p className="text-xs font-medium text-blue-500">
                    {config.getTitle(notification)}
                  </p>

                  {/* DECLINED MESSAGE */}
                  {notification.actionType === "decline" && (
                    <p className="text-xs font-medium text-red-500">
                      Admin has declined this request
                    </p>
                  )}

                  <div className="flex w-full items-center justify-between">
                    {/* TIME */}
                    <p className="text-xs text-slate-500">
                      {formatDateTimeByAgo(
                        new Date(notification.createdAt),
                      )}
                    </p>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      {/* NOTED */}
                      {showNotedButton && (
                        <Button
                          className="p-1 px-2 text-sm"
                          onClick={() =>
                            deleteNotificationHandler(notification.id)
                          }
                          disabled={isLoading}
                        >
                          Noted
                        </Button>
                      )}

                      {/* APPROVAL FLOW */}
                      {showApprovalFlow && (
                        <Dialog>
                          <DialogTrigger className="cursor-pointer rounded-lg p-1 px-2 text-sm outline">
                            View details
                          </DialogTrigger>

                          <DialogContent className="max-h-[80%] overflow-y-auto min-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                {config.getTitle(notification)}
                              </DialogTitle>

                              {config.getDescription && (
                                <DialogDescription className="text-sm font-medium text-black">
                                  {config.getDescription(notification)}
                                </DialogDescription>
                              )}

                              {notification.data && (
                                <NotificationDetailsTable
                                  notification={notification}
                                />
                              )}
                            </DialogHeader>

                            <DialogFooter>
                              {config.onDecline && (
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    config.onDecline?.(notification)
                                  }
                                  disabled={isLoading}
                                >
                                  Decline
                                </Button>
                              )}

                              {config.onApprove && (
                                <Button
                                  onClick={() =>
                                    config.onApprove?.(notification)
                                  }
                                  disabled={isLoading}
                                >
                                  Approve
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                No Notifications
              </p>
            )}
          </PopoverContent>
        </Popover>




        <button
          className="bg-primary size-fit cursor-pointer rounded-full p-1"
          onClick={() => [reFreshHandler()]}
        >
          <IoRefreshOutline
            color="white"
            size={24}
            className={`transition-all duration-1000 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </section>
  );
}
