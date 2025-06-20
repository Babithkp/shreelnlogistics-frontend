import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbRadar2 } from "react-icons/tb";
import { RiTruckLine } from "react-icons/ri";

import { Button } from "../ui/button";
import { getAllRecordPaymentApi } from "@/api/branch";
import { useEffect, useState } from "react";
import { getAllClientsApi } from "@/api/admin";
import { Select } from "antd";
import { filterBillByClientApi, getAllVendorsApi } from "@/api/partner";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  billInputs,
  ClientInputs,
  ExpensesInputs,
  PaymentRecord,
  VendorInputs,
} from "@/types";
import { getAllExpensesApi } from "@/api/expense";

interface ExtendedPaymentRecord extends PaymentRecord {
  billId: any;
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
  const [transactions, setTransactions] = useState<ExtendedPaymentRecord[]>([]);
  const [billData, setBillData] = useState<billInputs[]>([]);
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
  const [vendor, setVendor] = useState<VendorInputs[]>([]);
  const [expenses, setExpenses] = useState<ExpensesInputs[]>([]);

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
    totalAmount: number,
    pendingAmount: number,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image to workbook
    const imageBuffer = await fetch(
      "https://shreelnlogistics-bucket.s3.ap-south-1.amazonaws.com/logo.png",
    ).then((res) => res.arrayBuffer());

    const imageId = workbook.addImage({
      buffer: imageBuffer,
      extension: "png", // or "jpeg"
    });

    // Position image at top (cell A1)
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 300, height: 80 },
    });

    // Add some text below the image
    worksheet.getCell("A6").value = clientName;
    worksheet.getCell("A8").value = `Total Amount - INR ${totalAmount}`;
    worksheet.getCell("D8").value = `Pending Amount - INR ${pendingAmount}`;
    worksheet.getCell("K3").value = "Outstanding summary";
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.getRow(10).values = headers;

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
  const exportRecordExcel = async (data: any[], filename: string) => {
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
      Amount: bill.total,
      Received: bill.total - bill.pendingAmount,
      Tax: bill.cgstRate + bill.sgstRate + bill.igstRate,
      Pending: bill.pendingAmount,
      "0-30": bill.zeroToThirty,
      "30-60": bill.thirtyToSixty,
      ">90": bill.sixtyPlus,
    }));
  };

  const formatRecordData = (data: ExtendedPaymentRecord[]) => {
    return data.map((record) => ({
      Date: record.date,
      Description: record.IDNumber,
      Branch: record.Admin?.branchName || record.Branches?.branchName,
      "Billed value": record.transactionNumber,
      "Cr.": record.billId ? record.amount : "-",
      "Dr.": record.fMId ? record.amount : "-",
    }));
  };

  const recordPaymentsExporthandler = () => {
    exportRecordExcel(formatRecordData(transactions), "Payment Records");
  };

  const BillExporthandler = () => {
    exportToExcelWithImage(
      formatBillData(billData),
      "Outstanding",
      filterInputs.name,
      billData.reduce((acc, bill) => acc + bill.total, 0),
      billData.reduce((acc, bill) => acc + bill.pendingAmount, 0),
    );
  };

  const filterButtonHandler = async () => {
    setLoading(true);
    const response = await filterBillByClientApi(filterInputs);
    if (response?.status === 200) {
      setBillData(response.data.data);
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
    const recordResponse = await getAllRecordPaymentApi();
    const vendorResponse = await getAllVendorsApi();
    const clientResponse = await getAllClientsApi();
    const expensesResposne = await getAllExpensesApi();
    if (
      recordResponse?.status === 200 &&
      clientResponse?.status === 200 &&
      vendorResponse?.status === 200 &&
      expensesResposne?.status === 200
    ) {
      setClientsData(clientResponse.data.data);
      setVendor(vendorResponse.data.data);
      setExpenses(expensesResposne.data.data);
      const allTransactions: ExtendedPaymentRecord[] = recordResponse.data.data;
      const filteredTransactions = branchId
        ? allTransactions.filter(
            (transaction) => transaction.branchesId === branchId,
          )
        : allTransactions;
      setTransactions(filteredTransactions);
      setPaymentTotals(summarizePayments(filteredTransactions));
    }
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
    <>
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Net Balance</p>
              <p className="text-xl">
                {paymentTotals.totalCr - paymentTotals.totalDr}
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
              <p className="text-muted text-sm">Expenses</p>
              <p className="text-xl">
                INR{" "}
                {expenses
                  .reduce((acc, data) => acc + parseFloat(data.amount), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <RiTruckLine size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Vendor Outstanding</p>
              <p className="text-xl">
                INR{" "}
                {vendor
                  ?.reduce((acc, data) => acc + data.currentOutStanding, 0)
                  .toFixed(2)}
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
              <p className="text-muted text-sm">Client Receivables</p>
              <p className="text-xl">
                INR{" "}
                {clientsData
                  .reduce(
                    (acc, data) => acc + parseFloat(data.pendingPayment),
                    0,
                  )
                  .toFixed(2)}
              </p>
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
            <p className="pb-2 text-lg font-medium">Cash Statement</p>
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
                    <td className="py-2">{record.date}</td>
                    <td className="py-2">{record.IDNumber}</td>
                    <td className="py-2">
                      {record.Admin?.branchName || record.Branches?.branchName}
                    </td>
                    <td className="py-2">
                      INR {parseFloat(record.amount).toFixed(2)}
                    </td>
                    {record.billId ? (
                      <td className="py-2">
                        INR {parseFloat(record.amount).toFixed(2)}
                      </td>
                    ) : (
                      <td className="py-2">-</td>
                    )}
                    {record.fMId ? (
                      <td className="py-2 text-center">
                        INR {parseFloat(record.amount).toFixed(2)}
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
              <p>Total Value INR {paymentTotals.totalValue.toFixed(2)}</p>
              <p className="flex gap-2">
                Total CR.
                <span className="text-green-500">
                  INR {paymentTotals.totalCr.toFixed(2)}
                </span>
              </p>
              <p className="flex gap-2">
                Total DR.{" "}
                <span className="text-red-500">
                  {" "}
                  INR {paymentTotals.totalDr.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}
      {statementSection.clientOutstanding && (
        <section className="flex w-full flex-col justify-between gap-5 rounded-md bg-white p-5">
          <p className="pb-2 text-lg font-medium">Outstanding summary</p>
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
                  <tr
                    className="hover:bg-accent cursor-pointer"
                    key={bill.billNumber}
                  >
                    <td className="py-2">{bill.billNumber}</td>
                    <td className="max-w-[20rem] overflow-y-auto py-2">
                      {bill.lrData.map((lr) => lr.lrNumber)}
                    </td>
                    <td className="py-2">{bill.lrData.length === 0 ? "-" : bill.lrData[0].from}</td>
                    <td className="py-2">{bill.lrData.length === 0 ? "-" : bill.lrData[0].to}</td>
                    <td className="py-2">{bill.total}</td>
                    <td className="py-2">{bill.total - bill.pendingAmount}</td>
                    <td className="py-2">
                      {(bill.cgstRate + bill.sgstRate + bill.igstRate).toFixed(
                        2,
                      )}
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
    </>
  );
}
