
import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Skeleton } from "antd";
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

const isWithinRange = (
  date: string | undefined | null,
  start: Date,
  end: Date,
) => {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d <= end;
};

// Some nested bill/FM records (as grouped under a branch) don't always carry
// a populated `date` the way the top-level lists do, so fall back to
// `createdAt` rather than silently dropping the record from every filtered range.
const recordDate = (record: { date?: string; createdAt?: string }) =>
  record.date || record.createdAt;

const filterDashboardDataByRange = (
  source: DashboardData | undefined,
  range: [string, string] | null,
): DashboardData | undefined => {
  if (!source || !range) return source;

  const start = new Date(range[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range[1]);
  end.setHours(23, 59, 59, 999);

  return {
    ...source,
    billData: source.billData.filter((bill) =>
      isWithinRange(recordDate(bill), start, end),
    ),
    FMData: source.FMData.filter((fm) =>
      isWithinRange(recordDate(fm), start, end),
    ),
    clientData: source.clientData.map((client) => ({
      ...client,
      bill: (client.bill || []).filter((bill) =>
        isWithinRange(recordDate(bill), start, end),
      ),
    })),
    branchData: source.branchData.map((branch) => ({
      ...branch,
      bill: (branch.bill || []).filter((bill) =>
        isWithinRange(recordDate(bill), start, end),
      ),
      FM: (branch.FM || []).filter((fm) =>
        isWithinRange(recordDate(fm), start, end),
      ),
    })),
    overAllBranchData: source.overAllBranchData.map((branch) => ({
      ...branch,
      bill: (branch.bill || []).filter((bill) =>
        isWithinRange(recordDate(bill), start, end),
      ),
      FM: (branch.FM || []).filter((fm) =>
        isWithinRange(recordDate(fm), start, end),
      ),
    })),
  };
};

export default function Dashboard({
  data,
  dateRange = null,
}: {
  data?: DashboardData;
  dateRange?: [string, string] | null;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [sourceData, setSourceData] = useState<DashboardData | undefined>(
    data,
  );

  const dashboardData = filterDashboardDataByRange(sourceData, dateRange);

  const totalInvoice = dashboardData?.billData
    .reduce((acc, bill) => acc + bill.subTotal, 0)
    .toFixed(2);

  const totalOutStanding = dashboardData?.billData
    .reduce((acc, bill) => acc + bill.pendingAmount, 0)



  const getMonthlyRevenueChange = (): number => {
    if (!dashboardData?.billData?.length) return 0;

    const latestBillDate = dashboardData.billData.reduce(
      (latest, bill) => {
        const d = new Date(bill.date);
        return d > latest ? d : latest;
      },
      new Date(dashboardData.billData[0].date)
    );

    const thisMonth = latestBillDate.getUTCMonth();
    const thisYear = latestBillDate.getUTCFullYear();

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    for (const bill of dashboardData.billData) {
      const billDate = new Date(bill.date);
      const billMonth = billDate.getUTCMonth();
      const billYear = billDate.getUTCFullYear();
      const amount = Number(bill.subTotal) || 0;

      if (billYear === thisYear && billMonth === thisMonth) {
        thisMonthRevenue += amount;
      }

      if (billYear === lastMonthYear && billMonth === lastMonth) {
        lastMonthRevenue += amount;
      }
    }

    if (lastMonthRevenue === 0) return 0;

    return Number(
      (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2)
    );
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
    const last6Months = dateRange ? result : result.slice(-6);
    return last6Months;
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
    }).sort((a, b) => b.value - a.value);
    return chartData;
  };

  async function fetchDashboardData() {
    const time1 = new Date().getTime();
    const response = await getDashboardDataApi();
    if (response?.status === 200) {
      setSourceData(response.data.data);
    }
    const time2 = new Date().getTime();
    console.log(
      "Dashboard Data Fetched in " + (time2 - time1) / 1000 + " seconds",
    );
  }

  async function fetchDashboardDataForBranch(branchId: string) {
    const response = await getDashboardDataForBranchApi(branchId);
    if (response?.status === 200) {
      setSourceData(response.data.data);
    }
  }
  const barData = dashboardData?.branchData
    ? getBillOfBranchTotalForPieChart(dashboardData.branchData)
    : [];

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
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 lg:grid-cols-12">
        <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-3 lg:col-span-3">
          <p className="text-2xl font-semibold text-slate-900">
            {totalInvoice
              ? formatter.format(parseInt(totalInvoice || "0"))
              : <Skeleton.Button active rootClassName="w-20 h-7" shape="square" />}
          </p>
          <p
            className={`mt-1 text-xs font-medium ${getMonthlyRevenueChange() > 0 ? "text-emerald-500" : "text-red-500"
              }`}
          >
            {dashboardData ? (
              `${getMonthlyRevenueChange() > 0 ? "+" : ""}${getMonthlyRevenueChange()}%`
            ) : (
              <Skeleton.Button active rootClassName="w-14 h-4" shape="square" />
            )}{" "}
            <span className="font-normal text-slate-400">vs Last month</span>
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Total Invoicing value
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:col-span-3 lg:col-span-3">
          <p className="text-2xl font-semibold text-slate-900">
            {totalOutStanding
              ? formatter.format(totalOutStanding)
              : <Skeleton.Button active rootClassName="w-20 h-7" shape="square" />}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Total Outstanding value
          </p>
        </div>

        {isAdmin && (
          <div className="col-span-1 flex flex-col justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
            <p className="text-xl font-semibold text-slate-900">
              {dashboardData ? (
                dashboardData.branchData.length
              ) : (
                <Skeleton.Button active rootClassName="w-12 h-7" shape="square" />
              )}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">Branches</p>
          </div>
        )}

        <div className="col-span-1 flex flex-col justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
          <p className="text-xl font-semibold text-slate-900">
            {dashboardData ? (
              dashboardData.clientData.length
            ) : (
              <Skeleton.Button active rootClassName="w-12 h-7" shape="square" />
            )}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Total Clients</p>
        </div>

        <div className="col-span-1 flex flex-col justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
          <p className="text-xl font-semibold text-slate-900">
            {dashboardData ? (
              dashboardData.vendorCount
            ) : (
              <Skeleton.Button active rootClassName="w-12 h-7" shape="square" />
            )}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Vendors</p>
        </div>
      </div>

      {/* Revenue + Branch performance */}
      <section className={`grid gap-5 ${isAdmin ? "lg:grid-cols-[1fr_380px]" : ""}`}>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-10">
              <div>
                <p className="text-sm text-slate-500">Total Bill Amount</p>
                <p className="text-xl font-semibold text-slate-900">
                  {totalInvoice
                    ? formatter.format(parseInt(totalInvoice || "0"))
                    : <Skeleton.Button active rootClassName="w-24 h-6" shape="square" />}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Recieved Amount</p>
                <p className="text-xl font-semibold text-slate-900">
                  {dashboardData ? (
                    getRecordPayments()
                  ) : (
                    <Skeleton.Button active rootClassName="w-24 h-6" shape="square" />
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-semibold text-slate-700">
                Invoice vs Freight Amount
              </p>
              <p className="text-xs text-slate-400">
                {dateRange ? "Filtered range" : "Monthly comparison"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formatGraphData()}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const date = new Date(Number(year), Number(month) - 1);
                    return date.toLocaleString("en-US", {
                      month: "short",
                    }) + "-" + year.slice(2);
                  }}
                />
                <YAxis axisLine={false} hide />
                <Tooltip />
                <Bar
                  dataKey="totalBill"
                  name="Invoice Amount"
                  fill="#2563eb"
                  barSize={24}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="totalFM"
                  name="Freight Amount"
                  fill="#93c5fd"
                  barSize={24}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#2563eb]"></div>
              <p className="font-medium text-[#2563eb]">Invoice Amount</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#93c5fd]"></div>
              <p className="font-medium text-[#60a5fa]">Freight Amount</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Branch Performance
              </p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  domain={[0, "dataMax"]}
                  axisLine={false}
                  tickLine={false}
                  hide
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip formatter={(v) => v.toLocaleString()} />

                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  minPointSize={0}
                  label={{
                    position: "right",
                    formatter: (value: number) => value.toLocaleString(),
                  }}
                >
                  {barData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Tables */}
      <section className={`grid gap-5 ${isAdmin ? "lg:grid-cols-2" : ""}`}>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-base font-semibold text-slate-900">
            Top Customers
          </p>
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {dashboardData ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="pb-2 text-left font-medium">Name</th>
                    <th className="pb-2 text-right font-medium">
                      Total Bill amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.clientData &&
                    getClientTotalBill(dashboardData?.clientData).map(
                      (client, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                        >
                          <td className="py-2.5 text-sm text-slate-700">
                            {client.name}
                          </td>
                          <td className="py-2.5 text-right text-sm font-medium text-slate-900">
                            {formatter.format(client.totalBill)}
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Skeleton active rootClassName="h-full w-full" paragraph={{ rows: 10 }} />
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-base font-semibold text-slate-900">
              Top Branches
            </p>
            {dashboardData ? (
              <div className="max-h-[320px] overflow-y-auto pr-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="pb-2 text-left font-medium">Name</th>
                      <th className="pb-2 text-right font-medium">
                        Total Invoice Amt.
                      </th>
                      <th className="pb-2 text-right font-medium">
                        Total Freight Amt.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.overAllBranchData &&
                      getTop10Branches(dashboardData?.overAllBranchData).map(
                        (client) => (
                          <tr
                            key={client.name}
                            className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                          >
                            <td className="py-2.5 text-sm text-slate-700">
                              {client.name}
                            </td>
                            <td className="py-2.5 text-right text-sm font-medium text-slate-900">
                              {formatter.format(client.totalInvoice)}
                            </td>
                            <td className="py-2.5 text-right text-sm font-medium text-slate-900">
                              {formatter.format(client.totalFreight)}
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center overflow-y-auto">
                <Skeleton active rootClassName="h-full w-full" paragraph={{ rows: 10 }} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
