import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbRadar2 } from "react-icons/tb";
import { Button } from "../ui/button";
import { getAllRecordPaymentApi, getAllStatementsApi } from "@/api/branch";
import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { PaymentRecord } from "@/types";
import { getAllCreditApi, getAllExpensesApi } from "@/api/expense";
import { formatter } from "@/lib/utils";
import { toast } from "react-toastify";
import { Skeleton } from "antd";
import { LuSearch } from "react-icons/lu";

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
}
export default function CashStatement() {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<ExtendedPaymentRecord[]>(
    [],
  );
  const [filteredPaymentRecord, setFilteredPaymentRecord] = useState<
    ExtendedPaymentRecord[]
  >([]);
  const [credits, setCredits] = useState<ExtendedPaymentRecord[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<
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
      setFilteredPaymentRecord(paymentRecord);
      setFilteredCredits(credits);
      return;
    }
    const filteredPayment = paymentRecord.filter((transaction) => {
      const textToSearch = search.trim().toLowerCase();
      return (
        transaction.IDNumber?.toLowerCase().includes(textToSearch) ||
        transaction.fMId?.toLowerCase().includes(textToSearch) ||
        transaction.expenseId?.toLowerCase().includes(textToSearch)
      );
    });

    const filteredCredit = credits.filter((transaction) => {
      const textToSearch = search.trim().toLowerCase();
      return (
        transaction.creditId?.toLowerCase().includes(textToSearch) ||
        transaction.billId?.toLowerCase().includes(textToSearch)
      );
    });
    setFilteredCredits(filteredCredit);
    setFilteredPaymentRecord(filteredPayment);
  };

  useEffect(() => {
    if (search.trim().length === 0) {
      setFilteredPaymentRecord(paymentRecord);
      setFilteredCredits(credits);
    }
  }, [search]);

  const onExportDateHandler = async (e: any) => {
    setExportDate(e.target.value);
    try {
      const response = await getAllStatementsApi(e.target.value);
      if (response?.status === 200) {
        setFilteredPaymentRecord(
          response.data.data.payments as ExtendedPaymentRecord[],
        );
        setFilteredCredits(
          response.data.data.credits as ExtendedPaymentRecord[],
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const exportFilteredRecordExcel = async () => {
    exportRecordExcel(
      formatCreditData(filteredCredits),
      formatRecordData(filteredPaymentRecord),
      `Cash Statement-${exportDate}`,
    );
    if (!branchId) {
      fetchTransactions();
    } else if (branchId) {
      fetchTransactions(branchId);
    }
    setExportDate("");
    toast.success("File Downloaded");
  };

  const exportRecordExcel = async (
    data1: any[] = [],
    data2: any[] = [],
    filename: string,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image
    const imageBuffer = await fetch(
      "https://shreeln-bucket.s3.ap-south-1.amazonaws.com/logo.png",
    ).then((res) => res.arrayBuffer());

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png",
    });

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 300, height: 80 },
    });

    worksheet.getCell("A6").value = "Cash Statement";

    const startRow = 8;
    const startCol1 = 1;
    const gap = 2;

    // Helper to normalize values
    const normalize = (val: any): ExcelJS.CellValue => {
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    };

    // ------------------ DATA 1 ------------------
    let headers1: string[] = [];

    if (Array.isArray(data1) && data1.length > 0) {
      headers1 = Object.keys(data1[0]);

      headers1.forEach((header, i) => {
        worksheet.getCell(startRow, startCol1 + i).value = header;
      });

      data1.forEach((item, rowIndex) => {
        headers1.forEach((key, colIndex) => {
          worksheet.getCell(
            startRow + 1 + rowIndex,
            startCol1 + colIndex,
          ).value = normalize(item[key]);
        });
      });
    }

    // ------------------ DATA 2 ------------------
    let headers2: string[] = [];

    if (Array.isArray(data2) && data2.length > 0) {
      headers2 = Object.keys(data2[0]);

      const startCol2 =
        startCol1 + (headers1.length > 0 ? headers1.length : 0) + gap;

      headers2.forEach((header, i) => {
        worksheet.getCell(startRow, startCol2 + i).value = header;
      });

      data2.forEach((item, rowIndex) => {
        headers2.forEach((key, colIndex) => {
          worksheet.getCell(
            startRow + 1 + rowIndex,
            startCol2 + colIndex,
          ).value = normalize(item[key]);
        });
      });
    }

    // Optional: show message if both empty
    if ((!data1 || data1.length === 0) && (!data2 || data2.length === 0)) {
      worksheet.getCell("A10").value = "No data available";
    }

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${filename}.xlsx`);
  };

  const formatRecordData = (data: ExtendedPaymentRecord[]) => {
    return data.map((record) => ({
      Date: new Date(record.date).toLocaleDateString(),
      Description: record.IDNumber
        ? "FM " + record.IDNumber
        : "EXP " + record.expenseId,
      Branch: record.Admin?.branchName || record.Branches?.branchName,
      "Dr.": record.amount,
    }));
  };
  const formatCreditData = (data: ExtendedPaymentRecord[]) => {
    return data.map((record) => ({
      Date: new Date(record.date).toLocaleDateString(),
      Description: record.IDNumber || "CR " + record.creditId,
      Branch: record.Admin?.branchName || record.Branches?.branchName,
      "Cr.": record.amount,
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
      const allCredits: ExtendedPaymentRecord[] = creditResponse.data.data;
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

      const combinedDebits = [
        ...filteredTransactions.filter((transaction) => transaction.fMId),
        ...filteredExpenses,
      ];

      const combinedCredits = [
        ...filteredCredits,
        ...filteredTransactions.filter((transaction) => transaction.billId),
      ];
      const filteredSortedTransactions = combinedDebits.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const filteredSortedCredits = combinedCredits.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setPaymentRecord(filteredSortedTransactions);
      setFilteredPaymentRecord(filteredSortedTransactions);
      setCredits(filteredSortedCredits as ExtendedPaymentRecord[]);
      setFilteredCredits(filteredSortedCredits as ExtendedPaymentRecord[]);

      const sortedTransactions = combinedTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

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
        setBranchId(branchDetails.id);
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
              <p className="text-muted text-sm">Total Credits</p>
              <p className="text-xl">{credits.length}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <TbRadar2 size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total Payments</p>
              <p className="text-xl">{paymentRecord.length}</p>
            </div>
          </div>
        </div>
      </div>

      {
        <section className="flex w-full flex-col justify-between gap-5 rounded-md bg-white p-5">
          <div className="h-[63Vh] space-y-2">
            <form
              className="flex justify-between pr-2"
              onSubmit={onSearchSubmit}
            >
              <p className="pb-2 text-lg font-medium">Cash Statement</p>
              <div className="flex gap-2">
                <div className="bg-secondary flex items-center gap-2 rounded-full p-2 px-5">
                  <LuSearch size={18} />
                  <input
                    placeholder="Search"
                    className="outline-none placeholder:font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" className="cursor-pointer rounded-xl p-5">
                  <LuSearch size={30} className="mx-3 scale-125" />
                </Button>
                <div className="rounded-md bg-blue-50 p-1 pr-3">
                  <input
                    type="date"
                    className="ml-2 w-full bg-transparent outline-none"
                    onChange={onExportDateHandler}
                    value={exportDate}
                  />
                </div>
                <Button onClick={exportFilteredRecordExcel} type="button">
                  Export
                </Button>
              </div>
            </form>
            <div className="flex h-[60vh] gap-2 overflow-y-auto pr-2">
              {filteredCredits.length > 0 ? (
                <table className="w-full border-2">
                  <thead>
                    <tr>
                      <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                        <p>Date</p>
                      </th>
                      <th className="text-start font-[400] text-[#797979]">
                        <div className="flex items-center gap-2">
                          <p>Description</p>
                        </div>
                      </th>
                      <th className="text-start font-[400] text-[#797979]">
                        <div className="flex items-center gap-2">
                          <p>Branch</p>
                        </div>
                      </th>
                      <th className="text-start font-[400] text-[#797979]">
                        Cr.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCredits.map((record) => (
                      <tr
                        className="hover:bg-accent cursor-pointer"
                        key={record.id}
                      >
                        <td className="py-2">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          {record.billId && record.IDNumber}

                          {record.creditId && "CR " + record.creditId}
                        </td>
                        <td className="py-2">
                          {record.Admin?.branchName ||
                            record.Branches?.branchName}
                        </td>
                        {
                          <td className="py-2">
                            {formatter.format(parseFloat(record.amount))}
                          </td>
                        }
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
              {filteredPaymentRecord.length > 0 ? (
                <table className="w-full border-2">
                  <thead>
                    <tr>
                      <th className="flex items-center gap-2 text-start font-[400] text-[#797979]">
                        <p>Date</p>
                      </th>
                      <th className="text-start font-[400] text-[#797979]">
                        <div className="flex items-center gap-2">
                          <p>Description</p>
                        </div>
                      </th>
                      <th className="text-start font-[400] text-[#797979]">
                        <div className="flex items-center gap-2">
                          <p>Branch</p>
                        </div>
                      </th>
                      <th className="text-center font-[400] text-[#797979]">
                        Dr.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaymentRecord.map((record) => (
                      <tr
                        className="hover:bg-accent cursor-pointer"
                        key={record.id}
                      >
                        <td className="py-2">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          {record.IDNumber
                            ? "FM " + record.IDNumber
                            : "EXP " + record.expenseId}
                        </td>
                        <td className="py-2">
                          {record.Admin?.branchName ||
                          record.Branches?.branchName
                            ? record.Branches?.branchName
                            : "Bengaluru - Admin"}
                        </td>
                        <td className="py-2 text-center">
                          {formatter.format(parseFloat(record.amount))}
                        </td>
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
