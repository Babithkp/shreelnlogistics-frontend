import { useState } from "react";
import { BranchInputs, ExpensesInputs } from "@/types";
import { formatter } from "@/lib/utils";
import {
  filterExpensesByDateApi,
  filterExpensesByDateForBranchApi,
} from "@/api/expense";
import { saveExcelFile } from "@/lib/exportFile";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import { Select as AntSelect } from "antd";
import {
  ReportFiltersCard,
  ReportStatsRow,
  ReportExportRow,
  ReportPreviewCard,
  ReportDateField,
  reportTableHeadClass,
  reportTableRowClass,
} from "./ReportUI";

export default function ExpenseReport({
  branchName,
  isAdmin,
  branch,
  branchList,
}: {
  branchName: string;
  isAdmin: boolean;
  branch: any;
  branchList: BranchInputs[];
}) {
  const [selectedBranchId, setSelectedIdBranch] = useState<string>();
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
      if (selectedBranchId) {
        const response = await filterExpensesByDateForBranchApi(
          filterInputs,
          selectedBranchId,
        );
        if (response?.status === 200) {
          setExpenseData(response.data.data);
        }
      } else {
        const response = await filterExpensesByDateApi(filterInputs);
        if (response?.status === 200) {
          setExpenseData(response.data.data);
        }
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
    return saveExcelFile(buffer, filename);
  };

  const formatLRData = (data: ExpensesInputs[]) => {
    return data.map((expense) => ({
      "Expenses ID.": expense.expenseId,
      Title: expense.title,
      Date: expense.date,
      Category: expense.category,
      Branch: expense.Branches
        ? expense.Branches.branchName
        : expense.Admin.branchName,
      Amount: expense.amount,
    }));
  };

  const exportBillExcelHandler = async () => {
    if (expenseData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    const saved = await exportToExcelWithImage(
      formatLRData(expenseData),
      "Expenses Statement " + new Date().toDateString(),
      expenseData.reduce((acc, expense) => acc + parseFloat(expense.amount), 0),
    );
    if (saved) toast.success("File Downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <ReportFiltersCard
        onGenerate={onFilterHandler}
        onReset={() => setExpenseData([])}
        loading={filterLoading}
      >
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

      <ReportStatsRow
        stats={[
          { label: "Total Records", value: expenseData.length },
          {
            label: "Total Value",
            value: formatter.format(
              expenseData.reduce(
                (acc, expense) => acc + parseFloat(expense.amount),
                0,
              ),
            ),
          },
        ]}
      />

      <ReportExportRow onExport={exportBillExcelHandler} />

      <ReportPreviewCard isEmpty={expenseData.length === 0}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${reportTableHeadClass} pl-0`}>Expenses ID</th>
              <th className={reportTableHeadClass}>Title</th>
              <th className={reportTableHeadClass}>Date</th>
              <th className={reportTableHeadClass}>Category</th>
              <th className={reportTableHeadClass}>Branch</th>
              <th className={`${reportTableHeadClass} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenseData.map((data) => (
              <tr key={data.id} className={reportTableRowClass}>
                <td className="py-2.5">{data.expenseId}</td>
                <td className="py-2.5">{data.title}</td>
                <td className="py-2.5">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td className="py-2.5">{data.category}</td>
                <td className="py-2.5">
                  {data.Branches
                    ? data.Branches.branchName
                    : data.Admin.branchName}
                </td>
                <td className="py-2.5 text-right">
                  {formatter.format(parseFloat(data.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPreviewCard>
    </div>
  );
}
