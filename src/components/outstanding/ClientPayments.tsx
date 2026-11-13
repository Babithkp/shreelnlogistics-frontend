import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ClientInputs } from "@/types";
import { formatter } from "@/lib/utils";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { filterClientByNameApi, getClientForPageApi } from "@/api/partner";
import { LuSearch } from "react-icons/lu";

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
  const [totalItems, setTotalItems] = useState(0);
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

  async function filterClientByName(search: string) {
    const response = await filterClientByNameApi(search);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(summarizeClients(allTransactions));
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    filterClientByName(search);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
    }
  }, [search]);

  function summarizeClients(data: ClientInputs[]): ClientSummary[] {
    return data.map((client) => {
      const clientName = client.name;

      // Total Invoiced Amount
      const totalInvoice = client.bill?.reduce(
        (sum, bill) => sum + (bill.subTotal || 0),
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

  async function fetchTransactions(page: number, limit: number) {
    const response = await getClientForPageApi(page, limit);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(summarizeClients(allTransactions.clientData));
      setTransactions(summarizeClients(allTransactions.clientData));
      setTotalItems(allTransactions.clientCount);
    }
  }

  useEffect(() => {
    fetchTransactions(currentPage, itemsPerPage);
  }, [startIndex, endIndex]);

  useEffect(() => {
    fetchTransactions(currentPage, itemsPerPage);
  }, []);
  return (
    <section className="flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex w-full justify-between">
        <p className="text-lg font-medium">Client Pending Payments</p>
        <form className="flex items-center gap-5" onSubmit={handleSearch}>
          <input
            type="text"
            className="border-primary rounded-2xl border p-1 px-3"
            placeholder="Search Transaction"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            className="cursor-pointer rounded-xl p-5"
          >
            <LuSearch size={30} className="mx-3 scale-125" />
          </Button>
          <Button
            type="button"
            onClick={goBackHandler}
            className="text-primary bg-primary/10 cursor-pointer rounded-3xl px-5"
            variant={"outline"}
          >
            Go Back
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
                  type="button"
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`cursor-pointer ${currentPage === 1 ? "opacity-50" : ""}`}
                >
                  <MdOutlineChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className={`cursor-pointer ${currentPage === totalPages ? "opacity-50" : ""}`}
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  <MdOutlineChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <div className="overflow-y-auto pr-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-slate-100">
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Name
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Total Invoiced
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Total Recieved
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Pending Payments
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Last Payment Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions?.map((transaction) => (
              <tr
                key={transaction.clientName}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {transaction.clientName}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatter.format(transaction.totalInvoice)}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatter.format(transaction.totalReceived)}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatter.format(transaction.pendingPayment)}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {new Date(transaction.latestDate).toLocaleDateString() ===
                  "Invalid Date"
                    ? "Waiting For Payment"
                    : new Date(transaction.latestDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
