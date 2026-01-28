import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbRadar2 } from "react-icons/tb";
import { Button } from "../ui/button";
import { getAllRecordPaymentApi, getAllStatementsApi } from "@/api/branch";
import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  CreditInputs,
  PaymentRecord,
} from "@/types";
import { getAllCreditApi } from "@/api/expense";
import { formatter } from "@/lib/utils";
import { toast } from "react-toastify";
import { Skeleton } from "antd";

interface ExtendedPaymentRecord extends PaymentRecord {
  billId: any;
  creditId: any;
  fMId: any;
  branchesId: string;
  Admin?: {
    branchName: string;
  };
  Branches?: {
    branchName: string;
  };
}
export default function Statements() {
  const [branchId, setBranchId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ExtendedPaymentRecord[]>([]);


  const [paymentTotals, setPaymentTotals] = useState({
    totalValue: 0,
    totalCr: 0,
    totalDr: 0,
  });
  const [exportDate, setExportDate] = useState("");

  const onExportDateHandler = async (e: any) => {
    setExportDate(e.target.value);
    const response = await getAllStatementsApi(e.target.value);
    if (response?.status === 200) {
      const combinedTransactions = [
        ...response.data.data.payments,
        ...response.data.data.credits,
      ];
      setTransactions(combinedTransactions as ExtendedPaymentRecord[]);
    }
  };

  const exportFilteredRecordExcel = async () => {
    exportRecordExcel(formatRecordData(transactions), `Cash Statement-${exportDate}`)
    if (!branchId) {
      fetchTransactions();
    } else if (branchId) {
      fetchTransactions(branchId);
    }
    setExportDate("");
    toast.success("File Downloaded");
  }




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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
  };





  const formatRecordData = (data: ExtendedPaymentRecord[]) => {
    return data.map((record) => ({
      Date: new Date(record.date).toLocaleDateString(),
      Description: record.IDNumber,
      Branch: record.Admin?.branchName || record.Branches?.branchName,
      "Billed value": record.amount,
      "Cr.": record.billId ? record.amount : "-",
      "Dr.": record.fMId ? record.amount : "-",
    }));
  };





  function summarizePayments(paymentRecords: ExtendedPaymentRecord[]) {
    let totalValue = 0;
    let totalCr = 0;
    let totalDr = 0;

    for (const record of paymentRecords) {
      const amount = parseFloat(record.amount || "0");
      totalValue += amount;

      if (record.fMId) {
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
    if (
      recordResponse?.status === 200 &&
      creditResponse?.status === 200
    ) {
      const allTransactions: ExtendedPaymentRecord[] = recordResponse.data.data;
      const allCredits: CreditInputs[] = creditResponse.data.data;
      const filteredTransactions = branchId
        ? allTransactions.filter(
          (transaction) => transaction.branchesId === branchId,
        )
        : allTransactions;
      const filteredCredits = branchId
        ? allCredits.filter((credit) => credit.branchesId === branchId)
        : allCredits;

      const combinedTransactions = [
        ...filteredTransactions,
        ...filteredCredits,
      ];
      const sortedTransactions = combinedTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setTransactions(sortedTransactions as ExtendedPaymentRecord[]);

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
              <p className="text-muted text-sm">Total Transaction</p>
              <p className="text-xl">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {(
        <section className="flex w-full flex-col justify-between gap-5 rounded-md bg-white p-5">
          <div className="h-[63Vh] ">
            <div className="flex justify-between pr-2">
              <p className="pb-2 text-lg font-medium">Cash Statement</p>
              <div className="flex gap-2">
                <div className="rounded-md bg-blue-50 p-1 pr-3">
                  <input
                    type="date"
                    className="ml-2 w-full bg-transparent outline-none"
                    onChange={onExportDateHandler}
                    value={exportDate}
                  />
                </div>
                <Button onClick={exportFilteredRecordExcel}>Export</Button>
              </div>
            </div>
            <div className="overflow-y-auto pr-2 h-[60vh]">
              {
                transactions.length > 0 ?
                <table className="w-full">
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
                      Billed value
                    </th>
                    <th className="text-start font-[400] text-[#797979]">Cr.</th>
                    <th className="text-center font-[400] text-[#797979]">Dr.</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((record) => (
                    <tr
                      className="hover:bg-accent cursor-pointer"
                      key={record.id}
                    >
                      <td className="py-2">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        {record.creditId ? "CR" : record.fMId ? "FM" : ""}{" "}
                        {record.IDNumber ?? record.creditId}
                      </td>
                      <td className="py-2">
                        {record.Admin?.branchName || record.Branches?.branchName}
                      </td>
                      <td className="py-2">
                        {formatter.format(parseFloat(record.amount))}
                      </td>
                      {record.billId || record.creditId ? (
                        <td className="py-2">
                          {formatter.format(parseFloat(record.amount))}
                        </td>
                      ) : (
                        <td className="py-2">-</td>
                      )}
                      {record.fMId ? (
                        <td className="py-2 text-center">
                          {formatter.format(parseFloat(record.amount))}
                        </td>
                      ) : (
                        <td className="py-2 text-center">-</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>:
                <div className="flex w-full h-full items-center justify-center">
                  <Skeleton active  rootClassName="w-full h-full" paragraph={{ rows: 50 }} />
                </div>
              }
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
      )}
    </div>
  );
}
