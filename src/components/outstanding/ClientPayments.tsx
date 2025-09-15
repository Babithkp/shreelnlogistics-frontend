import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
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
    <section className="flex h-fit max-h-[73vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
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
              <td className="py-2">
                {formatter.format(transaction.totalInvoice)}
              </td>
              <td className="py-2">
                {formatter.format(transaction.totalReceived)}
              </td>
              <td className="py-2">
                {formatter.format(transaction.pendingPayment)}
              </td>
              <td className="py-2 text-center">
                {new Date(transaction.latestDate).toLocaleDateString() ===
                "Invalid Date"
                  ? "Waiting For Payment"
                  : new Date(transaction.latestDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
