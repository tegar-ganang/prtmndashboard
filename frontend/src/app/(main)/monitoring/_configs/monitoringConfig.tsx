import React from "react";
import { ColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";

export type PeriodType = "month" | "quarter";

export interface MonitoringConfig {
  title: string;
  periodType: PeriodType;
  getColumns: (ch: ColumnHelper<any>) => any[];
}

export const renderRiskBadge = (val: any) => {
  if (!val) return <span className="text-gray-300 italic">—</span>;
  const s = String(val).trim();
  const num = parseInt(s);
  
  let scoreText = s;
  let label = s;
  let bg = "bg-gray-50 text-gray-600 border-gray-200";
  let textCls = "text-gray-600";
  
  if (!isNaN(num)) {
    scoreText = String(num);
    if (num >= 12) {
      bg = "bg-red-50 text-red-600 border-red-100";
      textCls = "text-red-600";
      label = "High";
    } else if (num >= 9) {
      bg = "bg-orange-50 text-orange-600 border-orange-100";
      textCls = "text-orange-600";
      label = "High";
    } else if (num >= 6) {
      bg = "bg-yellow-50 text-yellow-600 border-yellow-100";
      textCls = "text-yellow-600";
      label = "Medium";
    } else {
      bg = "bg-green-50 text-green-600 border-green-100";
      textCls = "text-green-600";
      label = "Low";
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${bg}`}>{scoreText}</span>
        <span className={`text-sm font-semibold ${textCls}`}>{label}</span>
      </div>
    );
  } else {
    const lower = s.toLowerCase();
    if (lower.includes("high") || lower.includes("critical")) {
      bg = "bg-red-50 text-red-600 border-red-100";
      textCls = "text-red-600";
      label = "High";
    } else if (lower.includes("medium")) {
      bg = "bg-yellow-50 text-yellow-600 border-yellow-100";
      textCls = "text-yellow-600";
      label = "Medium";
    } else if (lower.includes("low")) {
      bg = "bg-green-50 text-green-600 border-green-100";
      textCls = "text-green-600";
      label = "Low";
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${bg}`}>
          {label ? label[0].toUpperCase() : "—"}
        </span>
        <span className={`text-sm font-semibold ${textCls}`}>{label}</span>
      </div>
    );
  }
};

