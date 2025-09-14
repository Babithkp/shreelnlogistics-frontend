import { PiUsersThree } from "react-icons/pi";
import { LiaHandsHelpingSolid } from "react-icons/lia";
import { useEffect, useState } from "react";
import RecentTransaction from "./RecentTransaction";
import VendorOutstanding from "./VendorOutstanding";
import ClientPayments from "./ClientPayments";
import { getAllVendorsApi } from "@/api/partner";
import { getAllClientsApi } from "@/api/admin";
import { ClientInputs, VendorInputs } from "@/types";
import { formatter } from "@/lib/utils";

export default function OutStandingPage({
  clients,
  vendors,
}: {
  clients: ClientInputs[];
  vendors: VendorInputs[];
}) {
  const [vendor, setVendor] = useState<VendorInputs[]>(vendors);
  const [client, setClient] = useState<ClientInputs[]>(clients);
  const totalOutstanding = vendor?.reduce(
    (acc, data) =>
      acc +
      data.FM.reduce(
        (acc, data) => acc + parseFloat(data.outStandingBalance),
        0,
      ),
    0,
  );
  const totalPendingPayment = client?.reduce(
    (acc, data) =>
      acc + data.bill.reduce((acc, bill) => acc + bill.pendingAmount, 0),
    0,
  );

  const [sections, setSections] = useState({
    recentTransactions: true,
    vendorOutstanding: false,
    clientPendingPayment: false,
  });

  const goBackHandler = () => {
    setSections({
      recentTransactions: true,
      vendorOutstanding: false,
      clientPendingPayment: false,
    });
  };

  async function fetchVendors() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setVendor(response.data.data);
    }
  }

  async function fetchClients() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setClient(response.data.data);
    }
  }

  useEffect(() => {
    fetchVendors();
    fetchClients();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-10">
        <button
          className="flex w-full cursor-pointer rounded-xl bg-white p-5"
          onClick={() =>
            setSections({
              recentTransactions: false,
              vendorOutstanding: true,
              clientPendingPayment: false,
            })
          }
        >
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiUsersThree size={30} color="#2196F3" />
            </div>
            <div className="text-start font-medium">
              <p className="text-muted text-sm">Vendor Outstanding</p>
              <p className="text-xl">
                {formatter.format(totalOutstanding ?? 0)}
              </p>
            </div>
          </div>
        </button>
        <button
          className="flex w-full cursor-pointer rounded-xl bg-white p-5"
          onClick={() =>
            setSections({
              recentTransactions: false,
              vendorOutstanding: false,
              clientPendingPayment: true,
            })
          }
        >
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <LiaHandsHelpingSolid size={30} color="#2196F3" />
            </div>
            <div className="text-start font-medium">
              <p className="text-muted text-sm">Pending payment (Client)</p>
              <p className="text-xl">
                {formatter.format(totalPendingPayment ?? 0)}
              </p>
            </div>
          </div>
        </button>
      </div>
      {sections.recentTransactions && <RecentTransaction />}
      {sections.vendorOutstanding && (
        <VendorOutstanding goBackHandler={goBackHandler} />
      )}
      {sections.clientPendingPayment && (
        <ClientPayments goBackHandler={goBackHandler} />
      )}
    </div>
  );
}
