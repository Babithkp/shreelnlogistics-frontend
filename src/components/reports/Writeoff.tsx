import { BranchInputs, ClientInputs, VendorInputs, WriteOffInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { useState } from "react";
import { filterWriteOffApi } from "@/api/writeoff";
import { toast } from "react-toastify";
import { saveExcelFile } from "@/lib/exportFile";
import ExcelJS from "exceljs";
import { formatter } from "@/lib/utils";
import {
  ReportFiltersCard,
  ReportStatsRow,
  ReportExportRow,
  ReportPreviewCard,
  ReportDateField,
  reportTableHeadClass,
  reportTableRowClass,
} from "./ReportUI";

export default function Writeoff({
  clients,
  vendors,
  branchName,
  branch,
  isAdmin,
  branchList,
}: {
  clients: ClientInputs[];
  vendors: VendorInputs[];
  branchName: string;
  branch: any;
  isAdmin: boolean;
  branchList: BranchInputs[];
}) {
  const [selectedBranchId, setSelectedIdBranch] = useState<string>();
  const [writeoffData, setWriteoffData] = useState<WriteOffInputs[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterInputs, setFilterInputs] = useState<{
    clientName: string;
    vendorName: string;
    from: string;
    to: string;
  }>({
    clientName: "",
    vendorName: "",
    from: "",
    to: "",
  });

  const onFilterHandler = async () => {
    if (!filterInputs.clientName && !filterInputs.vendorName) {
      toast.error("Please enter a name");
      return;
    }
    setFilterLoading(true);
    try {
      const response = await filterWriteOffApi({
        from: filterInputs.from,
        to: filterInputs.to,
        clientName: filterInputs.clientName,
        vendorName: filterInputs.vendorName,
        branchId: isAdmin ? selectedBranchId : branch.branchId,
      });
      if (response?.status === 200) {
        const allWriteOff = response.data.data;
        setWriteoffData(allWriteOff);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something Went Wrong, Check All Fields");
    }
    setFilterLoading(false);
  };

  const exportToExcelWithImage = async (
    data: any[],
    filename: string,
    clientName: string,
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
    worksheet.getCell("A6").value = clientName;
    worksheet.getCell("A8").value = `Total Amount - INR ${totalAmount}`;
    worksheet.getCell("K3").value = "Write off summary";
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

    // Generate and download the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    return saveExcelFile(buffer, filename);
  };

  const formatWriteoffData = (data: WriteOffInputs[]) => {
    return data.map((writeoff) => ({
      "ID Number": writeoff.IDNumber,
      Date: writeoff.date,
      "Customer Name": writeoff.vendorName,
      Amount: writeoff.amount,
      Reason: writeoff.reason,
    }));
  };

  const exportBillExcelHandler = async () => {
    if (writeoffData.length === 0) {
      toast.error("No Write Off to export");
      return;
    }
    const saved = await exportToExcelWithImage(
      formatWriteoffData(writeoffData),
      "Write off Statement " + new Date().toDateString(),
      filterInputs.clientName || filterInputs.vendorName,
      writeoffData.reduce((acc, FM) => acc + parseFloat(FM.amount), 0),
    );
    if (saved) toast.success("File Downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <ReportFiltersCard
        onGenerate={onFilterHandler}
        onReset={() => setWriteoffData([])}
        loading={filterLoading}
      >
        <AntSelect
          showSearch
          options={[
            { value: "All", label: "All" },
            ...clients?.map((client) => ({
              value: client.name,
              label: client.name,
            })),
          ]}
          onChange={(value) => {
            setFilterInputs({
              ...filterInputs,
              clientName: value,
            });
          }}
          value={filterInputs.clientName || null}
          allowClear
          disabled={filterInputs.vendorName ? true : false}
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
            { value: "All", label: "All" },
            ...vendors?.map((vendor) => ({
              value: vendor.name,
              label: vendor.name,
            })),
          ]}
          onChange={(value) => {
            setFilterInputs({
              ...filterInputs,
              vendorName: value,
            });
          }}
          value={filterInputs.vendorName || null}
          disabled={filterInputs.clientName ? true : false}
          allowClear
          size="large"
          placeholder="Select a Vendors"
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

      <ReportStatsRow
        stats={[
          { label: "Total Records", value: writeoffData.length },
          {
            label: "Total Value",
            value: formatter.format(
              writeoffData.reduce(
                (acc, writeoff) => acc + parseFloat(writeoff.amount),
                0,
              ),
            ),
          },
        ]}
      />

      <ReportExportRow onExport={exportBillExcelHandler} />

      <ReportPreviewCard isEmpty={writeoffData.length === 0}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${reportTableHeadClass} pl-0`}>Slno</th>
              <th className={reportTableHeadClass}>ID Number</th>
              <th className={reportTableHeadClass}>Customer Name</th>
              <th className={reportTableHeadClass}>Date</th>
              <th className={reportTableHeadClass}>Amount</th>
              <th className={reportTableHeadClass}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {writeoffData.map((data, i) => (
              <tr key={data.id} className={reportTableRowClass}>
                <td className="py-2.5">{i + 1}</td>
                <td className="py-2.5">{data.IDNumber}</td>
                <td className="py-2.5">{data.vendorName}</td>
                <td className="py-2.5">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td className="py-2.5">{data.amount}</td>
                <td className="py-2.5">{data.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPreviewCard>
    </div>
  );
}
