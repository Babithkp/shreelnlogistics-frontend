
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
import { Skeleton, Tooltip as InfoTooltip } from "antd";
import { Info } from "lucide-react";
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
  LRData?: { totalAmt: number; date: string }[];
  // Admin only: running-cost expenses and customer-bill write-offs.
  operatingExpenseData?: { amount: string; date: string }[];
  billWriteOffData?: { amount: string; date: string }[];
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
    LRData: source.LRData?.filter((lr) =>
      isWithinRange(lr.date, start, end),
    ),
    operatingExpenseData: source.operatingExpenseData?.filter((e) =>
      isWithinRange(e.date, start, end),
    ),
    billWriteOffData: source.billWriteOffData?.filter((w) =>
      isWithinRange(w.date, start, end),
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

// Whole rupees keep the large overview figures short enough to fit.
const overviewINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function OverviewCell({
  label,
  value,
  subValue,
  info,
}: {
  label: string;
  value?: string;
  subValue?: string;
  info?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 bg-white px-5 py-4">
      <p className="truncate text-xl font-semibold tabular-nums text-slate-900" title={value}>
        {value ?? <Skeleton.Button active rootClassName="w-20 h-7" shape="square" />}
      </p>
      {subValue && (
        <p className="truncate text-xs tabular-nums text-slate-400" title={subValue}>
          {subValue}
        </p>
      )}
      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <span className="truncate">{label}</span>
        {info}
      </div>
    </div>
  );
}

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

  // Net freight per FM: hire + other + detention + RTO charges, minus TDS
  // (same formula as the "Freight Amount" bars below).
  const totalFMAmount = dashboardData?.FMData.reduce((acc, fm) => {
    const val =
      parseFloat(fm.hire || "0") +
      parseFloat(fm.otherCharges || "0") +
      parseFloat(fm.detentionCharges || "0") +
      parseFloat(fm.rtoCharges || "0");
    return acc + (val - parseFloat(fm.tds || "0"));
  }, 0);

  // Rough gross margin: what was invoiced minus what was paid out on FMs.
  const grossMargin =
    totalInvoice !== undefined && totalFMAmount !== undefined
      ? Number(totalInvoice) - totalFMAmount
      : undefined;
  const grossMarginPercent =
    grossMargin !== undefined && Number(totalInvoice) > 0
      ? (grossMargin / Number(totalInvoice)) * 100
      : 0;

  const parseAmount = (value?: string) =>
    parseFloat((value || "0").replace(/,/g, "")) || 0;

  // Rough net margin: gross margin minus running costs and bad debts.
  const totalOperatingExpenses = dashboardData?.operatingExpenseData?.reduce(
    (acc, e) => acc + parseAmount(e.amount),
    0,
  );
  const totalBillWriteOffs = dashboardData?.billWriteOffData?.reduce(
    (acc, w) => acc + parseAmount(w.amount),
    0,
  );
  const netMargin =
    grossMargin !== undefined &&
    totalOperatingExpenses !== undefined &&
    totalBillWriteOffs !== undefined
      ? grossMargin - totalOperatingExpenses - totalBillWriteOffs
      : undefined;
  const netMarginPercent =
    netMargin !== undefined && Number(totalInvoice) > 0
      ? (netMargin / Number(totalInvoice)) * 100
      : 0;

  const totalLRAmount = dashboardData?.LRData?.reduce(
    (acc, lr) => acc + (Number(lr.totalAmt) || 0),
    0,
  );


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
      const totalInvoice =
        branch.bill?.reduce(
          (sum: number, b: any) => sum + (b.subTotal || 0),
          0,
        ) ?? 0;

      const totalFreight = branch.FM?.reduce((sum: number, r: any) => {
        const val =
          parseFloat(r.hire || "0") +
          parseFloat(r.otherCharges || "0") +
          parseFloat(r.detentionCharges || "0") +
          parseFloat(r.rtoCharges || "0");

        const tds = parseFloat(r.tds || "0");

        return sum + (val - tds);
      }, 0) ?? 0;

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
      {/* Summary card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-base font-semibold text-slate-900">
          Financial Overview
        </p>
        {/* gap-px over a light slate background draws soft dividers between
            figures only (no outer outline); the column counts divide the cell
            count evenly so no row is left half empty. */}
        <div
          className={`grid gap-px overflow-hidden bg-slate-100 ${
            isAdmin
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
              : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4"
          }`}
        >
          <OverviewCell
            label="Total Invoicing value"
            value={totalInvoice !== undefined ? overviewINR.format(Number(totalInvoice)) : undefined}
          />
          <OverviewCell
            label="Total Outstanding value"
            value={totalOutStanding !== undefined ? overviewINR.format(totalOutStanding) : undefined}
          />
          <OverviewCell
            label="Total FM Amount"
            value={totalFMAmount !== undefined ? overviewINR.format(totalFMAmount) : undefined}
          />
          <OverviewCell
            label="Total LR Amount"
            value={totalLRAmount !== undefined ? overviewINR.format(totalLRAmount) : undefined}
          />
          {isAdmin && (
            <OverviewCell
              label="Gross Margin"
              value={grossMargin !== undefined ? `${grossMarginPercent.toFixed(1)}%` : undefined}
              subValue={grossMargin !== undefined ? overviewINR.format(grossMargin) : undefined}
              info={
                <InfoTooltip
                  title={
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold">How this is calculated</p>
                      <p>Total Invoicing value − Total FM Amount</p>
                      <p className="mt-1 opacity-80">
                        FM Amount = hire + other charges + detention + RTO
                        charges − TDS. The % is that difference as a share of invoicing.
                      </p>
                      <p className="mt-1 opacity-80">
                        Rough figure only: salaries, rent, interest and other
                        running costs are not deducted.
                      </p>
                    </div>
                  }
                >
                  <button
                    type="button"
                    aria-label="How gross margin is calculated"
                    className="cursor-help text-slate-400 hover:text-slate-600"
                  >
                    <Info size={14} />
                  </button>
                </InfoTooltip>
              }
            />
          )}
          {isAdmin && (
            <OverviewCell
              label="Net Margin"
              value={netMargin !== undefined ? `${netMarginPercent.toFixed(1)}%` : undefined}
              subValue={netMargin !== undefined ? overviewINR.format(netMargin) : undefined}
              info={
                <InfoTooltip
                  title={
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold">How this is calculated</p>
                      <p>Gross Margin − Running costs − Bad debts written off</p>
                      <p className="mt-1 opacity-80">
                        Running costs are expenses such as salaries, interest,
                        rent, office, car, travel, phone, petrol and CA fees.
                        The % is that figure as a share of invoicing.
                      </p>
                      <p className="mt-1 opacity-80">
                        Not deducted: loan repayments and EMIs, owner
                        withdrawals, asset purchases, deposits, transfers and
                        TDS. Interest inside EMIs isn't recorded
                        separately, so the true margin is likely a little lower.
                      </p>
                    </div>
                  }
                >
                  <button
                    type="button"
                    aria-label="How net margin is calculated"
                    className="cursor-help text-slate-400 hover:text-slate-600"
                  >
                    <Info size={14} />
                  </button>
                </InfoTooltip>
              }
            />
          )}
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
                      <th className="pb-2 text-right font-medium">
                        Gross Margin
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
                            <td className="py-2.5 text-right">
                              <p className="text-sm font-medium text-slate-900">
                                {client.totalInvoice > 0
                                  ? `${(((client.totalInvoice - client.totalFreight) / client.totalInvoice) * 100).toFixed(1)}%`
                                  : "—"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatter.format(client.totalInvoice - client.totalFreight)}
                              </p>
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
