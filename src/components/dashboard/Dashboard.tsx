import { IoIosGitBranch } from "react-icons/io";
import { PiUsersThree } from "react-icons/pi";
import { LiaHandsHelpingSolid } from "react-icons/lia";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DatePicker } from "antd";
const { RangePicker } = DatePicker;
import { filterBillBymonthApi } from "@/api/billing";
import { filterFMBymonthApi } from "@/api/shipment";
import { filterBranchBymonthApi } from "@/api/branch";
import { fetchAdminDataApi, getAllClientsApi } from "@/api/admin";
import { billInputs, BranchInputs, ClientInputs, FMInputs } from "@/types";

type GraphPoint = {
  date: string;
  totalBill?: number;
  totalFM?: number;
};
type MonthKey = string;

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6E97",
  "#6EE7B7",
  "#FF6699",
  "#FFB347",
  "#B19CD9",
  "#8DD1E1",
  "#83A6ED",
  "#FF7F50",
  "#FFA07A",
  "#20B2AA",
  "#9370DB",
  "#40E0D0",
  "#6495ED",
  "#D2691E",
  "#DA70D6",
];

export default function Dashboard({
  branchLength,
  clientLength,
  vendorLength,
  billData,
  fmData,
  branchData,
}: {
  branchLength: number;
  clientLength: number;
  vendorLength: number;
  billData: billInputs[];
  fmData: FMInputs[];
  branchData: BranchInputs[];
}) {
  const [bill, setBill] = useState<billInputs[]>([]);
  const [fm, setFM] = useState<FMInputs[]>([]);
  const [branch, setBranch] = useState<BranchInputs[]>([]);
  const [clients, setClients] = useState<ClientInputs[]>([]);
  const [admin, setAdmin] = useState<BranchInputs[]>();
  const [isAdmin, setIsAdmin] = useState(false);

  const getMonthlyRevenueChange = (bills: billInputs[]): number => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    if (thisMonth === 0) return 0;

    const lastMonth = thisMonth - 1;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    for (const bill of bills) {
      const billDate = new Date(bill.date);
      const billMonth = billDate.getMonth();
      const billYear = billDate.getFullYear();

      if (billYear === thisYear) {
        if (billMonth === thisMonth) {
          thisMonthRevenue += bill.total;
        } else if (billMonth === lastMonth) {
          lastMonthRevenue += bill.total;
        }
      }
    }

    if (lastMonthRevenue === 0) return 0;

    const percentageChange =
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    return parseFloat(percentageChange.toFixed(2));
  };

  const formatGraphData = (
    bills: billInputs[],
    fms: FMInputs[],
  ): GraphPoint[] => {
    const monthlyData: Record<
      MonthKey,
      { date: string; totalBill: number; totalFM: number; totalPayment: number }
    > = {};
  
    const getMonthKey = (date: string) => {
      const [year, month] = date.slice(0, 10).split("-");
      return `${year}-${month}`;
    };
  
    bills.forEach((bill) => {
      const date = bill.date.slice(0, 10);
      const key = getMonthKey(date);
  
      if (!monthlyData[key]) {
        monthlyData[key] = {
          date: `${key}`,
          totalBill: 0,
          totalFM: 0,
          totalPayment: 0,
        };
      }
  
      monthlyData[key].totalBill += bill.subTotal;
  
      if (bill.PaymentRecords) {
        const paymentSum = bill.PaymentRecords.reduce((sum, record) => {
          return sum + parseFloat(record.amount || "0");
        }, 0);
        monthlyData[key].totalPayment += paymentSum;
      }
    });
  
    fms.forEach((fm) => {
      const date = fm.date.slice(0, 10);
      const key = getMonthKey(date);
  
      if (!monthlyData[key]) {
        monthlyData[key] = {
          date: `${key}`,
          totalBill: 0,
          totalFM: 0,
          totalPayment: 0,
        };
      }
  
      monthlyData[key].totalFM += parseFloat(fm.netBalance);
    });
  
    // Convert to array and round to 2 decimals
    const result: GraphPoint[] = Object.values(monthlyData)
      .map((item) => ({
        date: item.date,
        totalBill: parseFloat(item.totalBill.toFixed(2)),
        totalFM: parseFloat(item.totalFM.toFixed(2)),
        totalPayment: parseFloat(item.totalPayment.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  
    return result;
  };
  

  const getRecordPayments = (bill: billInputs[]) => {
    return bill
      .reduce((total, bill) => {
        const billTotal = (bill.PaymentRecords || []).reduce((sum, record) => {
          return sum + parseFloat(record.amount || "0");
        }, 0);
        return total + billTotal;
      }, 0)
      .toFixed(2);
  };

  const getClientTotalBill = (clients: any[]) => {
    return clients
      .map((client) => {
        const totalBill = client.bill?.reduce(
          (sum: number, bill: any) => sum + (bill.subTotal || 0),
          0,
        );
        return {
          name: client.name,
          totalBill,
        };
      })
      .sort((a, b) => b.totalBill - a.totalBill)
      .slice(0, 10);
  };

  const getTop10Branches = (branches: any[]) => {
    const result = branches.map((branch) => {
      const totalInvoice = branch.bill?.reduce(
        (sum: number, b: any) => sum + (b.subTotal || 0),
        0,
      );

      const totalFreight = branch.FM?.reduce(
        (sum: number, r: any) => sum + parseFloat(r.netBalance || "0"),
        0,
      );

      return {
        name: branch.branchName,
        totalInvoice,
        totalFreight,
      };
    });

    return result.sort((a, b) => b.totalInvoice - a.totalInvoice).slice(0, 10);
  };

  const getBillOfBranchTotalForPieChart = (data: BranchInputs[]) => {
    const chartData = data.map((branch) => {
      const totalBillAmount = branch.bill?.reduce(
        (sum, bill) => sum + (bill.subTotal || 0),
        0,
      );
      return {
        name: branch.branchName,
        value: totalBillAmount,
      };
    });
    return chartData;
  };

  const billFilterHandler = async (dateStrings: [string, string] | null) => {
    const [startMonth, endMonth] = dateStrings || [];
    if (!startMonth || !endMonth) return;
    const startDate = new Date(`${startMonth}-01`);
    const endDate = new Date(
      new Date(`${endMonth}-01`).getFullYear(),
      new Date(`${endMonth}-01`).getMonth() + 1,
      0,
    );
    const billResponse = await filterBillBymonthApi({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    const fmResponse = await filterFMBymonthApi({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (billResponse?.status === 200 && fmResponse?.status === 200) {
      setBill(billResponse.data.data);
      setFM(fmResponse.data.data);
    }
  };
  const branchFilterHandler = async (dateStrings: [string, string] | null) => {
    const [startMonth, endMonth] = dateStrings || [];
    if (!startMonth || !endMonth) return;
    const startDate = new Date(`${startMonth}-01`);
    const endDate = new Date(
      new Date(`${endMonth}-01`).getFullYear(),
      new Date(`${endMonth}-01`).getMonth() + 1,
      0,
    );
    const billResponse = await filterBranchBymonthApi({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (billResponse?.status === 200) {
      setBranch(billResponse.data.data);
    }
  };

  async function fetchAdminData() {
    const response = await fetchAdminDataApi();
    if (response?.status === 200) {
      setBranch([response.data.data, ...branchData]);
      setAdmin([response.data.data, ...branchData]);
    }
  }

  async function fetchClientData() {
    const response = await getAllClientsApi();
    if (response?.status === 200) {
      setClients(response.data.data);
    }
  }

  useEffect(() => {
    setBill(billData);
    setFM(fmData);
    fetchAdminData();
    fetchClientData();
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "true") {
      setIsAdmin(true);
    }
  }, [billData, fmData, branchData]);

  return (
    <>
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Total Invoicing value</p>
              <p className="text-xl">
                INR{" "}
                {billData.reduce((acc, bill) => acc + bill.total, 0).toFixed(2)}
              </p>
              <p
                className={`${getMonthlyRevenueChange(billData) > 0 ? "text-[#05CD99]" : "text-red-500"}`}
              >
                {getMonthlyRevenueChange(billData) || 0}%{" "}
                <span className="text-muted text-sm font-[400]">
                  since last month
                </span>
              </p>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex w-full rounded-xl bg-white p-5">
            <div className="flex items-center gap-5">
              <div className="rounded-full bg-[#F4F7FE] p-3">
                <IoIosGitBranch size={30} color="#2196F3" />
              </div>
              <div className="font-medium">
                <p className="text-muted text-sm">Branches</p>
                <p className="text-xl">{branchLength}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <PiUsersThree size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Total Clients</p>
              <p className="text-xl">{clientLength}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <LiaHandsHelpingSolid size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-sm">Vendors</p>
              <p className="text-xl">{vendorLength}</p>
            </div>
          </div>
        </div>
      </div>
      <section className="flex justify-between gap-5">
        <div className={`flex rounded-xl bg-white p-5`}>
          <div className="flex w-[20%] flex-col justify-between gap-2 py-5">
            <div className="flex flex-col gap-3">
              <RangePicker
                picker="month"
                onChange={(_, dateStrings) => {
                  if (!dateStrings || dateStrings.length !== 2) {
                    billFilterHandler(null);
                  } else {
                    billFilterHandler(dateStrings as [string, string]);
                  }
                }}
              />
              <div className="">
                <p>Total Bill Amount</p>
                <p className="text-2xl font-medium">
                  INR{" "}
                  {billData
                    .reduce((acc, bill) => acc + bill.subTotal, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div>
                <p>Total Recieved Amount</p>
                <p className="text-2xl font-medium">
                  INR {getRecordPayments(billData)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#008EFF]"></div>
                <p className="font-medium text-[#008EFF]">Invoice Amount</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#4DB0FF]"></div>
                <p className="font-medium text-[#4DB0FF]">Freight Amount</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatGraphData(bill, fm)}>
              <XAxis dataKey="date" axisLine={false} />
              <YAxis axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="totalBill"
                name="Bill Total"
                stroke="#008EFF"
                strokeWidth={3}
              />
              <Line
                type="natural"
                dataKey="totalFM"
                name="FM Net Balance"
                stroke="#4DB0FF"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {isAdmin && (
          <div className="flex max-h-[50vh] w-[30%] justify-center overflow-y-auto rounded-xl bg-white p-5">
            <div>
              <div className="flex flex-col">
                <p className="font-medium">Branch wise performance</p>
                <RangePicker
                  picker="month"
                  onChange={(_, dateStrings) => {
                    if (!dateStrings || dateStrings.length !== 2) {
                      branchFilterHandler(null);
                    } else {
                      branchFilterHandler(dateStrings as [string, string]);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <PieChart width={190} height={200}>
                  <Pie
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    data={branch ? getBillOfBranchTotalForPieChart(branch) : []}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {branch &&
                      getBillOfBranchTotalForPieChart(branch).map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="flex flex-col gap-1">
                  {branch &&
                    getBillOfBranchTotalForPieChart(branch).map(
                      (data, index) => (
                        <div
                          className="flex max-h-[9vh] justify-between gap-8 overflow-y-auto"
                          key={data.name}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-3 rounded-full`}
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            <p className="text-sm">{data.name}</p>
                          </div>
                          <p className="text-sm">₹{data.value.toFixed(2)}</p>
                        </div>
                      ),
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="flex justify-center gap-5">
        <div
          className={`flex max-h-[40vh] w-full flex-col gap-3 overflow-y-auto rounded-xl bg-white p-5`}
        >
          <p className="text-xl font-medium">Top Customers</p>
          <table className="w-full">
            <thead>
              <tr className="text-sm text-slate-500">
                <th className="text-start font-[500]">Name</th>
                <th className="text-end font-[500]">Total Bill amount</th>
              </tr>
            </thead>
            <tbody>
              {clients &&
                getClientTotalBill(clients).map((client, i) => (
                  <tr key={i}>
                    <td className="py-2">{client.name}</td>
                    <td className="py-2 text-end">
                      ₹ {client.totalBill.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {isAdmin && (
          <div className="flex max-h-[40vh] w-full flex-col gap-3 overflow-y-auto rounded-xl bg-white p-5">
            <p className="text-xl font-medium">Top Branches</p>
            <table className="w-full">
              <thead>
                <tr className="text-sm text-slate-500">
                  <th className="text-start font-[500]">Name</th>
                  <th className="text-end font-[500]">Total Invoice Amt.</th>
                  <th className="text-end font-[500]">Total Freight Amt.</th>
                </tr>
              </thead>
              <tbody>
                {admin &&
                  getTop10Branches(admin).map((client) => (
                    <tr key={client.name}>
                      <td className="py-2">{client.name}</td>
                      <td className="py-2 text-end">
                        ₹ {client.totalInvoice.toFixed(2)}
                      </td>
                      <td className="py-2 text-end">
                        ₹ {client.totalFreight.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
