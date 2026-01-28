import { useState } from "react";
import { Button } from "../ui/button";
import { BiFilterAlt } from "react-icons/bi";
import { ExpensesInputs } from "@/types";
import { formatter } from "@/lib/utils";
import {
  filterExpensesByDateApi,
  filterExpensesByDateForBranchApi,
} from "@/api/expense";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";


export default function ExpenseReport({
  branchName,
  isAdmin,
  branch,
}: {
  branchName: string;
  isAdmin: boolean;
  branch: any;
}) {
  const [filterLoading, setFilterLoading] = useState(false);
  const [expenseData, setExpenseData] = useState<ExpensesInputs[]>([]);
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
      const response = await filterExpensesByDateApi(filterInputs);
      if (response?.status === 200) {
        setExpenseData(response.data.data);
      }
    } else if (branch.branchId) {
      const response = await filterExpensesByDateForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        setExpenseData(response.data.data);
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
    worksheet.getCell("K3").value = "Expenses summary";
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

  const formatLRData = (data: ExpensesInputs[]) => {
    return data.map((expense) => ({
      "Expenses ID.": expense.expenseId,
      Title: expense.title,
      Date: expense.date,
      Category: expense.category,
      Branch: expense.Branches ? expense.Branches.branchName : expense.Admin.branchName,
      "Amount": expense.amount,
    }));
  };

  const exportBillExcelHandler = () => {
    if (expenseData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatLRData(expenseData),
      "Expenses Statement " + new Date().toDateString(),
      expenseData.reduce((acc, expense) => acc + parseFloat(expense.amount), 0),
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
          className="rounded-md bg-[#B0BEC5]  py-4 text-white w-[20%]"
          disabled={filterLoading}
          onClick={() => [setExpenseData([])]}
        >
          Reset
        </Button>
        <Button className="rounded-md w-[20%]" onClick={exportBillExcelHandler}>
          Download
        </Button>
      </section>
      <section className="flex h-[70vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        {expenseData.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">
                  Expenses ID
                </th>
                <th className="font-[500] text-slate-500">Title</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Category</th>
                <th className="font-[500] text-slate-500">Branch</th>
                <th className="font-[500] text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenseData.map((data) => (
                <tr key={data.id}>
                  <td className="py-2">{data.expenseId}</td>
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
        {expenseData.length == 0 && (
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
