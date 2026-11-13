import { BranchInputs, ClientInputs, LrInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  filterLRForClientApi,
  filterLRForClientForBranchApi,
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

export default function LRReport({
  client,
  branchName,
  isAdmin,
  branch,
  branchList,
}: {
  client: ClientInputs[];
  branchName: string;
  isAdmin: boolean;
  branch: any;
  branchList: BranchInputs[];
}) {
  const [LRData, setLRData] = useState<LrInputs[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedBranchId, setSelectedIdBranch] = useState<string>();
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
    setFilterLoading(true);
    if (isAdmin) {
      if (selectedBranchId) {
        const response = await filterLRForClientForBranchApi(
          filterInputs,
          selectedBranchId,
        );
        if (response?.status === 200) {
          const allLR = response.data.data;
          setLRData(allLR);
        }
      } else {
        const response = await filterLRForClientApi(filterInputs);
        if (response?.status === 200) {
          const allLR = response.data.data;
          setLRData(allLR);
        }
      }
    } else if (branch.branchId) {
      const response = await filterLRForClientForBranchApi(
        filterInputs,
        branch.branchId,
      );
      if (response?.status === 200) {
        const allLR = response.data.data;
        setLRData(allLR);
      }
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
    worksheet.getCell("K3").value = "LR summary";
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

  const formatLRData = (data: LrInputs[]) => {
    return data.map((lr) => ({
      "LR No.": lr.lrNumber,
      Date: lr.date,
      Origin: lr.from,
      Destination: lr.to,
      "Vehicle Number": lr.Vehicle?.vehicleNumber ?? "-",
      "Freight Amount": lr.totalAmt,
    }));
  };

  const exportBillExcelHandler = async () => {
    if (LRData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    const saved = await exportToExcelWithImage(
      formatLRData(LRData),
      "LR Statement " + new Date().toDateString(),
      filterInputs.name,
      LRData.reduce((acc, FM) => acc + FM.totalAmt, 0),
    );
    if (saved) toast.success("File Downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <ReportFiltersCard
        onGenerate={onFilterHandler}
        onReset={() => setLRData([])}
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
          { label: "Total Records", value: LRData.length },
          {
            label: "Total Value",
            value: formatter.format(
              LRData.reduce((acc, lr) => acc + lr.totalAmt, 0),
            ),
          },
        ]}
      />

      <ReportExportRow onExport={exportBillExcelHandler} />

      <ReportPreviewCard isEmpty={LRData.length === 0}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${reportTableHeadClass} pl-0`}>LR#</th>
              <th className={reportTableHeadClass}>Client Name</th>
              <th className={reportTableHeadClass}>Date</th>
              <th className={reportTableHeadClass}>Origin</th>
              <th className={reportTableHeadClass}>Destination</th>
              <th className={`${reportTableHeadClass} text-right`}>
                Freight Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {LRData.map((data) => (
              <tr key={data.id} className={reportTableRowClass}>
                <td className="py-2.5">{data.lrNumber}</td>
                <td className="py-2.5">{data.client.name}</td>
                <td className="py-2.5">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td className="py-2.5">{data.from}</td>
                <td className="py-2.5">{data.to}</td>
                <td className="py-2.5 text-right">
                  {formatter.format(data.totalAmt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPreviewCard>
    </div>
  );
}