export const renderStatusBadge = (val: any) => {
  if (!val) return <span className="text-gray-300 italic">—</span>;
  const s = String(val).toLowerCase();
  let dotCls = "bg-gray-400";
  let badgeCls = "bg-gray-50 text-gray-700 border-gray-200";
  if (s.includes("close")) {
    dotCls = "bg-green-500";
    badgeCls = "bg-green-50 text-green-700 border-green-100";
  } else if (s.includes("progress") || s.includes("going")) {
    dotCls = "bg-blue-500";
    badgeCls = "bg-blue-50 text-blue-700 border-blue-100";
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase whitespace-nowrap ${badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
      {val}
    </div>
  );
};

export const renderDateCell = (v: any) => {
  if (!v) return <span className="text-gray-300">—</span>;
  return <span className="text-sm font-bold text-red-600 whitespace-nowrap">{format(new Date(v), "dd MMM yyyy")}</span>;
};

export const MONITORING_CONFIGS: Record<string, MonitoringConfig> = {
  mit: {
    title: "Major Integrity Threat (MIT)",
    periodType: "quarter",
    getColumns: (ch) => [
      ch.accessor("mit_title_asset", { 
        header: "MIT Title / Asset", 
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-sm font-semibold text-gray-900 leading-snug">{row.mit_title_asset || "—"}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{row.field || "—"} • REG-{row.reg_no || "—"}</span>
            </div>
          );
        }
      }),
      ch.accessor("current_risk_rating", { header: "Risk", cell: i => renderRiskBadge(i.getValue()) }),
      ch.accessor("mit_status", { header: "Status", cell: i => renderStatusBadge(i.getValue()) }),
      ch.accessor("pic", { header: "PIC", cell: i => <span className="text-sm font-medium text-gray-800">{i.getValue() || "—"}</span> }),
      ch.accessor("target_closing", { header: "Target", cell: i => renderDateCell(i.getValue()) }),
    ]
  },
  hazid: {
    title: "Hazard Identification (HAZID)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("hazard", {
        header: "HAZID Hazard",
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-sm font-semibold text-gray-900 leading-snug">{row.hazard || "—"}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{row.field || "—"} • NODE-{row.node || "—"}</span>
            </div>
          );
        }
      }),
      ch.accessor("risk", { header: "Risk", cell: i => renderRiskBadge(i.getValue()) }),
      ch.accessor("status", { header: "Status", cell: i => renderStatusBadge(i.getValue()) }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-sm font-medium text-gray-800">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => renderDateCell(i.getValue()) }),
    ]
  },
  hazop: {
    title: "Hazard and Operability Study (HAZOP)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("deviation", {
        header: "HAZOP Deviation",
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-sm font-semibold text-gray-900 leading-snug">{row.deviation || "—"}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{row.field || "—"} • NODE-{row.node || "—"}</span>
            </div>
          );
        }
      }),
      ch.accessor("risk", { header: "Risk", cell: i => renderRiskBadge(i.getValue()) }),
      ch.accessor("status", { header: "Status", cell: i => renderStatusBadge(i.getValue()) }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-sm font-medium text-gray-800">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => renderDateCell(i.getValue()) }),
    ]
  },
  lopa: {
    title: "Layer of Protection Analysis (LOPA)",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("function_name", {
        header: "LOPA Function",
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="text-sm font-semibold text-gray-900 leading-snug">{row.function_name || "—"}</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{row.field || "—"} • ELEMENT: {row.final_element || "—"}</span>
            </div>
          );
        }
      }),
      ch.accessor("rrf_gap_value", { 
        header: "RRF Gap", 
        cell: i => <span className="text-sm font-semibold text-gray-800">{i.getValue() || "—"}</span> 
      }),
      ch.accessor("status", { header: "Status", cell: i => renderStatusBadge(i.getValue()) }),
      ch.accessor("responsibility_pic", { header: "PIC", cell: i => <span className="text-sm font-medium text-gray-800">{i.getValue() || "—"}</span> }),
      ch.accessor("target_date", { header: "Target Date", cell: i => renderDateCell(i.getValue()) }),
    ]
  },
  produksi: {
    title: "Monitoring Produksi Harian",
    periodType: "month",
    getColumns: (ch) => [
      ch.accessor("tanggal", {
        header: "Tanggal",
        cell: i => <span className="text-xs font-mono text-gray-700 whitespace-nowrap">{i.getValue() ? format(new Date(i.getValue()), "dd MMM yyyy") : "—"}</span>,
      }),
      ch.accessor("donggi_prod", {
        header: "Donggi Prod (MMSCFD)",
        cell: i => <span className="text-xs font-semibold text-blue-700">{i.getValue() != null ? Number(i.getValue()).toFixed(2) : "—"}</span>,
      }),
      ch.accessor("matindok_prod", {
        header: "Matindok Prod (MMSCFD)",
        cell: i => <span className="text-xs font-semibold text-indigo-700">{i.getValue() != null ? Number(i.getValue()).toFixed(2) : "—"}</span>,
      }),
      // target_dmf kini ada di tabel produksi_target (nested via FK target_id → target.target_dmf)
      ch.accessor((row: any) => row?.target?.target_dmf ?? null, {
        id: "target_dmf",
        header: "Target DMF (MMSCFD)",
        cell: i => <span className="text-xs text-emerald-700 font-bold">{i.getValue() != null ? Number(i.getValue()).toFixed(2) : "—"}</span>,
      }),
      ch.accessor("op_real", {
        header: "Op Real (BOPD)",
        cell: i => <span className="text-xs text-gray-600">{i.getValue() != null ? Number(i.getValue()).toFixed(3) : "—"}</span>,
      }),
      ch.accessor("pupo_sot_real", {
        header: "PUPO/SOT Real (BOPD)",
        cell: i => <span className="text-xs text-gray-600">{i.getValue() != null ? Number(i.getValue()).toFixed(3) : "—"}</span>,
      }),
      ch.accessor((row: any) => row.safe_man_hours_actl ?? row.safe_man_hours_dmf ?? null, {
        id: "safe_man_hours",
        header: "Safe Man Hours",
        cell: i => <span className="text-xs text-gray-500">{i.getValue() != null ? Number(i.getValue()).toLocaleString() : "—"}</span>,
      }),
    ]
  }
};

