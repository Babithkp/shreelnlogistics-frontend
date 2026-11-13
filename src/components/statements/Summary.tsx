import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbRadar2 } from "react-icons/tb";
import { Button } from "../ui/button";
import { getAllRecordPaymentApi, getAllStatementsApi } from "@/api/branch";
import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveExcelFile } from "@/lib/exportFile";
import { CreditInputs, PaymentRecord } from "@/types";
import { getAllCreditApi, getAllExpensesApi } from "@/api/expense";
import { formatter } from "@/lib/utils";
import { toast } from "react-toastify";
import { Skeleton } from "antd";
import { LuSearch } from "react-icons/lu";
import { Download } from "lucide-react";

interface ExtendedPaymentRecord extends PaymentRecord {
  billId: string;
  creditId: string;
  fMId: string;
  expenseId: string;
  branchesId: string;
  Admin?: {
    branchName: string;
  };
  Branches?: {
    branchName: string;
  };
  Bill?: {
    tds: number;
  };
}
export default function Statements() {
  const [transactions, setTransactions] = useState<ExtendedPaymentRecord[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    ExtendedPaymentRecord[]
  >([]);
  const [paymentTotals, setPaymentTotals] = useState({
    totalValue: 0,
    totalCr: 0,
    totalDr: 0,
  });
  const [exportDate, setExportDate] = useState("");
  const [search, setSearch] = useState("");

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
      return;
    }
    const filteredTransactions = transactions.filter((transaction) => {
      const textToSearch = search.trim().toLowerCase();
      return (
        transaction.IDNumber?.toLowerCase().includes(textToSearch) ||
        transaction.creditId?.toLowerCase().includes(textToSearch) ||
        transaction.fMId?.toLowerCase().includes(textToSearch) ||
        transaction.expenseId?.toLowerCase().includes(textToSearch)
      );
    });

    setFilteredTransactions(filteredTransactions);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredTransactions(transactions);
    }
  }, [search]);

  const onExportDateHandler = async (e: any) => {
    setExportDate(e.target.value);
    const response = await getAllStatementsApi(e.target.value);
    if (response?.status === 200) {
      const combinedTransactions = [
        ...response.data.data.payments,
        ...response.data.data.credits,
      ];
      setFilteredTransactions(combinedTransactions as ExtendedPaymentRecord[]);
    }
  };

  const exportFilteredRecordExcel = async () => {
    const saved = await exportRecordExcel(
      formatRecordData(filteredTransactions),
      `Cash Statement-${exportDate}`,
    );
    setFilteredTransactions(transactions);
    setExportDate("");
    if (saved) toast.success("File Downloaded");
  };

  const exportRecordExcel = async (data: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image to workbook
    const imageBuffer = await fetch(
      "https://shreeln-bucket.s3.ap-south-1.amazonaws.com/logo.png",
    ).then((res) => res.arrayBuffer());

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png",
    });

    // Position image at top (cell A1)
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 300, height: 80 },
    });

    worksheet.getCell("A6").value = "Cash Statement";
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.getRow(8).values = headers;

    // Add rows
    data.forEach((item) => {
      worksheet.addRow(Object.values(item));
    });

    // Generate and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return saveExcelFile(buffer, filename);
  };

  const formatRecordData = (data: ExtendedPaymentRecord[]) => {
    return data.map((record) => ({
      Date: new Date(record.date).toLocaleDateString(),
      Description: record.IDNumber
        ? record.IDNumber
        : record.expenseId
          ? "EXP " + record.expenseId
          : "CR " + record.creditId,
      Branch: record.Admin?.branchName || record.Branches?.branchName,
      "Billed value": record.amount,
      "Cr.": record.billId ? record.amount : "-",
      "Dr.": record.fMId
        ? record.amount
        : record.expenseId
          ? record.amount
          : "-",
    }));
  };

  function summarizePayments(paymentRecords: ExtendedPaymentRecord[]) {
    let totalValue = 0;
    let totalCr = 0;
    let totalDr = 0;

    for (const record of paymentRecords) {
      const amount = parseFloat(record.amount || "0");
      totalValue += amount;

      if (record.fMId || record.expenseId) {
        totalDr += amount;
      } else {
        totalCr += amount;
      }
    }

    return {
      totalValue,
      totalCr,
      totalDr,
    };
  }

  async function fetchTransactions(branchId?: string) {
    const time1 = new Date().getTime();
    const recordResponse = await getAllRecordPaymentApi();
    const creditResponse = await getAllCreditApi();
    const expenseResponse = await getAllExpensesApi();
    if (
      recordResponse?.status === 200 &&
      creditResponse?.status === 200 &&
      expenseResponse?.status === 200
    ) {
      const allTransactions: ExtendedPaymentRecord[] = recordResponse.data.data;
      const allCredits: CreditInputs[] = creditResponse.data.data;
      const allExpenses: ExtendedPaymentRecord[] = expenseResponse.data.data;
      const filteredTransactions = branchId
        ? allTransactions.filter(
            (transaction) => transaction.branchesId === branchId,
          )
        : allTransactions;

      const filteredCredits = branchId
        ? allCredits.filter((credit) => credit.branchesId === branchId)
        : allCredits;
      const filteredExpenses = branchId
        ? allExpenses.filter((expense) => expense.branchesId === branchId)
        : allExpenses;
      const combinedTransactions = [
        ...filteredTransactions,
        ...filteredCredits,
        ...filteredExpenses,
      ];
      const sortedTransactions = combinedTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(sortedTransactions as ExtendedPaymentRecord[]);
      setFilteredTransactions(sortedTransactions as ExtendedPaymentRecord[]);

      setPaymentTotals(
        summarizePayments(sortedTransactions as ExtendedPaymentRecord[]),
      );
    }
    const time2 = new Date().getTime();
    console.log(
      "Transaction Fetched in " + (time2 - time1) / 1000 + " seconds",
    );
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
    <div className="flex flex-col gap-5">
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Net Balance</p>
              <p className="text-xl">
                {formatter.format(
                  paymentTotals.totalCr - paymentTotals.totalDr,
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <TbRadar2 size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total Transaction</p>
              <p className="text-xl">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {
        <section className="flex w-full flex-col justify-between gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-[63Vh]">
            <form
              className="flex items-center justify-between pb-2 pr-2"
              onSubmit={onSearchSubmit}
            >
              <p className="text-lg font-semibold text-slate-900">Summary</p>
              <div className="flex items-center gap-2">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus-within:border-primary focus-within:bg-white">
                  <LuSearch size={16} className="text-slate-400" />
                  <input
                    placeholder="Search"
                    className="w-48 bg-transparent outline-none placeholder:text-slate-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-white hover:bg-primary/90"
                >
                  <LuSearch size={18} />
                </Button>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm transition-colors focus-within:border-primary focus-within:bg-white">
                  <input
                    type="date"
                    className="bg-transparent text-slate-700 outline-none"
                    onChange={onExportDateHandler}
                    value={exportDate}
                  />
                </div>
                <Button
                  onClick={exportFilteredRecordExcel}
                  type="button"
                  className="h-10 cursor-pointer rounded-lg bg-primary px-6 text-white hover:bg-primary/90"
                >
                  <Download size={16} />
                  Export
                </Button>
              </div>
            </form>
            <div className="h-[60vh] overflow-y-auto pr-1">
              {filteredTransactions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Description
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Branch
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Billed value
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Cr.
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-slate-500">
                        Dr.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((record) => (
                      <tr
                        className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                        key={record.id}
                      >
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {record.creditId
                            ? "CR"
                            : record.fMId
                              ? "FM"
                              : record.expenseId
                                ? "EXP"
                                : ""}{" "}
                          {record.IDNumber ??
                            record.creditId ??
                            record.expenseId}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {record.Admin?.branchName ||
                            record.Branches?.branchName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {formatter.format(parseFloat(record.amount))}
                        </td>
                        {record.billId || record.creditId ? (
                          <td className="px-3 py-2.5 text-slate-700">
                            {record.billId
                              ? formatter.format(
                                parseFloat(record.amount) -
                                (parseFloat(record.amount) * (record.Bill?.tds || 0)) / 100
                              )
                              : formatter.format(parseFloat(record.amount))}
                          </td>
                        ) : (
                          <td className="px-3 py-2.5 text-slate-700">-</td>
                        )}
                        {record.fMId || record.expenseId ? (
                          <td className="px-3 py-2.5 text-slate-700">
                            {formatter.format(parseFloat(record.amount))}
                          </td>
                        ) : (
                          <td className="px-3 py-2.5 text-slate-700">-</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Skeleton
                    active
                    rootClassName="w-full h-full"
                    paragraph={{ rows: 50 }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pr-10">
            <div className="flex gap-15">
              <p>Total Value {formatter.format(paymentTotals.totalValue)}</p>
              <p className="flex gap-2">
                Total CR.
                <span className="text-green-500">
                  {formatter.format(paymentTotals.totalCr)}
                </span>
              </p>
              <p className="flex gap-2">
                Total DR.{" "}
                <span className="text-red-500">
                  {formatter.format(paymentTotals.totalDr)}
                </span>
              </p>
            </div>
          </div>
        </section>
      }
    </div>
  );
}
