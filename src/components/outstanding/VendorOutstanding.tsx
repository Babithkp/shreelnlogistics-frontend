import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { Button } from "../ui/button";
import { getAllVendorsApi } from "@/api/partner";

type PaymentRecord = {
  amount: string;
  date: string;
};

type FM = {
  netBalance: string;
  outStandingBalance: string;
  PaymentRecords: PaymentRecord[];
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

  useEffect(() => {
    const delay = setTimeout(() => {
      const text = search.trim().toLowerCase();

      if (!text) {
        setFilteredTransactions(transactions);
        return;
      }
      const filtered = transactions.filter((transaction) =>
        [transaction.name]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(text)),
      );

      setFilteredTransactions(filtered);
    }, 300);

    return () => clearTimeout(delay);
  }, [search, transactions]);

  function summarizeVendors(vendors: Vendor[]): VendorSummary[] {
    return vendors.map((vendor) => {
      let totalInvoice = 0;
      let totalReceived = 0;
      let latestDate: string | null = null;

      vendor.FM.forEach((fm) => {
        totalInvoice += parseFloat(fm.netBalance || "0");

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

  async function fetchTransactions() {
    const response = await getAllVendorsApi();
    if (response?.status === 200) {
      setTransactions(summarizeVendors(response.data.data));
      setFilteredTransactions(transactions);
    }
  }
  useEffect(() => {
    fetchTransactions();
  }, []);
  return (
    <section className="flex h-fit w-full flex-col gap-5 overflow-y-auto rounded-md bg-white p-5">
      <div className="flex w-full justify-between">
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
                <p>Total Freight</p>
                <FaChevronDown size={15} className="cursor-pointer" />
              </div>
            </th>
            <th className="text-start font-[400] text-[#797979]">
              <div className="flex items-center gap-2">
                <p>Total Paid</p>
                <FaChevronDown size={15} className="cursor-pointer" />
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
              <td className="py-2">INR {transaction.totalInvoice}</td>
              <td className="py-2">INR {transaction.totalReceived}</td>
              <td className="py-2">INR {transaction.pendingAmount}</td>
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
