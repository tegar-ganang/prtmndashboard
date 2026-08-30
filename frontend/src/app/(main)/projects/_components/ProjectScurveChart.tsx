"use client";

import { useId, useMemo, useState } from "react";
import { Table2, TrendingUp } from "lucide-react";
import type { ProjectProgressSummaryItem } from "@/types/projectScurve";

const COLOR_ACTUAL = "#2a78d6"; // dataviz categorical slot 1 (blue)
const COLOR_PLAN = "#eb6834"; // dataviz categorical slot 2 (orange)

const WIDTH = 760;
const HEIGHT = 320;
const PAD = { top: 16, right: 20, bottom: 34, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const formatShortDate = (iso: string) => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const formatPercent = (value: number | null) => (value == null ? "-" : `${value.toFixed(1)}%`);

export default function ProjectScurveChart({ data }: { data: ProjectProgressSummaryItem[] }) {
	const gradientId = useId();
	const [view, setView] = useState<"chart" | "table">("chart");
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

	const n = data.length;
	const xAt = (i: number) => PAD.left + (n <= 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W);
	const yAt = (value: number) => PAD.top + PLOT_H - (Math.max(0, Math.min(100, value)) / 100) * PLOT_H;

	const indexFromPointerX = (clientX: number, currentTarget: SVGSVGElement) => {
		const rect = currentTarget.getBoundingClientRect();
		const relX = ((clientX - rect.left) / rect.width) * WIDTH;
		const idx = Math.round(((relX - PAD.left) / PLOT_W) * (n - 1));
		return Math.max(0, Math.min(n - 1, idx));
	};

	const actualPoints = useMemo(
		() =>
			data
				.map((row, i) => (row.actual_cumulative == null ? null : { i, x: xAt(i), y: yAt(row.actual_cumulative) }))
				.filter((p): p is { i: number; x: number; y: number } => p !== null),
		[data, n],
	);
	const planPoints = useMemo(
		() =>
			data
				.map((row, i) => (row.plan_cumulative == null ? null : { i, x: xAt(i), y: yAt(row.plan_cumulative) }))
				.filter((p): p is { i: number; x: number; y: number } => p !== null),
		[data, n],
	);

	const pathFor = (points: { x: number; y: number }[]) =>
		points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

	const lastActual = actualPoints[actualPoints.length - 1] ?? null;
	const lastPlan = planPoints[planPoints.length - 1] ?? null;

	// Show at most ~7 x-axis labels, evenly spaced, so dates never collide.
	const labelIndices = useMemo(() => {
		const maxLabels = 7;
		if (n <= maxLabels) return data.map((_, i) => i);
		const step = (n - 1) / (maxLabels - 1);
		const indices = Array.from({ length: maxLabels }, (_, k) => Math.round(k * step));
		return Array.from(new Set(indices));
	}, [n, data]);

	if (n === 0) {
		return null;
	}

	const activeIndex = Math.min(selectedIndex, n - 1);
	const hovered = hoverIndex != null ? data[hoverIndex] : null;
	const selected = data[activeIndex];
	const selectedActual = actualPoints.find((p) => p.i === activeIndex) ?? null;
	const selectedPlan = planPoints.find((p) => p.i === activeIndex) ?? null;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4 text-xs">
					<span className="flex items-center gap-1.5 text-gray-600">
						<svg width="16" height="8" aria-hidden="true">
							<line x1="0" y1="4" x2="16" y2="4" stroke={COLOR_ACTUAL} strokeWidth="2" />
						</svg>
						Actual Cumulative
					</span>
					<span className="flex items-center gap-1.5 text-gray-600">
						<svg width="16" height="8" aria-hidden="true">
							<line x1="0" y1="4" x2="16" y2="4" stroke={COLOR_PLAN} strokeWidth="2" strokeDasharray="4 3" />
						</svg>
						Plan Cumulative
					</span>
				</div>
				<div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
					<button
						type="button"
						onClick={() => setView("chart")}
						className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
							view === "chart" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"
						}`}
					>
						<TrendingUp className="w-3.5 h-3.5" />
						Chart
					</button>
					<button
						type="button"
						onClick={() => setView("table")}
						className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
							view === "table" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"
						}`}
					>
						<Table2 className="w-3.5 h-3.5" />
						Table
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-5 gap-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
				<div className="col-span-2 md:col-span-1">
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal Terpilih</p>
					<p className="text-sm font-semibold text-gray-900 mt-0.5">{formatShortDate(selected.progress_date)}</p>
				</div>
				<div>
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actual This Week</p>
					<p className="text-sm font-semibold text-gray-700 mt-0.5">{formatPercent(selected.actual_this_week)}</p>
				</div>
				<div>
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actual Cumulative</p>
					<p className="text-sm font-semibold mt-0.5" style={{ color: COLOR_ACTUAL }}>
						{formatPercent(selected.actual_cumulative)}
					</p>
				</div>
				<div>
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan Cumulative</p>
					<p className="text-sm font-semibold mt-0.5" style={{ color: COLOR_PLAN }}>
						{formatPercent(selected.plan_cumulative)}
					</p>
				</div>
				<div>
					<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variance</p>
					<p className="text-sm font-semibold text-gray-700 mt-0.5">{formatPercent(selected.variance_to_plan)}</p>
				</div>
			</div>

			{view === "chart" ? (
				<div className="relative">
					<svg
						viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
						className="w-full h-auto cursor-pointer"
						role="img"
						aria-label="S-Curve: actual vs plan cumulative progress over time"
						onPointerMove={(e) => setHoverIndex(indexFromPointerX(e.clientX, e.currentTarget))}
						onPointerLeave={() => setHoverIndex(null)}
						onClick={(e) => setSelectedIndex(indexFromPointerX(e.clientX, e.currentTarget))}
					>
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={COLOR_ACTUAL} stopOpacity="0.12" />
								<stop offset="100%" stopColor={COLOR_ACTUAL} stopOpacity="0" />
							</linearGradient>
						</defs>

						{/* gridlines: 0/25/50/75/100 */}
						{[0, 25, 50, 75, 100].map((tick) => (
							<g key={tick}>
								<line
									x1={PAD.left}
									x2={WIDTH - PAD.right}
									y1={yAt(tick)}
									y2={yAt(tick)}
									stroke="#e5e7eb"
									strokeWidth="1"
								/>
								<text x={PAD.left - 8} y={yAt(tick)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[10px]">
									{tick}%
								</text>
							</g>
						))}

						{/* x-axis labels */}
						{data.map((row, i) =>
							labelIndices.includes(i) ? (
								<text
									key={row.id}
									x={xAt(i)}
									y={HEIGHT - PAD.bottom + 16}
									textAnchor="middle"
									className="fill-gray-400 text-[10px]"
								>
									{formatShortDate(row.progress_date)}
								</text>
							) : null,
						)}

						{/* area wash under actual */}
						{actualPoints.length > 1 && (
							<path
								d={`${pathFor(actualPoints)} L ${actualPoints[actualPoints.length - 1].x} ${yAt(0)} L ${actualPoints[0].x} ${yAt(0)} Z`}
								fill={`url(#${gradientId})`}
							/>
						)}

						{/* plan line (dashed) */}
						{planPoints.length > 1 && (
							<path d={pathFor(planPoints)} fill="none" stroke={COLOR_PLAN} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
						)}

						{/* actual line (solid) */}
						{actualPoints.length > 1 && (
							<path d={pathFor(actualPoints)} fill="none" stroke={COLOR_ACTUAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						)}

						{/* end markers */}
						{lastPlan && (
							<circle cx={lastPlan.x} cy={lastPlan.y} r="4" fill={COLOR_PLAN} stroke="#fff" strokeWidth="2" />
						)}
						{lastActual && (
							<circle cx={lastActual.x} cy={lastActual.y} r="4" fill={COLOR_ACTUAL} stroke="#fff" strokeWidth="2" />
						)}

						{/* persistent crosshair for the selected (clicked) point */}
						<line
							x1={xAt(activeIndex)}
							x2={xAt(activeIndex)}
							y1={PAD.top}
							y2={HEIGHT - PAD.bottom}
							stroke="#6b7280"
							strokeWidth="1"
							strokeDasharray="3 3"
						/>
						{selectedPlan && (
							<circle cx={selectedPlan.x} cy={selectedPlan.y} r="6" fill={COLOR_PLAN} stroke="#fff" strokeWidth="2" />
						)}
						{selectedActual && (
							<circle cx={selectedActual.x} cy={selectedActual.y} r="6" fill={COLOR_ACTUAL} stroke="#fff" strokeWidth="2" />
						)}

						{/* transient hover crosshair (lighter) */}
						{hoverIndex != null && hoverIndex !== activeIndex && (
							<line
								x1={xAt(hoverIndex)}
								x2={xAt(hoverIndex)}
								y1={PAD.top}
								y2={HEIGHT - PAD.bottom}
								stroke="#d1d5db"
								strokeWidth="1"
							/>
						)}

						{/* transparent hit strip to catch pointer events across the whole plot */}
						<rect
							x={PAD.left}
							y={PAD.top}
							width={PLOT_W}
							height={PLOT_H}
							fill="transparent"
						/>
					</svg>

					{hovered && (
						<div
							className="absolute top-2 pointer-events-none rounded-lg bg-gray-900 text-white text-xs px-3 py-2 shadow-lg"
							style={{
								left: `${Math.min(85, Math.max(2, (xAt(hoverIndex ?? 0) / WIDTH) * 100))}%`,
								transform: "translateX(-50%)",
							}}
						>
							<p className="font-semibold mb-1">{formatShortDate(hovered.progress_date)}</p>
							<p className="flex items-center gap-2">
								<span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_ACTUAL }} />
								Actual: <strong>{formatPercent(hovered.actual_cumulative)}</strong>
							</p>
							<p className="flex items-center gap-2">
								<span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_PLAN }} />
								Plan: <strong>{formatPercent(hovered.plan_cumulative)}</strong>
							</p>
						</div>
					)}
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								{["Tanggal", "Actual This Week", "Actual Cumulative", "Plan This Week", "Plan Cumulative", "Variance"].map((h) => (
									<th key={h} className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50">
							{data.map((row, i) => (
								<tr
									key={row.id}
									onClick={() => setSelectedIndex(i)}
									className={`cursor-pointer transition-colors ${
										i === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
									}`}
								>
									<td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{formatShortDate(row.progress_date)}</td>
									<td className="px-3 py-2 text-xs text-gray-600">{formatPercent(row.actual_this_week)}</td>
									<td className="px-3 py-2 text-xs font-semibold" style={{ color: COLOR_ACTUAL }}>
										{formatPercent(row.actual_cumulative)}
									</td>
									<td className="px-3 py-2 text-xs text-gray-600">{formatPercent(row.plan_this_week)}</td>
									<td className="px-3 py-2 text-xs font-semibold" style={{ color: COLOR_PLAN }}>
										{formatPercent(row.plan_cumulative)}
									</td>
									<td className="px-3 py-2 text-xs text-gray-600">{formatPercent(row.variance_to_plan)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
