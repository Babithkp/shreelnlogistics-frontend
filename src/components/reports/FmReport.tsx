import { useState } from "react";
import { Select as AntSelect } from "antd";
import {
  filterFMLRByVendorApi,
  filterFMLRByVendorForBranchApi,
} from "@/api/partner";
import { FMInputs, LrInputs, VendorInputs } from "@/types";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import { Button } from "../ui/button";
import { BiFilterAlt } from "react-icons/bi";

export default function FmReport({
  branch,
  isAdmin,
  branchName,
  vendor,
}: {
  branch: any;
  isAdmin: boolean;
  branchName: string;
  vendor: VendorInputs[];
}) {
  const [FMStatement, setFMStatement] = useState<FMInputs[]>([]);
  const [pendingLRs, setPendingLRs] = useState<LrInputs[]>([]);
  const [FilteredFMStatement, setFilteredFMStatement] = useState<FMInputs[]>(
    [],
  );
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

  const onFilterHandler = async () => {
    if (!filterInputs.name) {
      toast.error("Please enter a name");
      return;
    }
    setPendingLRs([]);
    setFilterLoading(true);
    if (isAdmin) {
      const response = await filterFMLRByVendorApi(filterInputs);
      if (response?.status === 200) {
        const AllFM = response.data.data;

        setFMStatement(AllFM.FMs);
        setFilteredFMStatement(AllFM.FMs);
        setPendingLRs(AllFM.LRs);
      }
    } else if (branch.branchId) {
      const response = await filterFMLRByVendorForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        const AllFM = response.data.data;
        setFMStatement(AllFM.FMs);
        setFilteredFMStatement(AllFM.FMs);
        setPendingLRs(AllFM.LRs);
      }
    }
    setFilterLoading(false);
  };

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
    totalHire: number,
    totalAdvance: number,
    totalAdvancePending: number,
    pendingAmount: number,
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
    worksheet.getCell("A8").value = `Total Hire - INR ${totalHire}`;
    worksheet.getCell("A10").value = `Total Advance - INR ${totalAdvance}`;
    worksheet.getCell("D8").value =
      `Total Advance Pending - INR ${totalAdvancePending}`;
    worksheet.getCell("D10").value = `Total Outstanding - INR ${pendingAmount}`;
    worksheet.getCell("K3").value = "Vendor summary";
    worksheet.getCell("O9").value = "LR waiting for POD Generation";
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

  const formatFMData = (data: FMInputs[]) => {
    return data.map((FM) => ({
      "FM#": FM.fmNumber,
      "Vendor Name": FM.vendorName,
      Date: new Date(FM.date).toLocaleDateString(),
      "Hire Value": FM.hire,
      "Advance Paid": parseFloat(FM.advance) - FM.outStandingAdvance,
      "Advance Paid Date": getAdvancePaidDate(FM),
      Balance: FM.netBalance,
      "Balance Paid Date": getBalancePaidDate(FM),
      "Pending Advance": FM.outStandingAdvance,
      "Pending Balance": FM.outStandingBalance,
      TDS: FM.tds,
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

  const exportFMExcelHandler = () => {
    if (FilteredFMStatement.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatFMData(FilteredFMStatement),
      "Vendor Statement " + new Date().toDateString(),
      filterInputs.name,
      FilteredFMStatement.reduce((acc, FM) => acc + parseFloat(FM.hire), 0),
      FilteredFMStatement.reduce((acc, FM) => acc + parseFloat(FM.advance), 0),
      FilteredFMStatement.reduce((acc, FM) => acc + FM.outStandingAdvance, 0),
      FilteredFMStatement.reduce(
        (acc, FM) => acc + parseFloat(FM.outStandingBalance),
        0,
      ),
      formatLRData(pendingLRs),
      pendingLRs.reduce((acc, lr) => acc + lr.totalAmt, 0),
    );
    toast.success("File Downloaded");
  };

  const onCategoryFilterHandler = (value: string) => {
    if (value === "All") {
      setFilteredFMStatement(FMStatement);
    } else if (value === "Adance Paid") {
      setFilteredFMStatement(
        FMStatement.filter((FM) => FM.outStandingAdvance === 0),
      );
    } else if (value === "Advance Pending") {
      setFilteredFMStatement(
        FMStatement.filter(
          (FM) =>
            parseFloat(FM.advance) > FM.outStandingAdvance &&
            FM.outStandingAdvance !== 0,
        ),
      );
    } else if (value === "Cleared") {
      setFilteredFMStatement(
        FMStatement.filter((FM) => FM.outStandingBalance === "0"),
      );
    }
  };

  const getBalancePaidDate = (data: FMInputs) => {
    const paymentRecords = data.PaymentRecords;
    const balance =
      parseFloat(data.hire || "0") +
      parseFloat(data.detentionCharges || "0") +
      parseFloat(data.rtoCharges || "0") +
      parseFloat(data.otherCharges || "0") -
      parseFloat(data.tds || "0");

    let paidAmount = 0;
    if (paymentRecords.length > 0) {
      for (const element of paymentRecords) {
        paidAmount += parseFloat(element.amount);
        if (paidAmount >= balance) {
          return new Date(element.date).toLocaleDateString();
        }
      }
    }
    return "-";
  };

  const getAdvancePaidDate = (data: FMInputs) => {
    const paymentRecords = data.PaymentRecords;
    const advance = parseFloat(data.advance);

    let paidAmount = 0;
    if (paymentRecords.length > 0) {
      for (const element of paymentRecords) {
        paidAmount += parseFloat(element.amount);
        if (paidAmount >= advance) {
          console.log(element.date);
          return new Date(element.date).toLocaleDateString();
        }
      }
    }
    return "-";
  };

  return (
    <>
      <section className="flex flex-col  gap-3">
        <div className="flex items-center gap-3">
          <AntSelect
            showSearch
            options={[
              { value: "All", label: "All" },
              ...vendor.map((vendor) => ({
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
            placeholder="Select a vendor"
            className="w-[48%] bg-transparent"
          />
          <AntSelect
            showSearch
            options={[
              { label: "All", value: "All" },
              { label: "Adance Paid", value: "Adance Paid" },
              { label: "Advance Pending", value: "Advance Pending" },
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
          <div className="flex items-center gap-2">
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
              setFMStatement([]),
              setPendingLRs([]),
              setFilteredFMStatement([]),
            ]}
          >
            Reset
          </Button>
          <Button className="rounded-md w-[20%]" onClick={exportFMExcelHandler}>
            Download
          </Button>
        </div>
      </section>

      <section className="flex h-[66vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        {pendingLRs.length > 0 && (
          <p className="font-medium">
            {pendingLRs.length} LRs pending to create POD
          </p>
        )}
        {FilteredFMStatement.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">FM#</th>
                <th className="font-[500] text-slate-500">Vendor Name</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Hire Value</th>
                <th className="font-[500] text-slate-500">Advance Paid</th>
                <th className="font-[500] text-slate-500">Advance Paid Date</th>
                <th className="font-[500] text-slate-500">Balance</th>
                <th className="font-[500] text-slate-500">Balance Paid Date</th>
                <th className="font-[500] text-slate-500">Pending Advance</th>
                <th className="font-[500] text-slate-500">Pending Balance</th>
                <th className="text-end font-[500] text-slate-500">TDS</th>
              </tr>
            </thead>
            <tbody>
              {FilteredFMStatement.map((data) => (
                <tr key={data.fmNumber}>
                  <td className="py-2">{data.fmNumber}</td>
                  <td className="py-2 text-center">{data.vendorName}</td>
                  <td className="py-2 text-center">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-center">INR {data.hire}</td>
                  <td className="py-2 text-center">
                    INR {parseFloat(data.advance) - data.outStandingAdvance}
                  </td>
                  <td className="py-2 text-center">
                    {getAdvancePaidDate(data)}
                  </td>
                  <td className="py-2 text-center">INR {data.netBalance}</td>
                  <td className="py-2 text-center">
                    {getBalancePaidDate(data)}
                  </td>
                  <td className="py-2 text-center">
                    INR {data.outStandingAdvance}
                  </td>
                  <td className="py-2 text-center">
                    INR {data.outStandingBalance}
                  </td>
                  <td className="py-2 text-end">INR {data.tds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {FilteredFMStatement.length == 0 && (
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
