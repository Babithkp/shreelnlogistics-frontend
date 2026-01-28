import { ClientInputs, LrInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { useState } from "react";
import { Button } from "../ui/button";
import { BiFilterAlt } from "react-icons/bi";
import { toast } from "react-toastify";
import {
  filterLRForClientApi,
  filterLRForClientForBranchApi,
} from "@/api/partner";
import { formatter } from "@/lib/utils";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

export default function LRReport({
  client,
  branchName,
  isAdmin,
  branch,
}: {
  client: ClientInputs[];
  branchName: string;
  isAdmin: boolean;
  branch: any;
}) {
  const [LRData, setLRData] = useState<LrInputs[]>([]);
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
    setFilterLoading(true);
    if (isAdmin) {
      const response = await filterLRForClientApi(filterInputs);
      if (response?.status === 200) {
        const allLR = response.data.data;
        setLRData(allLR);
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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
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

  const exportBillExcelHandler = () => {
    if (LRData.length === 0) {
      toast.error("No FMs to export");
      return;
    }
    exportToExcelWithImage(
      formatLRData(LRData),
      "LR Statement " + new Date().toDateString(),
      filterInputs.name,
      LRData.reduce((acc, FM) => acc + FM.totalAmt, 0),
    );
    toast.success("File Downloaded");
  };

  return (
    <>
      <section className="flex w-full items-center gap-3">
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
        <Button className="rounded-md px-10" onClick={onFilterHandler}>
          {filterLoading ? "Loading..." : "Filter"}
        </Button>
        <Button
          variant={"outline"}
          className="rounded-md bg-[#B0BEC5] px-10 py-4 text-white"
          disabled={filterLoading}
          onClick={() => [setLRData([])]}
        >
          Reset
        </Button>
        <Button className="rounded-md px-10" onClick={exportBillExcelHandler}>
          Download
        </Button>
      </section>
      <section className="flex h-[70vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        {LRData.length !== 0 && (
          <table>
            <thead>
              <tr>
                <th className="text-start font-[500] text-slate-500">LR#</th>
                <th className="font-[500] text-slate-500">Client Name</th>
                <th className="font-[500] text-slate-500">Date</th>
                <th className="font-[500] text-slate-500">Origin</th>
                <th className="font-[500] text-slate-500">Destination</th>
                <th className="font-[500] text-slate-500">Freight Amount</th>
              </tr>
            </thead>
            <tbody>
              {LRData.map((data) => (
                <tr key={data.id}>
                  <td className="py-2">{data.lrNumber}</td>
                  <td className="py-2 text-center">{data.client.name}</td>
                  <td className="py-2 text-center">
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-center">{data.from}</td>
                  <td className="py-2 text-center">{data.to}</td>
                  <td className="py-2 text-center">
                    {formatter.format(data.totalAmt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {LRData.length == 0 && (
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
