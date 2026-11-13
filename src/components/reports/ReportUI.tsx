import { Children, ReactNode } from "react";
import { Filter, Download, FileText } from "lucide-react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Button } from "../ui/button";

export function ReportDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <p className="text-sm text-slate-500">{label}</p>
      <DatePicker
        className="w-full rounded-lg"
        size="large"
        format="DD/MM/YYYY"
        placeholder="Select date"
        value={value ? dayjs(value) : null}
        onChange={(date) => onChange(date ? date.format("YYYY-MM-DD") : "")}
      />
    </div>
  );
}

export function ReportFiltersCard({
  children,
  onGenerate,
  onReset,
  loading,
  generateLabel = "Generate Report",
}: {
  children: ReactNode;
  onGenerate: () => void;
  onReset: () => void;
  loading?: boolean;
  generateLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter size={16} />
        Filters
      </div>
      <div className="flex flex-col flex-wrap items-end gap-3 sm:flex-row">
        {Children.map(children, (child) => (
          <div className="w-full min-w-[180px] flex-1 sm:w-auto">{child}</div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          className="rounded-lg bg-primary px-6 text-white hover:bg-primary/90"
          onClick={onGenerate}
          disabled={loading}
        >
          <FileText size={16} />
          {loading ? "Loading..." : generateLabel}
        </Button>
        <Button
          variant="outline"
          className="rounded-lg px-6"
          onClick={onReset}
          disabled={loading}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}

const statsColsClass: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
};

export function ReportStatsRow({
  stats,
}: {
  stats: { label: string; value: string | number }[];
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 ${statsColsClass[stats.length] ?? "sm:grid-cols-4"}`}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{s.label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportExportRow({ onExport }: { onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-base font-semibold text-slate-900">
          Export Report
        </p>
        <p className="text-sm text-slate-500">
          Download the filtered report
        </p>
      </div>
      <Button
        className="rounded-lg bg-primary px-6 text-white hover:bg-primary/90"
        onClick={onExport}
      >
        <Download size={16} />
        Export Excel
      </Button>
    </div>
  );
}

export function ReportPreviewCard({
  children,
  isEmpty,
  heightClassName = "h-[55vh]",
}: {
  children: ReactNode;
  isEmpty: boolean;
  heightClassName?: string;
}) {
  return (
    <div
      className={`flex ${heightClassName} w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 text-xs shadow-sm`}
    >
      <div>
        <p className="text-base font-semibold text-slate-900">
          Report Preview
        </p>
        <p className="text-sm text-slate-500">Showing filtered results</p>
      </div>
      {isEmpty ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-slate-400">
          <Filter size={48} />
          <p className="text-base font-medium">
            Please apply filters to view the data
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export const reportTableHeadClass =
  "border-b border-slate-100 py-2 text-left text-xs font-medium text-slate-500";

export const reportTableRowClass =
  "border-b border-slate-50 last:border-0 hover:bg-slate-50";
