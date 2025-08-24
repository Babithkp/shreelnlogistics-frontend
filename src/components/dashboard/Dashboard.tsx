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
import {
  filterBillBymonthApi,
  filterBillBymonthForBranchApi,
} from "@/api/billing";
import {
  filterFMBymonthApi,
  filterFMBymonthForBranchApi,
} from "@/api/shipment";
import { filterBranchBymonthApi } from "@/api/branch";
import { getDashboardDataApi, getDashboardDataForBranchApi } from "@/api/admin";
import { billInputs, BranchInputs, ClientInputs, FMInputs } from "@/types";
import { formatter } from "@/lib/utils";

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

export interface DashboardData {
  clientData: ClientInputs[];
  vendorCount: string;
  overAllBranchData: BranchInputs[];
  FMData: FMInputs[];
  billData: billInputs[];
  branchData: BranchInputs[];
}

export default function Dashboard({data}:{data?: DashboardData}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardData | undefined>(data);
  

  const totalInvoice = dashboardData?.billData
    .reduce((acc, bill) => acc + bill.subTotal, 0)
    .toFixed(2);

  const getMonthlyRevenueChange = (): number => {
    if (!dashboardData) return 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    if (thisMonth === 0) return 0;

    const lastMonth = thisMonth - 1;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    for (const bill of dashboardData?.billData) {
      const billDate = new Date(bill.date);
      const billMonth = billDate.getMonth();
      const billYear = billDate.getFullYear();

      if (billYear === thisYear) {
        if (billMonth === thisMonth) {
          thisMonthRevenue += bill.subTotal;
        } else if (billMonth === lastMonth) {
          lastMonthRevenue += bill.subTotal;
        }
      }
    }

    if (lastMonthRevenue === 0) return 0;

    const percentageChange =
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    return parseFloat(percentageChange.toFixed(2));
  };

  const formatGraphData = (): GraphPoint[] => {
    if (!dashboardData) return [];
    const { billData, FMData } = dashboardData;
    const monthlyData: Record<
      MonthKey,
      { date: string; totalBill: number; totalFM: number; totalPayment: number }
    > = {};

    const getMonthKey = (date: string) => {
      const [year, month] = date?.slice(0, 10).split("-");
      return `${year}-${month}`;
    };

    billData.forEach((bill) => {
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

    FMData.forEach((fm) => {
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
      const val =
        parseFloat(fm.hire || "0") +
        parseFloat(fm.otherCharges || "0") +
        parseFloat(fm.detentionCharges || "0") +
        parseFloat(fm.rtoCharges || "0");
      const tds = parseFloat(fm.tds || "0");
      monthlyData[key].totalFM += val - tds;
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

  const getRecordPayments = () => {
    const recieved = dashboardData?.billData.reduce((total, bill) => {
      const billTotal = (bill.PaymentRecords || []).reduce((sum, record) => {
        return sum + parseFloat(record.amount || "0");
      }, 0);
      return total + billTotal;
    }, 0);
    return formatter.format(recieved ?? 0);
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

  const getTop10Branches = (branches: BranchInputs[]) => {
    const result = branches.map((branch) => {
      const totalInvoice = branch.bill?.reduce(
        (sum: number, b: any) => sum + (b.subTotal || 0),
        0,
      );

      const totalFreight = branch.FM?.reduce((sum: number, r: any) => {
        const val =
          parseFloat(r.hire || "0") +
          parseFloat(r.otherCharges || "0") +
          parseFloat(r.detentionCharges || "0") +
          parseFloat(r.rtoCharges || "0");

        const tds = parseFloat(r.tds || "0");

        return sum + (val - tds);
      }, 0);

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
    let billResponse;
    let fmResponse;
    if (isAdmin) {
      billResponse = await filterBillBymonthApi({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      fmResponse = await filterFMBymonthApi({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } else if (!isAdmin && branchId) {
      billResponse = await filterBillBymonthForBranchApi(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        branchId,
      );
      fmResponse = await filterFMBymonthForBranchApi(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        branchId,
      );
    }

    if (billResponse?.status === 200 && fmResponse?.status === 200) {
      setDashboardData((prevState) => {
        if (!prevState) return undefined;
        return {
          ...prevState,
          billData: billResponse.data.data,
          FMData: fmResponse.data.data,
        };
      });
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
    const branchResponse = await filterBranchBymonthApi({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    if (branchResponse?.status === 200) {
      const branch = branchResponse.data.data.filter(
        (item: any) => item !== null,
      );

      setDashboardData((prevState) => {
        if (!prevState) return undefined
        return {
          ...prevState,
          branchData: branch,
        };
      });
    }
  };

  async function fetchDashboardData() {
    const time1 = new Date().getTime();
    const response = await getDashboardDataApi();
    if (response?.status === 200) {
      setDashboardData(response.data.data);
    }
    const time2 = new Date().getTime();
    console.log("Dashboard Data Fetched in " + (time2 - time1) / 1000 + " seconds");
  }

  async function fetchDashboardDataForBranch(branchId: string) {
    const response = await getDashboardDataForBranchApi(branchId);
    if (response?.status === 200) {
      setDashboardData(response.data.data);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    } else if (!isAdmin && branchId) {
      fetchDashboardDataForBranch(branchId);
    }
  }, [isAdmin, branchId]);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const branch = localStorage.getItem("branchDetails");
    if (isAdmin === "true" && branch) {
      setIsAdmin(true);
    } else if (branch) {
      const branchDetails = JSON.parse(branch);
      setBranchId(branchDetails.id);
      setIsAdmin(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-10">
        <div className="flex w-full rounded-xl bg-white p-5">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-[#F4F7FE] p-3">
              <HiOutlineCurrencyRupee size={30} color="#2196F3" />
            </div>
            <div className="font-medium">
              <p className="text-muted text-xs">Total Invoicing value</p>
              <p className="text-xl">
                {formatter.format(parseInt(totalInvoice ?? "0"))}
              </p>
              <p
                className={`${getMonthlyRevenueChange() > 0 ? "text-[#05CD99]" : "text-red-500"}`}
              >
                {getMonthlyRevenueChange() || 0}%{" "}
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
                <p className="text-xl">{dashboardData?.branchData.length}</p>
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
              <p className="text-xl">{dashboardData?.clientData.length}</p>
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
              <p className="text-xl">{dashboardData?.vendorCount}</p>
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
                <p className="text-xl font-medium">
                  {formatter.format(parseInt(totalInvoice ?? "0"))}
                </p>
              </div>
              <div>
                <p>Total Recieved Amount</p>
                <p className="text-xl font-medium">{getRecordPayments()}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#008EFF]"></div>
                <p className="font-medium text-[#008EFF]">Invoice Amount</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#FF9090]"></div>
                <p className="font-medium text-[#FF9090]">Freight Amount</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatGraphData()}>
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
                name="FM Total"
                stroke="#FF9090"
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
                    data={
                      dashboardData?.branchData
                        ? getBillOfBranchTotalForPieChart(
                            dashboardData?.branchData,
                          )
                        : []
                    }
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData?.branchData &&
                      getBillOfBranchTotalForPieChart(
                        dashboardData?.branchData,
                      ).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="flex flex-col gap-1">
                  {dashboardData?.branchData &&
                    getBillOfBranchTotalForPieChart(
                      dashboardData?.branchData,
                    ).map((data, index) => (
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
                    ))}
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
              {dashboardData?.clientData &&
                getClientTotalBill(dashboardData?.clientData).map(
                  (client, i) => (
                    <tr key={i}>
                      <td className="py-2">{client.name}</td>
                      <td className="py-2 text-end">
                        {formatter.format(client.totalBill)}
                      </td>
                    </tr>
                  ),
                )}
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
                {dashboardData?.overAllBranchData &&
                  getTop10Branches(dashboardData?.overAllBranchData).map(
                    (client) => (
                      <tr key={client.name}>
                        <td className="py-2">{client.name}</td>
                        <td className="py-2 text-end">
                          {formatter.format(client.totalInvoice)}
                        </td>
                        <td className="py-2 text-end">
                          {formatter.format(client.totalFreight)}
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
