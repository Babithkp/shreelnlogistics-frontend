import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { Button } from "../ui/button";
import { getAllClientsApi } from "@/api/admin";
import { ClientInputs } from "@/types";

type ClientSummary = {
  clientName: string;
  totalInvoice: number;
  totalReceived: number;
  pendingPayment: number;
  latestDate: string;
};
export default function ClientPayments({
  goBackHandler,
}: {
  goBackHandler: () => void;
}) {
  const [transactions, setTransactions] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState<
    ClientSummary[]
  >([]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredTransactions(transactions);
        return;
      }
      const filtered = transactions.filter((transaction) =>
        [
          transaction.clientName,
        ]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(text)),
      );

      setFilteredTransactions(filtered);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, transactions]);


  function summarizeClients(data: ClientInputs[]): ClientSummary[] {
    return data.map((client) => {
      const clientName = client.name;

      // Total Invoiced Amount
      const totalInvoice = client.bill?.reduce(
        (sum, bill) => sum + (bill.total || 0),
        0,
      );

      // Total Pending Payment
      const pendingPayment = client.bill?.reduce(
        (sum, bill) => sum + (bill.pendingAmount || 0),
        0,
      );

      // Flatten all PaymentRecords from all bills
      const allPaymentRecords =
        client.bill?.flatMap((bill) => bill.PaymentRecords || []) || [];

      // Total Received
      const totalReceived = allPaymentRecords.reduce(
        (sum, record) => sum + parseFloat(record.amount || "0"),
        0,
      );

      // Latest Payment Date
      const latestDate =
        allPaymentRecords.length > 0
          ? allPaymentRecords.reduce(
              (latest, record) =>
                new Date(record.date) > new Date(latest) ? record.date : latest,
              allPaymentRecords[0].date,
            )
          : "Waiting For Payment";

      return {
        clientName,
        totalInvoice,
        pendingPayment,
        totalReceived,
        latestDate,
      };
    });
  }

  async function fetchTransactions() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setTransactions(summarizeClients(response.data.data));
      setFilteredTransactions(transactions);
    }
  }
  useEffect(() => {
    fetchTransactions();
  }, []);
  return (
    <section className="flex h-fit w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
      <div className="flex w-full justify-between">
        <p className="text-lg font-medium">Client Pending Payments</p>
        <div className="flex items-center gap-5">
          <input
            type="text"
            className="border-primary rounded-2xl border p-1 px-3"
            placeholder="Search Transaction"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            onClick={goBackHandler}
            className="text-primary bg-primary/10 cursor-pointer rounded-3xl px-5"
            variant={"outline"}
          >
            Go Back
          </Button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
              <p>Name</p>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Total Invoiced</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Total Recieved</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              Pending Payments
            </th>
            <th className="text-center font-[400] text-[#797979]">
              Last Payment Date
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions?.map((transaction) => (
            <tr key={transaction.clientName}>
              <td className="py-2">{transaction.clientName}</td>
              <td className="py-2">INR {transaction.totalInvoice}</td>
              <td className="py-2">INR {transaction.totalReceived}</td>
              <td className="py-2">INR {transaction.pendingPayment}</td>
              <td className="py-2 text-center">{transaction.latestDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
