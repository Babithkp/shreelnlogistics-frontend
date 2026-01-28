
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { DatePicker, Skeleton } from "antd";
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

export default function Dashboard({ data }: { data?: DashboardData }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [dashboardData, setDashboardData] = useState<DashboardData | undefined>(
    data,
  );
  const [filtered, setFiltered] = useState(false);

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
    const last6Months = filtered ? result : result.slice(-6);
    return last6Months;
  };


  const outstandingGraphData = (): GraphPoint[] => {
    if (!dashboardData) return [];
    const { billData } = dashboardData;
    const monthlyData: Record<
      MonthKey,
      { date: string; totalOutStanding: number; }
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
          totalOutStanding: 0,
        };
      }
      monthlyData[key].totalOutStanding += bill.pendingAmount;
    });



    const result: GraphPoint[] = Object.values(monthlyData)
      .map((item) => ({
        date: item.date,
        totalOutStanding: parseFloat(item.totalOutStanding.toFixed(2)),
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
    }).sort((a, b) => b.value - a.value);
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
      setFiltered(true);
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
        if (!prevState) return undefined;
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
    console.log(
      "Dashboard Data Fetched in " + (time2 - time1) / 1000 + " seconds",
    );
  }

  async function fetchDashboardDataForBranch(branchId: string) {
    const response = await getDashboardDataForBranchApi(branchId);
    if (response?.status === 200) {
      setDashboardData(response.data.data);
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
    <div className="flex flex-col gap-5">
      <div className="flex  justify-between">
        <div className="flex w-[32%] rounded-xl items-center gap-5 justify-center bg-white p-3">
          <div className="font-medium">
            <p className="text-xl">
              {totalInvoice ? formatter.format(parseInt(totalInvoice || "0"))
                : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}
            </p>
            <p
              className={`${getMonthlyRevenueChange() > 0 ? "text-[#05CD99]" : "text-red-500"} text-xs`}
            >
              {dashboardData ?
                getMonthlyRevenueChange() :
                <Skeleton.Button active rootClassName="w-full h-full" shape="square" />
              }%{" "}
              <span className="text-muted  font-[400]">
                since last month
              </span>
            </p>
            <p className="font-medium text-xs">Total Invoicing value</p>
          </div>
          <div className="w-full h-[10vh]  ">
            <ResponsiveContainer width="100%" height="100%" >
              <LineChart data={formatGraphData()}>
                <XAxis hide dataKey="date" axisLine={false}
                  tickFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const date = new Date(Number(year), Number(month) - 1);
                    return date.toLocaleString("en-US", {
                      month: "short",
                    }) + "-" + year.slice(2);
                  }}
                />
                <YAxis hide />
                <Tooltip position={{ y: -90 }} />
                <Line
                  type="monotone"
                  dataKey="totalBill"
                  name="Bill Total"
                  stroke="#008CFF8A"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex w-[32%] rounded-xl items-center gap-5 justify-center bg-white p-3">
          <div className="font-medium">
            <p className="text-xl">
              {totalOutStanding ? formatter.format(totalOutStanding)
                : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}
            </p>
            <p className="font-medium text-xs">Total Outstanding value</p>
          </div>
          <div className="w-full h-[10vh]  ">
            <ResponsiveContainer width="100%" height="100%" >
              <LineChart data={outstandingGraphData()}>
                <XAxis hide dataKey="date" axisLine={false}
                  tickFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const date = new Date(Number(year), Number(month) - 1);
                    return date.toLocaleString("en-US", {
                      month: "short",
                    }) + "-" + year.slice(2);
                  }}
                />
                <YAxis hide />
                <Tooltip position={{ y: -90 }} />
                <Line
                  type="monotone"
                  dataKey="totalOutStanding"
                  name="Total Outstanding"
                  stroke="#FF9090AD"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {isAdmin && (
          <div className="flex w-[10%] rounded-xl bg-white p-5 justify-center items-center">
            <div className="font-medium">
              <p className="text-2xl text-center">{dashboardData ? dashboardData.branchData.length : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}</p>
              <p className="text-black text-sm">Branches</p>
            </div>
          </div>
        )}
        <div className="flex w-[10%] rounded-xl bg-white p-5 justify-center items-center">
          <div className="font-medium">
            <p className="text-2xl text-center">{dashboardData ? dashboardData.clientData.length : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}</p>
            <p className="text-black text-sm">Total Clients</p>
          </div>
        </div>
        <div className="flex w-[10%] rounded-xl bg-white p-5 justify-center items-center">
            
            <div className="font-medium">
              <p className="text-2xl text-center">{dashboardData ? dashboardData.vendorCount : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}</p>
              <p className="text-black text-sm">Vendors</p>
          </div>
        </div>
      </div>
      <section className="flex justify-between gap-5 max-h-[38vh] w-full">
        <div className={`flex rounded-xl bg-white p-5 gap-10`}>
          <div className="flex w-[15%] flex-col justify-between gap-2 py-5 ">
            <div className="flex flex-col gap-3">

              <div className="">
                <p>Total Bill Amount</p>
                <p className="text-xl font-medium">
                  {totalInvoice ? formatter.format(parseInt(totalInvoice || "0"))
                    : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />}
                </p>
              </div>
              <div>
                <p className="">Total Recieved Amount</p>
                <p className="text-xl font-medium">{dashboardData ? getRecordPayments()
                  : <Skeleton.Button active rootClassName="w-full h-full" shape="square" />
                }</p>
              </div>
            </div>
            <div className="text-sm">
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
          <div className="w-full flex flex-col justify-end items-end  h-fit">
            <RangePicker
              className="w-fit"
              picker="month"
              onChange={(_, dateStrings) => {
                if (!dateStrings || dateStrings.length !== 2) {
                  billFilterHandler(null);
                } else {
                  billFilterHandler(dateStrings as [string, string]);
                }
              }}
            />

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formatGraphData()}>
                <XAxis dataKey="date" axisLine={false}
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
                  name="Bill Total"
                  fill="#008EFF"
                  barSize={30}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="totalFM"
                  name="FM Total"
                  fill="#FF9090"
                  barSize={30}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {isAdmin && (
          <div className="flex w-[30%] flex-col  overflow-y-auto rounded-xl bg-white p-5 gap-7"> 
              <div className="flex ">
                <p className="font-medium w-full text-sm">Branch Performance</p>
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
              <div className="flex flex-wrap items-center justify-start gap-2 ">
                <ResponsiveContainer width={"90%"} height={200}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 10, right: 100, left: 20, bottom: 10 }}

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
          </div>
        )}
      </section>
      <section className="flex justify-center gap-5 max-h-[30vh]">
        <div
          className={`flex  w-full flex-col gap-3  rounded-xl bg-white p-5`}
        >
          <p className="text-xl font-medium">Top Customers</p>
          <div className="overflow-y-auto pr-2">
            {
              dashboardData ?
                <table className="w-full scroll-auto">
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
                : <div className="flex w-full h-full items-center justify-center">
                  <Skeleton active rootClassName="w-full h-full" paragraph={{ rows: 10 }} />
                </div>
            }
          </div>
        </div>
        {isAdmin && (
          <div className="flex  w-full flex-col gap-3 overflow-y-auto rounded-xl bg-white p-5">
            <p className="text-xl font-medium">Top Branches</p>
            {

              dashboardData ?
                <div className="w-full overflow-y-scroll pr-2">
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
                </div> :
                <div className="flex w-full h-full items-center justify-center overflow-y-scroll">
                  <Skeleton active rootClassName="w-full h-full" paragraph={{ rows: 10 }} />
                </div>
            }
          </div>
        )}
      </section>
    </div>
  );
}
