import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbRadar2 } from "react-icons/tb";

import { Button } from "../ui/button";
import { getAllRecordPaymentApi, getAllStatementsApi } from "@/api/branch";
import { useEffect, useState } from "react";
import { getAllClientsApi } from "@/api/admin";
import { Select } from "antd";
import { filterBillByClientApi } from "@/api/partner";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  billInputs,
  ClientInputs,
  CreditInputs,
  LrInputs,
  PaymentRecord,
} from "@/types";
import { getAllCreditApi } from "@/api/expense";
import { formatter } from "@/lib/utils";
import { toast } from "react-toastify";

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
  const [billData, setBillData] = useState<billInputs[]>([]);
  const [LRs, setLRs] = useState<LrInputs[]>([]);
  const [clientsData, setClientsData] = useState<ClientInputs[]>([]);
  const [statementSection, setStatementSection] = useState({
    cashStatement: true,
    clientOutstanding: false,
  });
  const [filterInputs, setFilterInputs] = useState<{
    name: string;
    from: string;
    to: string;
  }>({
    name: "",
    from: "",
    to: "",
  });
  const [loading, setLoading] = useState(false);
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
    } else if(branchId) {
      fetchTransactions(branchId);
    }
    setExportDate("");
    toast.success("File Downloaded");
  }


  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
    totalAmount: number,
    pendingAmount: number,
    lrData: any[],
    lrTotal: number,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image to workbook
    const imageBuffer = await fetch(
      "https://shreelnlogistics-bucket.s3.ap-south-1.amazonaws.com/logo.png",
    ).then((res) => res.arrayBuffer());

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png",
    });

    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 300, height: 80 },
    });

    // Header content
    worksheet.getCell("A6").value = clientName;
    worksheet.getCell("A8").value = `Total Amount - INR ${totalAmount}`;
    worksheet.getCell("D8").value = `Pending Amount - INR ${pendingAmount}`;
    worksheet.getCell("A10").value = "Outstanding Summary";
    worksheet.getCell("O9").value = "Pending LRs to be billed ";
    worksheet.getCell("O11").value = `Total freight amount - INR ${lrTotal}`;

    if (data.length > 0) {
      // Add headers for Main Data at row 13
      const mainHeaders = Object.keys(data[0]);
      mainHeaders.forEach((key, idx) => {
        worksheet.getCell(13, idx + 1).value = key; // starting at A13
      });
    }

    // Add rows for Main Data
    data.forEach((item, i) => {
      Object.values(item).forEach((val, j) => {
        worksheet.getCell(14 + i, j + 1).value = val as ExcelJS.CellValue; // rows start from 14
      });
    });

    if (lrData.length > 0) {
      // Add headers for LR Data at same row 13 but starting from column H (col 8)
      const lrHeaders = Object.keys(lrData[0]);
      lrHeaders.forEach((key, idx) => {
        worksheet.getCell(13, idx + 15).value = key; // starting at H13
      });
    }

    // Add rows for LR Data
    lrData.forEach((item, i) => {
      Object.values(item).forEach((val, j) => {
        worksheet.getCell(14 + i, j + 15).value = val as ExcelJS.CellValue; // rows start from 14, cols from H
      });
    });

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
  };

  const formatBillData = (data: billInputs[]) => {
    return data.map((bill) => ({
      Date: bill.date,
      "Bill#": bill.billNumber,
      "LR#": bill.lrData.map((lr) => lr.lrNumber).toString(),
      From: bill.lrData[0].from,
      To: bill.lrData[0].to,
      Amount: bill.subTotal,
      Received: bill.subTotal - bill.pendingAmount,
      Tax: bill.subTotal * (bill.tds ? bill.tds / 100 : 1),
      Pending: bill.pendingAmount,
      "0-30": bill.zeroToThirty,
      "30-60": bill.thirtyToSixty,
      ">90": bill.sixtyPlus,
    }));
  };

  const formatLRData = (data: LrInputs[]) => {
    return data.map((lr) => ({
      "LR No.": lr.lrNumber,
      Date: lr.date,
      Origin: lr.from,
      Destination: lr.to,
      "Vehicle Number": lr.Vehicle.vehicleNumber,
      "Freight Amount": lr.totalAmt,
    }));
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

  const recordPaymentsExporthandler = () => {
    exportRecordExcel(formatRecordData(transactions), "Payment Records");
    toast.success("File Downloaded");
  };

  const BillExporthandler = () => {
    exportToExcelWithImage(
      formatBillData(billData),
      "Outstanding",
      filterInputs.name,
      billData.reduce((acc, bill) => acc + bill.subTotal, 0),
      billData.reduce((acc, bill) => acc + bill.pendingAmount, 0),
      formatLRData(LRs),
      LRs.reduce((acc, lr) => acc + lr.totalAmt, 0),
    );
    toast.success("File Downloaded");
  };

  const filterButtonHandler = async () => {
    setLRs([]);
    setLoading(true);
    const response = await filterBillByClientApi(filterInputs);
    if (response?.status === 200) {
      setBillData(response.data.data.bills);
      setLRs(response.data.data.LRs);
      setStatementSection({
        cashStatement: false,
        clientOutstanding: true,
      });
    }
    setLoading(false);
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
    const clientResponse = await getAllClientsApi();
    if (
      recordResponse?.status === 200 &&
      clientResponse?.status === 200 &&
      creditResponse?.status === 200
    ) {
      setClientsData(clientResponse.data.data);
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
      <div className="flex gap-5 rounded-lg bg-white p-3">
        <Select
          showSearch
          options={clientsData.map((client) => ({
            value: client.name,
            label: client.name,
          }))}
          onChange={(value) => {
            setFilterInputs({
              ...filterInputs,
              name: value,
            });
          }}
          value={filterInputs.name}
          size="large"
          placeholder="Select a client"
          className="w-full bg-transparent"
        />
        <div className="flex w-[20%] items-center gap-2">
          <p>From:</p>
          <div className="rounded-md bg-blue-50 p-1 pr-3">
            <input
              type="date"
              className="ml-2 w-full bg-transparent outline-none"
              onChange={(e) => {
                setFilterInputs({
                  ...filterInputs,
                  from: e.target.value,
                });
              }}
              value={filterInputs.from}
            />
          </div>
        </div>
        <div className="flex w-[20%] items-center gap-2">
          <p>To:</p>
          <div className="rounded-md bg-blue-50 p-1 pr-3">
            <input
              type="date"
              className="ml-2 w-full bg-transparent outline-none"
              onChange={(e) => {
                setFilterInputs({
                  ...filterInputs,
                  to: e.target.value,
                });
              }}
              value={filterInputs.to}
            />
          </div>
        </div>
        <Button className="rounded-md px-10" onClick={filterButtonHandler}>
          {loading ? "Loading..." : "Filter"}
        </Button>
        <Button
          variant={"outline"}
          className="rounded-md bg-[#B0BEC5] px-10 text-white"
          onClick={() =>
            setStatementSection({
              cashStatement: true,
              clientOutstanding: false,
            })
          }
          disabled={loading}
        >
          Reset
        </Button>
        <Button
          className="rounded-md px-10"
          onClick={
            statementSection.clientOutstanding
              ? BillExporthandler
              : recordPaymentsExporthandler
          }
        >
          Export
        </Button>
      </div>
      {statementSection.cashStatement && (
        <section className="flex w-full flex-col justify-between gap-5 rounded-md bg-white p-5">
          <div className="h-[55Vh] overflow-y-auto">
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
            </table>
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
      {statementSection.clientOutstanding && (
        <section className="flex w-full flex-col justify-between gap-5 rounded-md bg-white p-5">
          <div className="flex justify-between">
            <p className="text-lg font-medium">Outstanding summary</p>
            {LRs.length > 0 && (
              <p className="font-medium">
                {LRs.length} LR Pending to be Billed
              </p>
            )}
          </div>
          {billData.length > 0 && (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-start font-[400] text-[#797979]">
                    <div className="flex items-center gap-2">
                      <p>Bill#</p>
                    </div>
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    <div className="flex items-center gap-2">
                      <p>LR#</p>
                    </div>
                  </th>
                  <th className="text-start font-[400] text-[#797979]">From</th>
                  <th className="text-start font-[400] text-[#797979]">TO</th>
                  <th className="text-start font-[400] text-[#797979]">
                    Amount
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    Received
                  </th>
                  <th className="text-start font-[400] text-[#797979]">Tax</th>
                  <th className="text-start font-[400] text-[#797979]">
                    Pending
                  </th>
                  <th className="text-start font-[400] text-[#797979]">0-30</th>
                  <th className="text-start font-[400] text-[#797979]">
                    30-60
                  </th>
                  <th className="text-start font-[400] text-[#797979]">
                    &gt;60
                  </th>
                </tr>
              </thead>
              <tbody>
                {billData.map((bill) => (
                  <tr key={bill.billNumber}>
                    <td className="py-2">{bill.billNumber}</td>
                    <td className="max-w-[20rem] overflow-y-auto py-2">
                      {bill.lrData.map((lr) => lr.lrNumber)}
                    </td>
                    <td className="py-2">
                      {bill.lrData.length === 0 ? "-" : bill.lrData[0].from}
                    </td>
                    <td className="py-2">
                      {bill.lrData.length === 0 ? "-" : bill.lrData[0].to}
                    </td>
                    <td className="py-2">{bill.subTotal}</td>
                    <td className="py-2">
                      {bill.subTotal - bill.pendingAmount}
                    </td>
                    <td className="py-2">
                      {bill.subTotal * (bill.tds ? bill.tds / 100 : 1)}
                    </td>
                    <td className="py-2">{bill.pendingAmount}</td>
                    <td className="py-2">{bill.zeroToThirty ?? 0}</td>
                    <td className="py-2">{bill.thirtyToSixty ?? 0}</td>
                    <td className="py-2">{bill.sixtyPlus ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {billData.length === 0 && (
            <div className="flex w-full justify-center p-3">
              <p className="font-medium">No data Availabe</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
