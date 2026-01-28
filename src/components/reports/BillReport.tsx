import { billInputs, ClientInputs, LrInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import {
  filterBillLRByClientApi,
  filterBillLRByClientForBranchApi,
} from "@/api/partner";
import { BiFilterAlt } from "react-icons/bi";
import { formatter } from "@/lib/utils";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

export default function BillReport({
  branch,
  isAdmin,
  branchName = "All",
  client,
}: {
  branch: any;
  isAdmin: boolean;
  branchName: string;
  client: ClientInputs[];
}) {
  const [billData, setBillData] = useState<billInputs[]>([]);
  const [filteredBillData, setFilteredBillData] = useState<billInputs[]>([]);
  const [pendingLRs, setPendingLRs] = useState<LrInputs[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterInputs, setFilterInputs] = useState<{
    name: string;
    from: string;
    to: string;
  }>({
    name: "",
    from: "",
    to: "",
  });

  const onCategoryFilterHandler = (value: string) => {
    if (value === "All") {
      setFilteredBillData(billData);
    } else if (value === "Payment Pending") {
      setFilteredBillData(billData.filter((FM) => FM.pendingAmount !== 0));
    } else if (value === "Cleared") {
      setFilteredBillData(billData.filter((FM) => FM.pendingAmount === 0));
    }
  };

  const onFilterHandler = async () => {
    if (!filterInputs.name) {
      toast.error("Please enter a name");
      return;
    }
    setPendingLRs([]);
    setFilterLoading(true);
    if (isAdmin) {
      const response = await filterBillLRByClientApi(filterInputs);
      if (response?.status === 200) {
        const allBill = response.data.data;
        setBillData(allBill.bills);
        setFilteredBillData(allBill.bills);
        setPendingLRs(allBill.LRs);
      }
    } else if (branch.branchId) {
      const response = await filterBillLRByClientForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        const allBill = response.data.data;
        setBillData(allBill.bills);
        setFilteredBillData(allBill.bills);
        setPendingLRs(allBill.LRs);
      }
    }
    setFilterLoading(false);
  };

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
    totalAmount: number,
    totalPending: number,
    lrData: any[],
    lrTotal: number,
  ) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add image to workbook
    const imageBuffer = await fetch(
      "https://shreeln-bucket.s3.ap-south-1.amazonaws.com/logo.png",
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
    worksheet.getCell("A10").value = `Total Pending - INR ${totalPending}`;
    worksheet.getCell("K3").value = "Bill summary";
    worksheet.getCell("O9").value = "LR waiting for Bill Generation";
    worksheet.getCell("O11").value = `Total freight amount - INR ${lrTotal}`;
    worksheet.getCell("O6").value = `${branchName}`;
    // Add headers

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      headers.forEach((key, idx) => {
        worksheet.getCell(12, idx + 1).value = key;
      });
    }

    // Add rows for Main Data
    data.forEach((item, i) => {
      Object.values(item).forEach((val, j) => {
        worksheet.getCell(13 + i, j + 1).value = val as ExcelJS.CellValue;
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

    // Generate and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
  };

  const formatFMData = (data: billInputs[]) => {
    return data.map((bill) => ({
      "Bill#": bill.billNumber,
      "Client Name": bill.Client.name,
      "Client GSTIN": bill.Client.GSTIN,
      "Client Address": bill.Client.address,
      Date: new Date(bill.date).toLocaleDateString(),
      "Freight Amount": bill.subTotal,
      "Payment Received":
        bill.zeroToThirty + bill.thirtyToSixty + bill.sixtyPlus,
      "Payment Recieved Date":
        bill.PaymentRecords.length > 0
          ? new Date(
              bill.PaymentRecords[bill.PaymentRecords.length - 1].date,
            ).toLocaleDateString()
          : "-",
      "Pending Payment": bill.pendingAmount,
      TDS: bill.subTotal * (bill?.tds ? bill?.tds / 100 : 0.01),
    }));
  };

  const formatLRData = (data: LrInputs[]) => {
    return data.map((lr) => ({
      "LR No.": lr.lrNumber,
      branchName: lr.branch?.branchName,
      Date: lr.date,
      Origin: lr.from,
      Destination: lr.to,
      "Vehicle Number": lr.Vehicle.vehicleNumber,
      "Freight Amount": lr.totalAmt,
    }));
  };

  const exportBillExcelHandler = () => {
    if (filteredBillData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatFMData(filteredBillData),
      "Client Statement " + new Date().toDateString(),
      filterInputs.name,
      filteredBillData.reduce((acc, FM) => acc + FM.subTotal, 0),
      filteredBillData.reduce((acc, FM) => acc + FM.pendingAmount, 0),
      formatLRData(pendingLRs),
      pendingLRs.reduce((acc, lr) => acc + lr.totalAmt, 0),
    );
    toast.success("File Downloaded");
  };

  return (
    <>
      <section className="flex flex-col  gap-3"> 
        <div className="flex items-center gap-3">
          <AntSelect
            showSearch
            options={[
              { value: "All", label: "All" },
              ...client?.map((vendor) => ({
                value: vendor.name,
                label: vendor.name,
              })),
            ]}
            onChange={(value) => {
              setFilterInputs({
                ...filterInputs,
                name: value,
              });
            }}
            value={filterInputs.name || null}
            size="large"
            placeholder="Select a Client"
            className="w-[48%] bg-transparent"
          />
          <AntSelect
            showSearch
            options={[
              { label: "All", value: "All" },
              { label: "Payment Pending", value: "Payment Pending" },
              { label: "Cleared", value: "Cleared" },
            ]}
            onChange={(value) => {
              onCategoryFilterHandler(value);
            }}
            size="large"
            placeholder="Select a category"
            className="w-[49%] bg-transparent"
          />
        </div>
        <div className="flex justify-between">
          <div className="flex  items-center gap-2">
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
          <div className="flex  items-center gap-2">
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
          <Button className="rounded-md w-[20%]" onClick={onFilterHandler}>
            {filterLoading ? "Loading..." : "Filter"}
          </Button>
          <Button
            variant={"outline"}
            className="rounded-md bg-[#B0BEC5] py-4 text-white w-[20%]"
            disabled={filterLoading}
            onClick={() => [
              setFilteredBillData([]),
              setPendingLRs([]),
              setBillData([]),
            ]}
          >
            Reset
          </Button>
          <Button className="rounded-md w-[20%]" onClick={exportBillExcelHandler}>
            Download
          </Button>
        </div>
      </section>
      <section className="flex h-[64vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        {pendingLRs.length > 0 && (
          <p className="font-medium">
            {pendingLRs.length} LRs pending to create Bill
          </p>
        )}
        {filteredBillData.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">
                  Bill ID
                </th>
                <th className="font-[500] text-slate-500">Client Name</th>
                <th className="font-[500] text-slate-500">Client GSTIN</th>
                <th className="font-[500] text-slate-500">Client address</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Freight Amount</th>
                <th className="font-[500] text-slate-500">Payment Recieved</th>
                <th className="font-[500] text-slate-500">
                  Payment Recieved Date
                </th>
                <th className="font-[500] text-slate-500">Pending Payment</th>
                <th className="font-[500] text-slate-500">Deduction</th>
                <th className="text-end font-[500] text-slate-500">TDS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBillData.map((data) => (
                <tr key={data.id}>
                  <td className="py-2">{data.billNumber}</td>
                  <td className="py-2 text-center">{data.Client.name}</td>
                  <td className="py-2 text-center">{data.Client.GSTIN}</td>
                  <td className="py-2 text-center max-w-30">{data.Client.address.substring(0, 30)}...</td>
                  <td className="py-2 text-center">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-center">
                    {formatter.format(data.subTotal)}
                  </td>
                  <td className="py-2 text-center">
                    {formatter.format(
                      parseFloat(data.zeroToThirty) +
                        parseFloat(data.thirtyToSixty) +
                        parseFloat(data.sixtyPlus),
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {data.PaymentRecords.length > 0
                      ? new Date(
                          data.PaymentRecords[
                            data.PaymentRecords.length - 1
                          ].date,
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-2 text-center">
                    {formatter.format(data.pendingAmount)}
                  </td>
                  <td className="py-2 text-center">
                    {data.WriteOff?.amount || 0}
                  </td>
                  <td className="py-2 text-end">
                    {formatter.format(
                      data.subTotal * (data?.tds ? data?.tds / 100 : 0.01),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredBillData.length == 0 && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-5">
            <BiFilterAlt size={60} />
            <p className="text-lg font-medium">
              Please apply filters to view the data
            </p>
          </div>
        )}
      </section>
    </>
  );
}
