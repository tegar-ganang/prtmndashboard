import React from "react";
import { ColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";

export type PeriodType = "month" | "quarter";

export interface MonitoringConfig {
  title: string;
  periodType: PeriodType;
  getColumns: (ch: ColumnHelper<any>) => any[];
}

const badge = (val: any, type: "risk" | "status") => {
  if (!val) return <span className="text-gray-300 italic">—</span>;
  const s = String(val).toLowerCase();
  const cls = type === "risk"
    ? s.includes("high") || s.includes("critical") ? "bg-red-100 text-red-700 border-red-200"
      : s.includes("medium") ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : s.includes("low") ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200"
    : s.includes("close") ? "bg-green-100 text-green-700 border-green-200"
      : s.includes("progress") || s.includes("going") ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${cls}`}>
      {val}
    </span>
  );
};

const dateCell = (v: any) => v ? <span className="text-xs text-gray-500">{format(new Date(v), "dd MMM yyyy")}</span> : <span className="text-gray-300">—</span>;

export const MONITORING_CONFIGS: Record<string, MonitoringConfig> = {
  mit: {
    title: "Major Integrity Threat (MIT)",
    periodType: "quarter",
    getColumns: (ch) => [
      ch.accessor("field", { header: "Field/Area", cell: i => <span className="text-xs font-medium text-gray-900">{i.getValue() || "—"}</span> }),
      ch.accessor("reg_no", { header: "No. Reg", cell: i => <span className="text-xs font-mono text-gray-500">{i.getValue() || "—"}</span> }),
      ch.accessor("mit_title_asset", { 
        header: "MIT Title / Asset", 
        cell: i => <div className="text-xs font-medium text-gray-900 max-w-[200px] truncate" title={i.getValue()}>{i.getValue() || "—"}</div> 
      }),
      ch.accessor("current_risk_rating", { header: "Risk", cell: i => badge(i.getValue(), "risk") }),
      ch.accessor("mit_status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
      ch.accessor("pic", { header: "PIC", cell: i => <span className="text-xs">{i.getValue() || "—"}</span> }),
      ch.accessor("target_closing", { header: "Target", cell: i => dateCell(i.getValue()) }),
    ]
  },
  hazid: {
    title: "Hazard Identification (HAZID)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("field", { header: "Field/Area", cell: i => <span className="text-xs font-medium text-gray-900">{i.getValue() || "—"}</span> }),
      ch.accessor("node", { header: "Node", cell: i => <span className="text-xs font-medium">{i.getValue() || "—"}</span> }),
      ch.accessor("hazard", { header: "Hazard", cell: i => <div className="text-xs max-w-[200px] truncate" title={i.getValue()}>{i.getValue() || "—"}</div> }),
      ch.accessor("risk", { header: "Risk", cell: i => badge(i.getValue(), "risk") }),
      ch.accessor("status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-xs">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => dateCell(i.getValue()) }),
    ]
  },
  hazop: {
    title: "Hazard and Operability Study (HAZOP)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("field", { header: "Field/Area", cell: i => <span className="text-xs font-medium text-gray-900">{i.getValue() || "—"}</span> }),
      ch.accessor("node", { header: "Node", cell: i => <span className="text-xs font-medium">{i.getValue() || "—"}</span> }),
      ch.accessor("deviation", { header: "Deviation", cell: i => <div className="text-xs max-w-[150px] truncate" title={i.getValue()}>{i.getValue() || "—"}</div> }),
      ch.accessor("risk", { header: "Risk", cell: i => badge(i.getValue(), "risk") }),
      ch.accessor("status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-xs">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => dateCell(i.getValue()) }),
    ]
  },
  lopa: {
    title: "Layer of Protection Analysis (LOPA)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("field", { header: "Field/Area", cell: i => <span className="text-xs font-medium text-gray-900">{i.getValue() || "—"}</span> }),
      ch.accessor("function_name", { header: "Function", cell: i => <span className="text-xs font-medium">{i.getValue() || "—"}</span> }),
      ch.accessor("final_element", { header: "Final Element", cell: i => <div className="text-xs max-w-[150px] truncate" title={i.getValue()}>{i.getValue() || "—"}</div> }),
      ch.accessor("rrf_gap_value", { header: "RRF Gap", cell: i => <span className="text-xs">{i.getValue() || "—"}</span> }),
      ch.accessor("status", { header: "Status", cell: i => badge(i.getValue(), "status") }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-xs">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => dateCell(i.getValue()) }),
    ]
  }
};
