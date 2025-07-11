import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { getAllRecordPaymentApi } from "@/api/branch";
import { FMInputs, PaymentRecord } from "@/types";

export interface ExtendedPaymentRecord extends PaymentRecord {
  billId: string;
  FM: FMInputs[];
  branchesId: string;
}
export default function RecentTransaction() {
  const [transactions, setTransactions] = useState<ExtendedPaymentRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    ExtendedPaymentRecord[]
  >([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredTransactions(transactions);
        return;
      }
      const filtered = transactions.filter((transaction) =>
        [
          transaction.customerName,
        ]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(text)),
      );

      setFilteredTransactions(filtered);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, transactions]);


  async function fetchTransactions(branchId?: string) {
    const response = await getAllRecordPaymentApi();
    if (response?.status === 200) {
      const allTransactions: ExtendedPaymentRecord[] = response.data.data;
      const filteredTransactions = branchId
        ? allTransactions.filter(
            (transaction) => transaction.branchesId === branchId,
          )
        : allTransactions;
      setTransactions(filteredTransactions);
      setFilteredTransactions(filteredTransactions);
    }
  }
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);

      if (isAdmin === "true") {
        fetchTransactions();
      } else {
        fetchTransactions(branchDetails.id);
      }
    }
  }, []);
  return (
    <section className="flex h-fit w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-medium">Recent Transactions</p>
        <input
          type="text"
          className="rounded-2xl border p-1 px-3  border-primary"
          placeholder="Search Transaction"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
              <p>Transaction Date</p>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Name</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Transaction Type</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              Transaction Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="py-2">
                {new Date(transaction.date).toLocaleDateString()}
              </td>
              <td className="py-2">{transaction.customerName}</td>
              <td className="py-2">{transaction.billId ? "Cr." : "Dr"} </td>
              <td className="py-2">INR {transaction.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
