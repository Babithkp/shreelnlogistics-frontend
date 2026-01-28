import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { filterVendorByNameApi, getVendorForPageApi } from "@/api/partner";
import { formatter } from "@/lib/utils";
import { MdOutlineChevronLeft, MdOutlineChevronRight } from "react-icons/md";
import { LuSearch } from "react-icons/lu";

type PaymentRecord = {
  amount: string;
  date: string;
};

type FM = {
  netBalance: string;
  outStandingBalance: string;
  PaymentRecords: PaymentRecord[];
  detentionCharges: string;
  rtoCharges: string;
  otherCharges: string;
  tds: string;
  hire: string;
};

type Vendor = {
  name: string;
  FM: FM[];
};

type VendorSummary = {
  name: string;
  totalInvoice: number;
  totalReceived: number;
  pendingAmount: number;
  latestPaymentDate: string | null;
};

export default function VendorOutstanding({
  goBackHandler,
}: {
  goBackHandler: () => void;
}) {
  const [transactions, setTransactions] = useState<VendorSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState<
    VendorSummary[]
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

  async function filterVendorByName(search: string) {
    const response = await filterVendorByNameApi(search);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(summarizeVendors(allTransactions));
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    filterVendorByName(search);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
  }, [search]);

  function summarizeVendors(vendors: Vendor[]): VendorSummary[] {
    return vendors.map((vendor) => {
      let totalInvoice = 0;
      let totalReceived = 0;
      let latestDate: string | null = null;

      vendor.FM.forEach((fm) => {
        totalInvoice += parseFloat(fm.hire || "0") +
          parseFloat(fm.detentionCharges || "0") +
          parseFloat(fm.rtoCharges || "0") +
          parseFloat(fm.otherCharges || "0") -
          parseFloat(fm.tds || "0"),

          fm.PaymentRecords.forEach((pr) => {
            totalReceived += parseFloat(pr.amount || "0");
            if (!latestDate || new Date(pr.date) > new Date(latestDate)) {
              latestDate = pr.date;
            }
          });
      });

      const pendingAmount = vendor.FM.reduce(
        (sum, fm) => sum + parseFloat(fm.outStandingBalance || "0"),
        0,
      );

      return {
        name: vendor.name,
        totalInvoice,
        totalReceived,
        pendingAmount,
        latestPaymentDate: latestDate,
      };
    });
  }

  async function fetchTransactions(page: number, limit: number) {
    const response = await getVendorForPageApi(page, limit);
    if (response?.status === 200) {
      const allTransactions = response.data.data;
      setFilteredTransactions(summarizeVendors(allTransactions.vendorData));
      setTransactions(summarizeVendors(allTransactions.vendorData));
      setTotalItems(allTransactions.vendorCount);
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
      <form className="flex w-full justify-between" onSubmit={handleSearch}>
        <p className="text-lg font-medium">Vendor Outstanding</p>
        <div className="flex items-center gap-5">
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
        </div>
      </form>
      <table className="w-full">
        <thead>
          <tr>
            <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
              <p>Name</p>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Total Hire cost</p>
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Total Paid</p>
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              Outstanding
            </th>
            <th className="text-center font-[400] text-[#797979]">
              Last Payment Date
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.name}>
              <td className="py-2">{transaction.name}</td>
              <td className="py-2">
                {formatter.format(transaction.totalInvoice)}
              </td>
              <td className="py-2">
                {formatter.format(transaction.totalReceived)}
              </td>
              <td className="py-2">
                {formatter.format(transaction.pendingAmount)}
              </td>
              <td className="py-2 text-center">
                {new Date(
                  transaction.latestPaymentDate || "",
                ).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
