import { ClientInputs, VendorInputs, WriteOffInputs } from "@/types";
import { Select as AntSelect } from "antd";
import { Button } from "../ui/button";
import { useState } from "react";
import { filterWriteOffApi } from "@/api/writeoff";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

export default function Writeoff({
  clients,
  vendors,
  branchName,
  branch,
  isAdmin,
}: {
  clients: ClientInputs[];
  vendors: VendorInputs[];
  branchName: string;
  branch: any;
  isAdmin: boolean;
}) {
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
        branchId: isAdmin ? null : branch.branchId,
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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
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

  const exportBillExcelHandler = () => {
    if (writeoffData.length === 0) {
      toast.error("No Write Off to export");
      return;
    }
    exportToExcelWithImage(
      formatWriteoffData(writeoffData),
      "Write off Statement " + new Date().toDateString(),
      filterInputs.clientName || filterInputs.vendorName,
      writeoffData.reduce((acc, FM) => acc + parseFloat(FM.amount), 0),
    );
    toast.success("File Downloaded");
  };

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
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
            className="w-[48%] bg-transparent"
          />
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
            className="w-[48%] bg-transparent"
          />
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
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
          <Button className="w-[20%] rounded-md" onClick={onFilterHandler}>
            {filterLoading ? "Loading..." : "Filter"}
          </Button>
          <Button
            variant={"outline"}
            className="w-[20%] rounded-md bg-[#B0BEC5] py-4 text-white"
            disabled={filterLoading}
            onClick={() => [setWriteoffData([])]}
          >
            Reset
          </Button>
          <Button
            className="w-[20%] rounded-md"
            onClick={exportBillExcelHandler}
          >
            Download
          </Button>
        </div>
      </section>
      <section className="flex h-[65vh] w-full flex-col gap-5 overflow-y-auto rounded-md bg-white text-xs">
        <table>
          <thead>
            <tr>
              <th className="text-start font-[500] text-slate-500">Slno</th>
              <th className="font-[500] text-slate-500">ID Number</th>
              <th className="font-[500] text-slate-500">Customer Name</th>
              <th className="font-[500] text-slate-500">Date</th>
              <th className="font-[500] text-slate-500">Amount</th>
              <th className="w-100 font-[500] text-slate-500">Reason</th>
            </tr>
          </thead>
          <tbody>
            {writeoffData.map((data, i) => (
              <tr key={data.id}>
                <td className="py-2">{i + 1}</td>
                <td className="py-2 text-center">{data.IDNumber}</td>
                <td className="py-2 text-center">{data.vendorName}</td>
                <td className="py-2 text-center">
                  {new Date(data.date).toLocaleDateString()}
                </td>
                <td className="py-2 text-center">{data.amount}</td>
                <td className="py-2 text-center">{data.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
