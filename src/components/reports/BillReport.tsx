import { billInputs, BranchInputs, ClientInputs, LrInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  filterBillLRByClientApi,
  filterBillLRByClientForBranchApi,
} from "@/api/partner";
import { formatter } from "@/lib/utils";
import { saveExcelFile } from "@/lib/exportFile";
import ExcelJS from "exceljs";
import {
  ReportFiltersCard,
  ReportStatsRow,
  ReportExportRow,
  ReportPreviewCard,
  ReportDateField,
  reportTableHeadClass,
  reportTableRowClass,
} from "./ReportUI";

export default function BillReport({
  branch,
  isAdmin,
  branchName = "All",
  client,
  branchList,
}: {
  branch: any;
  isAdmin: boolean;
  branchName: string;
  client: ClientInputs[];
  branchList: BranchInputs[];
}) {
  const [selectedBranchId, setSelectedIdBranch] = useState<string>();
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
      if (selectedBranchId) {
        const response = await filterBillLRByClientForBranchApi(
          filterInputs,
          selectedBranchId,
        );
        if (response?.status === 200) {
          const allBill = response.data.data;
          setBillData(allBill.bills);
          setFilteredBillData(allBill.bills);
          setPendingLRs(allBill.LRs);
        }
      } else {
        const response = await filterBillLRByClientApi(filterInputs);
        if (response?.status === 200) {
          const allBill = response.data.data;
          setBillData(allBill.bills);
          setFilteredBillData(allBill.bills);
          setPendingLRs(allBill.LRs);
        }
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
    return saveExcelFile(buffer, filename);
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

  const exportBillExcelHandler = async () => {
    if (filteredBillData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    const saved = await exportToExcelWithImage(
      formatFMData(filteredBillData),
      "Client Statement " + new Date().toDateString(),
      filterInputs.name,
      filteredBillData.reduce((acc, FM) => acc + FM.subTotal, 0),
      filteredBillData.reduce((acc, FM) => acc + FM.pendingAmount, 0),
      formatLRData(pendingLRs),
      pendingLRs.reduce((acc, lr) => acc + lr.totalAmt, 0),
    );
    if (saved) toast.success("File Downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <ReportFiltersCard
        onGenerate={onFilterHandler}
        onReset={() => [
          setFilteredBillData([]),
          setPendingLRs([]),
          setBillData([]),
        ]}
        loading={filterLoading}
      >
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
          className="w-full bg-transparent"
        />
        {isAdmin && (
          <AntSelect
            options={[
              { value: null, label: "All" },
              ...branchList?.map((branch: BranchInputs) => ({
                value: branch.id,
                label: branch.branchName,
              })),
            ]}
            onChange={(value) => {
              setSelectedIdBranch(value);
            }}
            value={selectedBranchId || null}
            size="large"
            placeholder="Select a Branch"
            className="w-full bg-transparent"
          />
        )}
        <AntSelect
          showSearch
          options={[
            { label: "All", value: "All" },
            { label: "Payment Pending", value: "Payment Pending" },
            { label: "Payment Received", value: "Cleared" },
          ]}
          onChange={(value) => {
            onCategoryFilterHandler(value);
          }}
          size="large"
          placeholder="Select a category"
          className="w-full bg-transparent"
        />
        <ReportDateField
          label="Date From"
          value={filterInputs.from}
          onChange={(value) =>
            setFilterInputs({ ...filterInputs, from: value })
          }
        />
        <ReportDateField
          label="Date To"
          value={filterInputs.to}
          onChange={(value) =>
            setFilterInputs({ ...filterInputs, to: value })
          }
        />
      </ReportFiltersCard>

      {pendingLRs.length > 0 && (
        <p className="text-sm font-medium text-slate-600">
          {pendingLRs.length} LRs pending to create Bill
        </p>
      )}

      <ReportStatsRow
        stats={[
          { label: "Total Records", value: filteredBillData.length },
          {
            label: "Total Value",
            value: formatter.format(
              filteredBillData.reduce((acc, bill) => acc + bill.subTotal, 0),
            ),
          },
          {
            label: "Pending Payment",
            value: formatter.format(
              filteredBillData.reduce(
                (acc, bill) => acc + bill.pendingAmount,
                0,
              ),
            ),
          },
        ]}
      />

      <ReportExportRow onExport={exportBillExcelHandler} />

      <ReportPreviewCard isEmpty={filteredBillData.length === 0}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${reportTableHeadClass} pl-0`}>Bill ID</th>
              <th className={reportTableHeadClass}>Client Name</th>
              <th className={reportTableHeadClass}>Client GSTIN</th>
              <th className={reportTableHeadClass}>Client address</th>
              <th className={reportTableHeadClass}>Date</th>
              <th className={reportTableHeadClass}>Freight Amount</th>
              <th className={reportTableHeadClass}>Payment Recieved</th>
              <th className={reportTableHeadClass}>Payment Recieved Date</th>
              <th className={reportTableHeadClass}>Pending Payment</th>
              <th className={reportTableHeadClass}>Deduction</th>
              <th className={`${reportTableHeadClass} text-right`}>TDS</th>
            </tr>
          </thead>
          <tbody>
            {filteredBillData.map((data) => (
              <tr key={data.id} className={reportTableRowClass}>
                <td className="py-2.5">{data.billNumber}</td>
                <td className="py-2.5">{data.Client.name}</td>
                <td className="py-2.5">{data.Client.GSTIN}</td>
                <td className="max-w-30 py-2.5">
                  {data.Client.address.substring(0, 30)}...
                </td>
                <td className="py-2.5">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td className="py-2.5">{formatter.format(data.subTotal)}</td>
                <td className="py-2.5">
                  {formatter.format(
                    parseFloat(data.zeroToThirty) +
                      parseFloat(data.thirtyToSixty) +
                      parseFloat(data.sixtyPlus),
                  )}
                </td>
                <td className="py-2.5">
                  {data.PaymentRecords.length > 0
                    ? new Date(
                        data.PaymentRecords[
                          data.PaymentRecords.length - 1
                        ].date,
                      ).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-2.5">
                  {formatter.format(data.pendingAmount)}
                </td>
                <td className="py-2.5">{data.WriteOff?.amount || 0}</td>
                <td className="py-2.5 text-right">
                  {formatter.format(
                    data.subTotal * (data?.tds ? data?.tds / 100 : 0.01),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPreviewCard>
    </div>
  );
}
