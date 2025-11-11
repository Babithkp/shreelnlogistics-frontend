import { useEffect, useState } from "react";
import { BiBell } from "react-icons/bi";
import { FiSettings } from "react-icons/fi";
import { BranchDetails } from "./shipment/FM/FMPage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { billInputs, Notification, SectionsState } from "@/types";
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
    notifications.forEach((notification) => {
      if (notification.status !== "read") {
        changeNotificationStatusHandler(notification.id, "read");
      }
    });
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

  function getLimitExceededMessage(notification: Notification): string {
    if (notification.title === "Outstanding limit") {
      const name = notification.description
        .split("vendor")[1]
        ?.split("has")[0]
        ?.trim();
      return `Alert - Outstanding limit exceeded for ${name}`;
    } else if (notification.title === "Credit Limit") {
      const name = notification.description
        .split("client")[1]
        ?.split("has")[0]
        ?.trim();
      return `Alert - Credit Limit exceeded for ${name}`;
    } else if (
      notification.title === "LR edit" ||
      notification.title === "LR" ||
      notification.title === "LR Decline"
    ) {
      return `Request to edit the LR (LR No. ${notification.requestId}) `;
    } else if (
      notification.title === "FM edit" ||
      notification.title === "FM edit approved" ||
      notification.title === "FM Decline"
    ) {
      return `Request to edit the FM (FM No. ${notification.requestId}) `;
    } else if (
      notification.title === "FM delete" ||
      notification.title === "FM"
    ) {
      return `Request to delete the FM (FM No. ${notification.requestId}) `;
    } else if (
      notification.title === "LR delete" ||
      notification.title === "LR"
    ) {
      return `Request to delete the LR (LR No. ${notification.requestId}) `;
    } else if (
      notification.title === "FM record" &&
      notification.description === "declined"
    ) {
      return `Request to delete the FM Record Payment (FM No. ${notification.requestId}) `;
    } else if (
      notification.title === "FM record edit" ||
      notification.title === "FM record"
    ) {
      return `Request to edit the FM Record Payment (FM No. ${notification.requestId}) `;
    } else if (notification.title === "FM record delete") {
      return `Request to delete the FM Record Payment (FM No. ${notification.requestId}) `;
    } else if (
      notification.title === "Bill edit" ||
      notification.title === "Bill"
    ) {
      return `Request to edit the Bill (Bill No. ${notification.requestId}) `;
    } else if (
      notification.title === "Bill delete" ||
      notification.title === "Bill deleted"
    ) {
      return `Request to delete the Bill (Bill No. ${notification.requestId}) `;
    } else if (
      notification.title === "Bill record edit" ||
      notification.title === "Bill record"
    ) {
      return `Request to edit the Bill Record Payment (Bill No. ${notification.requestId}) `;
    } else if (
      notification.title === "Bill record delete" ||
      notification.title === "Bill record deleted"
    ) {
      return `Request to delete the Bill Record Payment (Bill No. ${notification.requestId}) `;
    } else if (notification.title === "Vehicle edit") {
      return `Vehicle from ${notification.description} has been edited by ${notification.message}`;
    } else if (notification.title === "Vendor edit") {
      return `Vendor from ${notification.description} has been edited by ${notification.message}`;
    } else if (notification.title === "Vendor delete") {
      return `Vendor from ${notification.description} has been deleted by ${notification.message}`;
    } else if (notification.title === "Vehicle delete") {
      return `Vehicle from ${notification.description} has been deleted by ${notification.message}`;
    } else if (notification.title === "Client edit") {
      return `Client  ${notification.description} has been edited by ${notification.message}`;
    } else if (notification.title === "Client delete") {
      return `Client  ${notification.description} has been deleted by ${notification.message}`;
    } else if (notification.title === "Expense edit") {
      return `Request to edit the Expense (Expense No. ${notification.requestId}) `;
    } else if (notification.title === "Expense") {
      return `Request to edit the Expense (Expense No. ${notification.requestId}) `;
    } else if (
      notification.title === "Expense delete" ||
      notification.title === "Expense deleted"
    ) {
      return `Request to delete the Expense (Expense No. ${notification.requestId}) `;
    } else if (
      notification.title === "POD edit" ||
      notification.title === "POD"
    ) {
      return `Request to edit the POD of (LR No. ${notification.requestId}) `;
    } else if (
      notification.title === "POD delete" ||
      notification.title === "POD deleted"
    ) {
      return `Request to delete the POD of (LR No. ${notification.requestId}) `;
    } else if (
      notification.title === "Credit delete" ||
      notification.title === "Credit deleted"
    ) {
      return `Request to delete the Credit of (Credit No. ${notification.requestId}) `;
    } else if (
      notification.title === "Credit edit" ||
      notification.title === "Credit edited"
    ) {
      return `Request to edit  Credit of (Credit No. ${notification.requestId}) `;
    } else {
      return "Invalid description";
    }
  }

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

  const onLREditDeclineHandler = async (notification: Notification) => {
    const data = {
      requestId: notification.id,
      title: "LR Decline",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
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

  const onFmEditDeclineHandler = async (notification: Notification) => {
    const data = {
      requestId: notification.id,
      title: "FM Decline",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
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

  const onLRDeleteDeclineHandler = async (notification: Notification) => {
    const data = {
      requestId: notification.id,
      title: "LR",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const onFMDeleteDeclineHandler = async (notification: Notification) => {
    const data = {
      requestId: notification.id,
      title: "FM",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const editFMRecordPaymentOnNotification = async (
    notification: Notification,
  ) => {
    const data = formatForUpdate(notification.data);
    const response = await updateRecordPaymentByNotificationApi(
      notification.fileId,
      notification.requestId,
      data,
    );
    if (response?.status === 200) {
      toast.success("Data Updated");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const editFMRecordPaymentDeclineOnNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "FM record",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deleteFMRecordByNotification = async (notification: Notification) => {
    const response = await deleteFMRecordByNotificationApi(
      notification.fileId,
      notification.requestId,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      false;
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deleteFMRecordDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "FM record",
      message: "",
      data: null,
      status: "declined",
      branchId: notification?.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
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

  const updateBillDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Bill",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };
    setIsLoading(true);
    const response = await createNotificationForBranchApi(data);
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

  const deleteBillDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Bill delete",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const updateBillRecordByNotification = async (notification: Notification) => {
    const data = {
      data: formatForUpdate(notification.data).data,
      billId: notification.requestId,
      id: notification.fileId,
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

  const updateBillRecordDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Bill record",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };
    setIsLoading(true);
    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      setIsLoading(false);
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deleteBillRecordByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deleteBillRecordByNotificationApi(
      notification.fileId,
    );
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const deleteBillRecordDeclineByNotification = async (
    notification: Notification,
  ) => {
    setIsLoading(true);
    const data = {
      requestId: notification.requestId,
      title: "Bill record deleted",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };
    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const updateCreditByNotification = async (notification: Notification) => {
    const data = formatForUpdate(notification.data);
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
    const data = formatForUpdate(notification.data);
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

  const updateCreditDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Credit",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
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
  const updateExpensesDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Expense",
      message: "",
      data: null,
      status: "declined",
      branchId: notification.description,
      description: "declined",
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

  const deleteCreditDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Credit deleted",
      message: "",
      status: "declined",
      branchId: notification.description,
      description: "declined",
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
  const deleteExpenseDeclineByNotification = async (
    notification: Notification,
  ) => {
    const data = {
      requestId: notification.requestId,
      title: "Expense deleted",
      message: "",
      status: "declined",
      branchId: notification.description,
      description: "declined",
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

  const updatePodByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await updatePODByNotificationApi(
      formatForUpdate(notification.data),
      notification.fileId,
    );
    if (response?.status === 200) {
      toast.success("Data Updated");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const updatePodDeclineByNotification = async (notification: Notification) => {
    const data = {
      requestId: notification.requestId,
      title: "POD",
      message: "",
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const deletePodByNotification = async (notification: Notification) => {
    setIsLoading(true);
    const response = await deletePODByNotificationApi(notification.fileId);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
    setIsLoading(false);
  };

  const deletePodDeclineByNotification = async (notification: Notification) => {
    const data = {
      requestId: notification.requestId,
      title: "POD deleted",
      status: "declined",
      branchId: notification.description,
      description: "declined",
    };

    const response = await createNotificationForBranchApi(data);
    if (response?.status === 200) {
      toast.success("Notification Sent");
      deleteNotificationHandler(notification.id);
    } else {
      toast.error("Something Went Wrong, Check All Fields");
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    if (
      notification.title === "LR edit" ||
      notification.title === "FM edit" ||
      notification.title === "Bill record edit" ||
      notification.title === "LR delete" ||
      notification.title === "FM delete" ||
      notification.title === "Bill delete" ||
      notification.title === "Vehicle edit" ||
      notification.title === "Client edit" ||
      notification.title === "Vendor edit" ||
      notification.title === "POD edit" ||
      notification.title === "POD" ||
      notification.title === "Vendor delete" ||
      notification.title === "Client delete" ||
      notification.title === "Vehicle delete" ||
      notification.title === "Bill record delete" ||
      notification.title === "Expense edit" ||
      notification.title === "Expense delete" ||
      notification.title === "POD delete" ||
      notification.title === "POD deleted" ||
      notification.title === "Expense deleted" ||
      notification.title === "Credit delete" ||
      notification.title === "Credit edit" ||
      notification.title === "Expense"
    ) {
      return notification.message ?? "Admin";
    } else {
      return "Admin";
    }
  };

  const getApproveText = (description: string) => {
    if (description === "Approved" || description === "deleted") {
      return (
        <p className="text-xs font-medium text-green-500">
          Approved - value updated
        </p>
      );
    }
  };

  const getNotedButton = (title: string, id: string) => {
    if (
      title === "LR" ||
      title === "FM" ||
      title === "FM edit approved" ||
      title === "Bill" ||
      title === "Bill update" ||
      title === "Bill deleted" ||
      title === "Bill record deleted" ||
      title === "Bill record" ||
      title === "LR Decline" ||
      title === "FM Decline" ||
      title === "Vehicle edit" ||
      title === "Vendor edit" ||
      title === "Client edit" ||
      title === "Vendor delete" ||
      title === "Client delete" ||
      title === "Vehicle delete" ||
      title === "Expense deleted" ||
      title === "POD deleted" ||
      title === "Credit deleted" ||
      title === "Credit edited" ||
      title === "Credit" ||
      title === "FM record" ||
      title === "POD" ||
      title === "Expense"
    ) {
      return (
        <Button
          className="p-1 px-2 text-sm"
          onClick={() => deleteNotificationHandler(id)}
          disabled={isLoading}
        >
          Noted!
        </Button>
      );
    }
  };

  const getViewDetailsButton = (title: string) => {
    return (
      title !== "LR" &&
      title !== "FM" &&
      title !== "FM edit" &&
      title !== "FM edit approved" &&
      title !== "Bill update" &&
      title !== "Bill deleted" &&
      title !== "Bill record deleted" &&
      title !== "Bill record" &&
      title !== "Bill" &&
      title !== "LR Decline" &&
      title !== "Vehicle edit" &&
      title !== "Vendor edit" &&
      title !== "Client edit" &&
      title !== "Vendor delete" &&
      title !== "Vehicle delete" &&
      title !== "Client delete" &&
      title !== "FM Decline" &&
      title !== "Expense" &&
      title !== "Expense deleted" &&
      title !== "Credit deleted" &&
      title !== "Credit edited" &&
      title !== "Credit" &&
      title !== "POD deleted" &&
      title !== "POD" &&
      title !== "FM record"
    );
  };

  const getModalTitle = (title: string, requestId: string) => {
    if (
      title === "LR edit" ||
      title === "FM edit" ||
      title === "Bill edit" ||
      title === "Bill record edit" ||
      title === "Expense edit" ||
      title === "POD edit"
    ) {
      return `Change Request for ${title.split(" ")[0] === "POD" ? "LR" : title.split(" ")[0]} No. #${requestId}`;
    } else if (title === "Credit edit") {
      return `Change Request for Credit No. #${requestId}`;
    } else {
      return "Alert!";
    }
  };

  const getDescriptionText = (
    title: string,
    requestId: string,
    description: string,
  ) => {
    if (title === "FM delete") {
      return `Are you sure you want to remove this FM ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "LR delete") {
      return `Are you sure you want to remove this LR ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "FM record delete") {
      return `Are you sure you want to remove this FM Record of ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "Credit Limit") {
      return description;
    } else if (title === "Bill delete") {
      return `Are you sure you want to remove this Bill ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "Bill record delete") {
      return `Are you sure you want to remove this Bill Record of  ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "Expense delete") {
      return `Are you sure you want to remove this Expense ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "POD delete") {
      return `Are you sure you want to remove this POD of LR No. ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "Credit delete") {
      return `Are you sure you want to remove this Credit of ID ${requestId}? This action is permanent and cannot be undone.`;
    } else if (title === "LR edit" || title === "Credit edit") {
      return "";
    } else {
      return description;
    }
  };

  const declineHandlers: Record<string, (n: Notification) => void> = {
    "LR edit": onLREditDeclineHandler,
    "FM edit": onFmEditDeclineHandler,
    "LR delete": onLRDeleteDeclineHandler,
    "FM delete": onFMDeleteDeclineHandler,
    "FM record edit": editFMRecordPaymentDeclineOnNotification,
    "FM record delete": deleteFMRecordDeclineByNotification,
    "Bill delete": deleteBillDeclineByNotification,
    "Bill record edit": updateBillRecordDeclineByNotification,
    "Bill record delete": deleteBillRecordDeclineByNotification,
    "Expense edit": updateExpensesDeclineByNotification,
    "Expense delete": deleteExpenseDeclineByNotification,
    "Credit delete": deleteCreditDeclineByNotification,
    "Credit edit": updateCreditDeclineByNotification,
    "POD edit": updatePodDeclineByNotification,
    "POD delete": deletePodDeclineByNotification,
  };

  const getDeclineFunction = (title: string, notification: Notification) => {
    const handler = declineHandlers[title];
    if (handler) handler(notification);
  };

  const getActionFunction = (notification: Notification) => {
    if (notification.title === "LR edit") {
      onLRUpdateHandler(
        notification.requestId,
        notification.data,
        notification.id,
      );
    } else if (notification.title === "FM delete") {
      onFMDeleteHandler(notification);
    } else if (notification.title === "LR delete") {
      onLRDeleteHandler(notification);
    } else if (notification.title === "FM record edit") {
      editFMRecordPaymentOnNotification(notification);
    } else if (notification.title === "FM record delete") {
      deleteFMRecordByNotification(notification);
    } else if (notification.title === "Bill delete") {
      deleteBillByNotification(notification);
    } else if (notification.title === "Bill record edit") {
      updateBillRecordByNotification(notification);
    } else if (notification.title === "Bill record delete") {
      deleteBillRecordByNotification(notification);
    } else if (notification.title === "Expense edit") {
      updateExpensesByNotification(notification);
    } else if (notification.title === "Credit edit") {
      updateCreditByNotification(notification);
    } else if (notification.title === "Expense delete") {
      deleteExpenseByNotification(notification);
    } else if (notification.title === "Credit delete") {
      deleteCreditByNotification(notification);
    } else if (notification.title === "POD edit") {
      updatePodByNotification(notification);
    } else if (notification.title === "POD delete") {
      deletePodByNotification(notification);
    } else deleteNotificationHandler(notification.id);
  };

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
            {notifications.map((notification) => (
              <div
                className="flex flex-col gap-2 rounded-md bg-white p-3"
                key={notification.id}
              >
                <p className="text-sm font-medium">
                  {getNotificationTitle(notification)}
                </p>
                <p className="text-primary text-xs font-medium">
                  {getLimitExceededMessage(notification)}
                </p>
                {getApproveText(notification.description)}
                {notification.description === "declined" && (
                  <p className="text-sm text-red-500">
                    Declined - value not updated
                  </p>
                )}

                <div className="flex w-full items-center justify-between">
                  <p className="text-xs">
                    {formatDateTimeByAgo(new Date(notification.createdAt))}
                  </p>
                  {getNotedButton(notification.title, notification.id)}
                  {getViewDetailsButton(notification.title) &&
                    notification.title !== "Bill edit" && (
                      <Dialog>
                        <DialogTrigger className="cursor-pointer rounded-lg p-1 px-2 text-sm outline">
                          View details
                        </DialogTrigger>
                        <DialogContent
                          className={`${notification.data === null ? "" : "min-w-3xl"} max-h-[80%] overflow-y-auto`}
                        >
                          <DialogHeader>
                            <DialogTitle>
                              {getModalTitle(
                                notification.title,
                                notification.requestId,
                              )}
                            </DialogTitle>
                            <DialogDescription></DialogDescription>
                            <div className="font-medium text-black">
                              {getDescriptionText(
                                notification.title,
                                notification.requestId,
                                notification.description,
                              )}
                              {notification?.data && (
                                <table className="w-full">
                                  <thead className="">
                                    <tr className="bg-black/60 text-white">
                                      <th className="px-2 font-[500]">
                                        Sl no.
                                      </th>
                                      <th className="p-2 text-center font-[500]">
                                        Field name
                                      </th>
                                      <th className="text-center font-[500]">
                                        Existing value
                                      </th>
                                      <th className="text-center font-[500]">
                                        Updated value
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {notification?.data &&
                                      Object.entries(
                                        notification.data as Record<
                                          string,
                                          any
                                        >,
                                      ).map(([key, value], index) => (
                                        <tr
                                          key={key}
                                          className="border-r border-b border-l border-black/40"
                                        >
                                          <td className="border-r border-black/40 p-2 text-center">
                                            {index + 1}
                                          </td>
                                          <td className="border-r border-black/40 text-center capitalize">
                                            {key}
                                          </td>
                                          <td className="border-r border-black/40 text-center">
                                            {String(value?.obj2 ?? "")}
                                          </td>
                                          <td className="text-center">
                                            {String(value?.obj1 ?? "")}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant={"outline"}
                              onClick={() =>
                                getDeclineFunction(
                                  notification.title,
                                  notification,
                                )
                              }
                              disabled={isLoading}
                            >
                              {notification.title === "LR edit" ||
                              notification.title === "FM edit" ||
                              notification.title === "FM record edit" ||
                              notification.title === "Bill record edit" ||
                              notification.title === "Bill edit" ||
                              notification.title === "POD edit" ||
                              notification.title === "Credit edit" ||
                              notification.title === "Expense edit"
                                ? "Decline"
                                : "Cancel"}
                            </Button>
                            <Button
                              onClick={() => getActionFunction(notification)}
                              disabled={isLoading}
                            >
                              {notification.title === "LR edit" ||
                              notification.title === "FM record edit" ||
                              notification.title === "Bill record edit" ||
                              notification.title === "Bill edit" ||
                              notification.title === "POD edit" ||
                              notification.title === "Credit edit" ||
                              notification.title === "Expense edit"
                                ? "Approve"
                                : notification.title === "FM delete" ||
                                    notification.title === "LR delete" ||
                                    notification.title === "Bill delete" ||
                                    notification.title ===
                                      "Bill record delete" ||
                                    notification.title === "FM record delete" ||
                                    notification.title === "POD delete" ||
                                    notification.title === "Credit delete" ||
                                    notification.title === "Expense delete"
                                  ? "Delete"
                                  : "Noted!"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  {(notification.title === "Bill edit" ||
                    notification.title === "FM edit") && (
                    <Dialog>
                      <DialogTrigger className="cursor-pointer rounded-lg p-1 px-2 text-sm outline">
                        View details
                      </DialogTrigger>
                      <DialogContent
                        className={`${notification.data === null ? "" : "min-w-3xl"} max-h-[80%] overflow-y-auto`}
                      >
                        <DialogHeader>
                          <DialogTitle>
                            {getModalTitle(
                              notification.title,
                              notification.requestId,
                            )}
                          </DialogTitle>
                          <DialogDescription></DialogDescription>
                          <div className="font-medium text-black">
                            {notification?.data && (
                              <table className="w-full">
                                <thead className="">
                                  <tr className="bg-black/60 text-white">
                                    <th className="px-2 font-[500]">Sl no.</th>
                                    <th className="p-2 text-center font-[500]">
                                      Field name
                                    </th>
                                    <th className="text-center font-[500]">
                                      Value
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {notification?.data &&
                                    Object.entries(
                                      notification.data as billInputs,
                                    )
                                      .filter(
                                        ([key]) =>
                                          key !== "lrNumber" &&
                                          key !== "branchId" &&
                                          key !== "adminId",
                                      )
                                      .map(([key, value], index) => (
                                        <tr
                                          key={key}
                                          className="border-r border-b border-l border-black/40"
                                        >
                                          <td className="border-r border-black/40 p-2 text-center">
                                            {index + 1}
                                          </td>
                                          <td className="border-r border-black/40 text-center capitalize">
                                            {key}
                                          </td>
                                          <td className="border-r border-black/40 text-center">
                                            {typeof value === "object" &&
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
                                              : String(value)}
                                          </td>
                                        </tr>
                                      ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant={"outline"}
                            onClick={() =>
                              notification.title === "Bill edit"
                                ? updateBillDeclineByNotification(notification)
                                : onFmEditDeclineHandler(notification)
                            }
                            disabled={isLoading}
                          >
                            Decline
                          </Button>
                          <Button
                            onClick={() =>
                              notification.title === "Bill edit"
                                ? updateBillByNotification(notification)
                                : onFMEditUpdateHandler(
                                    notification.requestId,
                                    notification.data,
                                    notification.id,
                                  )
                            }
                            disabled={isLoading}
                          >
                            Approve
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
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
