import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { Button } from "../ui/button";
import { getAllClientsApi } from "@/api/admin";


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

  function summarizeClients(data: any[]): ClientSummary[] {
    return data.map((client) => {
      const clientName = client.name;
  
      const totalInvoice = client.bill?.reduce(
        (sum: number, bill: any) => sum + (bill.total || 0),
        0
      );
  
      const pendingPayment = client.bill?.reduce(
        (sum: number, bill: any) => sum + (bill.pendingAmount || 0),
        0
      );
  
      const totalReceived = client.PaymentRecord?.reduce(
        (sum: number, record: any) => sum + parseFloat(record.amount || "0"),
        0
      );
  
      const latestDate = client.PaymentRecord?.reduce((latest: string, record: any) => {
        return new Date(record.date) > new Date(latest) ? record.date : latest;
      }, "Waiting For Payment");
  
      return {
        clientName,
        totalInvoice,
        totalReceived,
        pendingPayment,
        latestDate
      };
    });
  }
  async function fetchTransactions() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      
      setTransactions(summarizeClients(response.data.data));
    }
  }
  useEffect(() => {
    fetchTransactions();
  }, []);
  return (
    <section className="flex h-fit w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
      <div className="flex w-full justify-between">
        <p className="text-lg font-medium">Client Pending Payments</p>
        <Button
          onClick={goBackHandler}
          className="text-primary bg-primary/10 cursor-pointer rounded-3xl px-5"
          variant={"outline"}
        >
          Go Back
        </Button>
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
          {transactions?.map((transaction) => (
            <tr
              key={transaction.clientName}
            >
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
