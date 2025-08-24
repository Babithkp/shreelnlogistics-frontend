import { HiOutlineCurrencyRupee } from "react-icons/hi";

import { useEffect, useState } from "react";

import { formatter } from "@/lib/utils";
import { getAllCreditApi, getAllExpensesApi } from "@/api/expense";

import Expense from "./Expense";
import Credit from "./Credit";
import { ExpensesInputs } from "@/types";

export default function Expenses({expenseData}: {expenseData: {
  data: ExpensesInputs[];
  count: number;
}}) {
  const [section, setSection] = useState({
    expenses: true,
    credits: false,
  });
  const [expenses, setExpenses] = useState<ExpensesInputs[]>([]);
  const [credits, setCredits] = useState<ExpensesInputs[]>([]);

  async function fetchExpenses() {
    const response = await getAllExpensesApi();
    if (response?.status === 200) {
      const allExpenses = response.data.data;
      setExpenses(allExpenses);
    }
  }

  async function fetchCredits() {
    const response = await getAllCreditApi();
    if (response?.status === 200) {
      const allCredits = response.data.data;
      setCredits(allCredits);
    }
  }

  useEffect(() => {
    fetchExpenses();
    fetchCredits()
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex justify-between gap-5">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Total Expenses</p>
              <p className="text-xl">
                {formatter.format(
                  expenses.reduce(
                    (acc, data) => acc + (parseFloat(data.amount) || 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total Credit</p>
              <p className="text-xl">{formatter.format(
                  credits.reduce(
                    (acc, data) => acc + (parseFloat(data.amount) || 0),
                    0,
                  ),
                )}</p>
            </div>
          </div>
        </div>
      </section>
      {section.expenses && <Expense setSection={setSection} data={expenseData} />}
      {section.credits && <Credit setSection={setSection} />}
    </div>
  );
}
