import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import {
  filterRecentPaymentsForBranchPageApi,
  filterRecordPaymentApi,
  filterRecordPaymentByNameForBranchApi,
  getRecentPaymentsForPageApi,
} from "@/api/branch";
import { FMInputs, PaymentRecord } from "@/types";
import { formatter } from "@/lib/utils";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";

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
  const [admin, setAdmin] = useState({
    isAdmin: false,
    branchId: "",
    adminId: "",
  });
  const [search, setSearch] = useState("");
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

  async function fetchPaymentRecordForPage() {
    const response = await getRecentPaymentsForPageApi(
      currentPage,
      itemsPerPage,
    );
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(allTransactions.paymentRecord);
      setTransactions(allTransactions.paymentRecord);
      setTotalItems(allTransactions.paymentCount);
    }
  }

  async function fetchPaymentRecordForBranchPage() {
    const response = await filterRecentPaymentsForBranchPageApi(
      currentPage,
      itemsPerPage,
      admin?.branchId,
    );
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(allTransactions.paymentRecord);
      setTransactions(allTransactions.paymentRecord);
      setTotalItems(allTransactions.paymentCount);
    }
  }

  async function filterRecordPaymentByName(search: string) {
    const response = await filterRecordPaymentApi(search);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(allTransactions);
    }
  }

  async function filterRecordPaymentByNameForBranch(search: string) {
    const response = await filterRecordPaymentByNameForBranchApi(
      search,
      admin?.branchId,
    );
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(allTransactions);
    }
  }

  useEffect(() => {
    if (admin.isAdmin) {
      fetchPaymentRecordForPage();
    } else {
      fetchPaymentRecordForBranchPage();
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (admin.isAdmin) {
      fetchPaymentRecordForPage();
    } else {
      fetchPaymentRecordForBranchPage();
    }
  }, [admin]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredTransactions(transactions);
        return;
      }
      
      if (admin.isAdmin) {
        filterRecordPaymentByName(text);
      } else {
        filterRecordPaymentByNameForBranch(text);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [search, transactions]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branchDetailsRaw = localStorage.getItem("branchDetails");

    if (branchDetailsRaw) {
      const branchDetails = JSON.parse(branchDetailsRaw);

      if (isAdmin === "true") {
        setAdmin({
          isAdmin: true,
          branchId: "",
          adminId: branchDetails.id,
        });
      } else {
        setAdmin({
          isAdmin: false,
          branchId: branchDetails.id,
          adminId: "",
        });
      }
    }
  }, []);
  return (
    <section className="flex h-fit w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5 max-h-[73vh]">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-medium">Recent Transactions</p>
        <div className="flex items-center gap-5">
          <input
            type="text"
            className="border-primary rounded-2xl border p-1 px-3"
            placeholder="Search Transaction"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              <td className="py-2">
                {formatter.format(parseInt(transaction.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
