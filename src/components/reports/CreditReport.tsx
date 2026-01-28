import { useState } from "react";
import { Button } from "../ui/button";
import { BiFilterAlt } from "react-icons/bi";
import { CreditInputs } from "@/types";
import { formatter } from "@/lib/utils";

import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import {
  filterCreditByDateApi,
  filterCreditByDateForBranchApi,
} from "@/api/expense";
export default function CreditReport({
  branchName,
  isAdmin,
  branch,
}: {
  branchName: string;
  isAdmin: boolean;
  branch: any;
}) {
  const [filterLoading, setFilterLoading] = useState(false);
  const [creditData, setCreditData] = useState<CreditInputs[]>([]);
  const [filterInputs, setFilterInputs] = useState<{
    from: string;
    to: string;
  }>({
    from: "",
    to: "",
  });

  const onFilterHandler = async () => {
    setFilterLoading(true);
    if (isAdmin) {
      const response = await filterCreditByDateApi(filterInputs);
      if (response?.status === 200) {
        setCreditData(response.data.data);
      }
    } else if (branch.branchId) {
      const response = await filterCreditByDateForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        setCreditData(response.data.data);
      }
    }
    setFilterLoading(false);
  };

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    totalAmount: number,
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
    worksheet.getCell("A8").value = `Total Amount - INR ${totalAmount}`;
    worksheet.getCell("K3").value = "Credit summary";
    worksheet.getCell("A6").value = `${branchName}`;
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

    // Generate and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
  };

  const formatLRData = (data: CreditInputs[]) => {
    return data.map((credit) => ({
      "Credit ID.": credit.creditId,
      Title: credit.title,
      Date: credit.date,
      Category: credit.category,
      Branch: credit.Branches
        ? credit.Branches.branchName
        : credit.Admin.branchName,
      Amount: credit.amount,
    }));
  };

  const exportCreditExcelHandler = () => {
    if (creditData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatLRData(creditData),
      "Credit Statement " + new Date().toDateString(),
      creditData.reduce((acc, credit) => acc + parseFloat(credit.amount), 0),
    );
    toast.success("File Downloaded");
  };
  return (
    <>
      <section className="flex w-full items-center justify-between gap-3">
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
        <Button className="rounded-md w-[20%]" onClick={onFilterHandler}>
          {filterLoading ? "Loading..." : "Filter"}
        </Button>
        <Button
          variant={"outline"}
          className="rounded-md bg-[#B0BEC5] w-[20%] py-4 text-white"
          disabled={filterLoading}
          onClick={() => [setCreditData([])]}
        >
          Reset
        </Button>
        <Button className="rounded-md w-[20%]" onClick={exportCreditExcelHandler}>
          Download
        </Button>
      </section>
      <section className="flex h-[70vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        {creditData.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">
                  Credit ID
                </th>
                <th className="font-[500] text-slate-500">Title</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Category</th>
                <th className="font-[500] text-slate-500">Branch</th>
                <th className="font-[500] text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {creditData.map((data) => (
                <tr key={data.id}>
                  <td className="py-2">{data.creditId}</td>
                  <td className="py-2 text-center">{data.title}</td>
                  <td className="py-2 text-center">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-center">{data.category}</td>
                  <td className="py-2 text-center">
                    {data.Branches
                      ? data.Branches.branchName
                      : data.Admin.branchName}
                  </td>
                  <td className="py-2 text-center">
                    {formatter.format(parseFloat(data.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {creditData.length == 0 && (
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
