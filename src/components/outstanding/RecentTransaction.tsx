import { useEffect, useState } from "react";
import { FMInputs, PaymentRecord } from "@/types";
import { formatter } from "@/lib/utils";
import { GetRecentTransactionsApi } from "@/api/branch";
import { Skeleton } from "antd";
export interface ExtendedPaymentRecord extends PaymentRecord {
  billId: string;
  FM: FMInputs[];
  branchesId: string;
}
export default function RecentTransaction() {
  const [transactions, setTransactions] = useState<ExtendedPaymentRecord[]>([]);

  useEffect(() => {
    async function fetchTransactions() {
      const response = await GetRecentTransactionsApi();
      if (response?.status === 200) {
        const allTransactions = response.data.data;
        setTransactions(allTransactions);
        console.log(allTransactions);
        
      }
    }
    fetchTransactions();
  }, []);

  return (
    <section className="flex h-fit max-h-[84vh] w-full flex-col gap-5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <p className="text-lg font-medium">Weekly Transactions</p>
      </div>
      <div className="overflow-y-auto pr-1">
        {transactions.length > 0 ? <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-slate-100">
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Transaction Date
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Description
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Transaction Type
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                Transaction Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td className="px-3 py-2.5 font-medium text-slate-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{transaction.IDNumber} </td>
                <td className="px-3 py-2.5 text-slate-700">{transaction.billId ? "Cr." : "Dr"} </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatter.format(parseInt(transaction.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          : <div className="flex w-full h-full items-center justify-center">
            <Skeleton active  rootClassName="w-full h-full" paragraph={{ rows: 10 }} />
          </div>
        }
      </div>
    </section>
  );
}
