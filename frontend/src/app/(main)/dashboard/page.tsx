"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";
import { 
	History, 
	RotateCcw, 
	Filter, 
	AlertCircle,
	TrendingUp,
	ShieldCheck,
	Activity,
	Calendar
} from "lucide-react";

import Button from "@/components/button/Button";
import axiosInstance from "@/services/api/main/interceptor";
import { useLocationsQuery } from "../data-gathering/_hooks/useLocationsQuery";

// Types
interface SparklinePoint {
	date: string;
	value: number;
}

interface AssetMonitorInfo {
	asset_id: string;
	name: string;
	risk: string;
	status: string;
}

interface AlertItem {
	date: string;
	source: string;
	description: string;
	status: string;
}

interface DashboardData {
	production: {
		average_real: number;
		average_target: number;
		sparkline: SparklinePoint[];
	};
	airms: {
		average_availability: number;
	};
	i2aims: {
		monitor_assets_count: number;
		monitor_assets_list: AssetMonitorInfo[];
		integrity_status_distribution: {
			Good: number;
			Monitor: number;
			Fair: number;
		};
	};
	hsse: {
		open_permits_count: number;
		distribution: {
			Low: number;
			Medium: number;
			High: number;
		};
	};
	production_trend: {
		month: string;
		real: number;
		target: number;
	}[];
	alerts: AlertItem[];
}

const MONTH_OPTIONS = [
	{ value: null, label: "Semua Bulan" },
	{ value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
	{ value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
	{ value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
	{ value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
	{ value: null, label: "Semua Tahun" },
	...Array.from({ length: 5 }, (_, i) => {
		const y = currentYear - 2 + i;
		return { value: y, label: String(y) };
	})
];

const SELECT_STYLES = {
	control: (b: any) => ({ ...b, borderRadius: "0.5rem", minHeight: "38px", borderColor: "#e5e7eb" }),
	menu: (b: any) => ({ ...b, zIndex: 50 }),
};

export default function DashboardPage() {
	const router = useRouter();

	// Hover states for interactive charts
	const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
	const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);

	// Local Filter State (Unapplied)
	const [tempYear, setTempYear] = useState<{ value: number | null; label: string }>({ value: 2026, label: "2026" });
	const [tempMonth, setTempMonth] = useState<{ value: number | null; label: string }>(MONTH_OPTIONS[0]);
	const [tempLocation, setTempLocation] = useState<{ value: string | null; label: string }>({ value: null, label: "Semua Lokasi" });

	// Applied Filter State (Sent to API)
	const [queryYear, setQueryYear] = useState<{ value: number | null; label: string }>({ value: 2026, label: "2026" });
	const [queryMonth, setQueryMonth] = useState<{ value: number | null; label: string }>(MONTH_OPTIONS[0]);
	const [queryLocation, setQueryLocation] = useState<{ value: string | null; label: string }>({ value: null, label: "Semua Lokasi" });

	const { data: locationsData } = useLocationsQuery();

	const locationOptions = useMemo(() => {
		const baseOptions = [{ value: null, label: "Semua Lokasi" }];
		if (locationsData && locationsData.length > 0) {
			return [
				...baseOptions,
				...locationsData.map((loc) => ({
					value: loc.code,
					label: loc.name,
				})),
			];
		}
		return [
			...baseOptions,
			{ value: "DONGGI", label: "Donggi" },
			{ value: "MATINDOK", label: "Matindok" },
		];
	}, [locationsData]);

	// Fetch Summary Data
	const { data, isLoading } = useQuery<DashboardData>({
		queryKey: ["dashboard-summary", queryYear.value, queryMonth.value, queryLocation.value],
		queryFn: async () => {
			const { data } = await axiosInstance.get("/dashboard/summary", {
				params: {
					year: queryYear.value,
					month: queryMonth.value,
					field: queryLocation.value,
				},
			});
			return data.data;
		},
		staleTime: 3 * 60 * 1000, // Data fresh for 3 minutes
		gcTime: 10 * 60 * 1000,  // Keep cache in memory for 10 minutes
	});

	const handleApply = () => {
		setQueryYear(tempYear);
		setQueryMonth(tempMonth);
		setQueryLocation(tempLocation);
	};

	const handleReset = () => {
		setTempYear({ value: 2026, label: "2026" });
		setTempMonth(MONTH_OPTIONS[0]);
		setTempLocation({ value: null, label: "Semua Lokasi" });

		setQueryYear({ value: 2026, label: "2026" });
		setQueryMonth(MONTH_OPTIONS[0]);
		setQueryLocation({ value: null, label: "Semua Lokasi" });
	};

	const indonesianDate = useMemo(() => {
		const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
		const months = [
			"Januari", "Februari", "Maret", "April", "Mei", "Juni",
			"Juli", "Agustus", "September", "Oktober", "November", "Desember"
		];
		const today = new Date();
		return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
	}, []);

	// Sparkline SVG renderer
	const renderSparkline = (points: SparklinePoint[]) => {
		if (!points || points.length < 2) return null;
		const width = 240;
		const height = 45;
		const padding = 5;
		const values = points.map(p => p.value);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min || 1;

		const mappedPoints = points.map((p, idx) => {
			const x = (idx / (points.length - 1)) * (width - padding * 2) + padding;
			const y = height - ((p.value - min) / range) * (height - padding * 2) - padding;
			return { x, y };
		});

		const linePath = mappedPoints.reduce((acc, p, idx) => {
			return acc + `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
		}, "");

		const fillPath = `${linePath} L ${mappedPoints[mappedPoints.length - 1].x.toFixed(1)} ${height} L ${mappedPoints[0].x.toFixed(1)} ${height} Z`;

		return (
			<svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible mt-2">
				<defs>
					<linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.15" />
						<stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
					</linearGradient>
				</defs>
				<path d={fillPath} fill="url(#sparklineGrad)" />
				<path d={linePath} fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				{/* Draw end dot */}
				{mappedPoints.length > 0 && (
					<circle 
						cx={mappedPoints[mappedPoints.length - 1].x} 
						cy={mappedPoints[mappedPoints.length - 1].y} 
						r="4" 
						fill="#1E3A8A" 
						stroke="white" 
						strokeWidth="1.5" 
					/>
				)}
			</svg>
		);
	};

	// Semi-circle gauge SVG renderer for AIRMS Card
	const renderAvailabilityGauge = (value: number) => {
		const radius = 50;
		const strokeWidth = 10;
		const circumference = Math.PI * radius; // 157.08
		const valueClamped = Math.min(Math.max(value, 0), 100);
		const strokeDashoffset = circumference - (valueClamped / 100) * circumference;

		return (
			<div className="flex flex-col items-center justify-center relative w-full h-[70px] mt-2">
				<svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
					{/* Outline background track to show 100% boundary */}
					<path 
						d="M 10 65 A 50 50 0 0 1 110 65" 
						fill="none" 
						stroke="#d1d5db" 
						strokeWidth={strokeWidth + 2} 
						strokeLinecap="round" 
					/>
					<path 
						d="M 10 65 A 50 50 0 0 1 110 65" 
						fill="none" 
						stroke="#f3f4f6" 
						strokeWidth={strokeWidth} 
						strokeLinecap="round" 
					/>
					{/* Active Arc with color gradient */}
					<path 
						d="M 10 65 A 50 50 0 0 1 110 65" 
						fill="none" 
						stroke="#10b981" 
						strokeWidth={strokeWidth} 
						strokeLinecap="round" 
						strokeDasharray={`${circumference} ${circumference}`}
						strokeDashoffset={strokeDashoffset}
						className="transition-all duration-1000 ease-out"
					/>
				</svg>
			</div>
		);
	};

	// Donut/Pie Chart SVG renderer for I2AIMS Distribution
	const renderI2aimsDonut = (dist: { Good: number; Monitor: number; Fair: number }) => {
		const total = dist.Good + dist.Monitor + dist.Fair || 1;
		const goodPct = dist.Good;
		const monitorPct = dist.Monitor;
		const fairPct = dist.Fair;

		// Donut parameters
		const size = 150;
		const center = size / 2;
		const radius = 50;
		const strokeWidth = 24;
		const circumference = 2 * Math.PI * radius; // ~314.16

		// Calculate stroke dash arrays
		const goodDash = (goodPct / 100) * circumference;
		const monitorDash = (monitorPct / 100) * circumference;
		const fairDash = (fairPct / 100) * circumference;

		// Calculate rotation offsets
		const goodOffset = 0;
		const monitorOffset = goodDash;
		const fairOffset = goodDash + monitorDash;

		return (
			<div className="flex items-center gap-6 justify-center py-4">
				<div className="relative w-[150px] h-[150px] flex items-center justify-center">
					<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
						{/* Good Circle segment */}
						{goodPct > 0 && (
							<circle
								cx={center}
								cy={center}
								r={radius}
								fill="transparent"
								stroke="#10B981"
								strokeWidth={hoveredDonutSegment === "Good" ? strokeWidth + 4 : strokeWidth}
								strokeDasharray={`${goodDash} ${circumference}`}
								strokeDashoffset={-goodOffset}
								strokeLinecap="butt"
								onMouseEnter={() => setHoveredDonutSegment("Good")}
								onMouseLeave={() => setHoveredDonutSegment(null)}
								className="cursor-pointer transition-all duration-200"
							/>
						)}
						{/* Monitor Circle segment */}
						{monitorPct > 0 && (
							<circle
								cx={center}
								cy={center}
								r={radius}
								fill="transparent"
								stroke="#FBBF24"
								strokeWidth={hoveredDonutSegment === "Monitor" ? strokeWidth + 4 : strokeWidth}
								strokeDasharray={`${monitorDash} ${circumference}`}
								strokeDashoffset={-monitorOffset}
								strokeLinecap="butt"
								onMouseEnter={() => setHoveredDonutSegment("Monitor")}
								onMouseLeave={() => setHoveredDonutSegment(null)}
								className="cursor-pointer transition-all duration-200"
							/>
						)}
						{/* Fair Circle segment */}
						{fairPct > 0 && (
							<circle
								cx={center}
								cy={center}
								r={radius}
								fill="transparent"
								stroke="#0284C7"
								strokeWidth={hoveredDonutSegment === "Fair" ? strokeWidth + 4 : strokeWidth}
								strokeDasharray={`${fairDash} ${circumference}`}
								strokeDashoffset={-fairOffset}
								strokeLinecap="butt"
								onMouseEnter={() => setHoveredDonutSegment("Fair")}
								onMouseLeave={() => setHoveredDonutSegment(null)}
								className="cursor-pointer transition-all duration-200"
							/>
						)}
					</svg>
					{/* Inner text label - displays percentage on hover */}
					<div className="absolute flex flex-col items-center justify-center pointer-events-none">
						{hoveredDonutSegment ? (
							<>
								<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{hoveredDonutSegment}</span>
								<span className="text-xl font-black text-gray-800">
									{hoveredDonutSegment === "Good" ? goodPct : hoveredDonutSegment === "Monitor" ? monitorPct : fairPct}%
								</span>
							</>
						) : (
							<>
								<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">I2AIMS</span>
							</>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-3 text-xs font-semibold text-gray-700">
					<div 
						className={`flex items-center gap-2.5 p-1 rounded transition-colors ${hoveredDonutSegment === "Good" ? "bg-emerald-50" : ""}`}
						onMouseEnter={() => setHoveredDonutSegment("Good")}
						onMouseLeave={() => setHoveredDonutSegment(null)}
					>
						<span className="w-3.5 h-3.5 rounded bg-[#10B981] inline-block shadow-sm"></span>
						<span className="min-w-[60px]">Good:</span>
						<span className="text-gray-900 font-extrabold">{goodPct}%</span>
					</div>
					<div 
						className={`flex items-center gap-2.5 p-1 rounded transition-colors ${hoveredDonutSegment === "Monitor" ? "bg-amber-50" : ""}`}
						onMouseEnter={() => setHoveredDonutSegment("Monitor")}
						onMouseLeave={() => setHoveredDonutSegment(null)}
					>
						<span className="w-3.5 h-3.5 rounded bg-[#FBBF24] inline-block shadow-sm"></span>
						<span className="min-w-[60px]">Monitor:</span>
						<span className="text-gray-900 font-extrabold">{monitorPct}%</span>
					</div>
					<div 
						className={`flex items-center gap-2.5 p-1 rounded transition-colors ${hoveredDonutSegment === "Fair" ? "bg-blue-50" : ""}`}
						onMouseEnter={() => setHoveredDonutSegment("Fair")}
						onMouseLeave={() => setHoveredDonutSegment(null)}
					>
						<span className="w-3.5 h-3.5 rounded bg-[#0284C7] inline-block shadow-sm"></span>
						<span className="min-w-[60px]">Fair:</span>
						<span className="text-gray-900 font-extrabold">{fairPct}%</span>
					</div>
				</div>
			</div>
		);
	};

	// Monthly Line Chart Renderer
	const renderTrendLineChart = (trend: { month: string; real: number; target: number }[]) => {
		if (!trend || trend.length === 0) return null;
		const width = 600;
		const height = 240;
		const paddingLeft = 45;
		const paddingRight = 20;
		const paddingTop = 25;
		const paddingBottom = 35;

		const chartWidth = width - paddingLeft - paddingRight;
		const chartHeight = height - paddingTop - paddingBottom;

		const realValues = trend.map(t => t.real);
		const targetValues = trend.map(t => t.target);
		const allValues = [...realValues, ...targetValues];
		const maxVal = Math.max(...allValues, 100);
		const minVal = 0;

		const range = maxVal - minVal;

		const points = trend.map((t, idx) => {
			const x = (idx / (trend.length - 1)) * chartWidth + paddingLeft;
			const yReal = chartHeight - ((t.real - minVal) / range) * chartHeight + paddingTop;
			const yTarget = chartHeight - ((t.target - minVal) / range) * chartHeight + paddingTop;
			return { x, yReal, yTarget, label: t.month, realVal: t.real, targetVal: t.target };
		});

		const realPath = points.reduce((acc, p, idx) => {
			return acc + `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yReal.toFixed(1)}`;
		}, "");

		const targetPath = points.reduce((acc, p, idx) => {
			return acc + `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yTarget.toFixed(1)}`;
		}, "");

		return (
			<svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
				{/* Grid lines */}
				{[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
					const y = chartHeight * val + paddingTop;
					const labelVal = Math.round(maxVal - (maxVal * val));
					return (
						<g key={idx}>
							<line 
								x1={paddingLeft} 
								y1={y} 
								x2={width - paddingRight} 
								y2={y} 
								stroke="#f3f4f6" 
								strokeWidth="1.5" 
							/>
							<text 
								x={paddingLeft - 8} 
								y={y + 4} 
								textAnchor="end" 
								className="text-[10px] font-bold fill-gray-400 font-mono"
							>
								{labelVal}
							</text>
						</g>
					);
				})}

				{/* X Axis Labels */}
				{points.map((p, idx) => (
					<text 
						key={idx} 
						x={p.x} 
						y={height - 12} 
						textAnchor="middle" 
						className="text-[11px] font-bold fill-gray-500"
					>
						{p.label}
					</text>
				))}

				{/* Target line */}
				<path d={targetPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
				
				{/* Real line */}
				<path d={realPath} fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

				{/* Data nodes with hover tooltips */}
				{points.map((p, idx) => (
					<g 
						key={idx}
						onMouseEnter={() => setHoveredTrendIndex(idx)}
						onMouseLeave={() => setHoveredTrendIndex(null)}
						className="cursor-pointer"
					>
						{/* Target point */}
						<circle 
							cx={p.x} 
							cy={p.yTarget} 
							r={hoveredTrendIndex === idx ? "6" : "4"} 
							fill="#10B981" 
							stroke="white" 
							strokeWidth="1.5" 
						/>
						{hoveredTrendIndex === idx && (
							<g>
								<rect 
									x={p.x - 22} 
									y={p.yTarget - 24} 
									width="44" 
									height="14" 
									rx="3" 
									fill="#1e293b" 
								/>
								<text 
									x={p.x} 
									y={p.yTarget - 14} 
									textAnchor="middle" 
									className="text-[9px] font-extrabold fill-white font-mono"
								>
									{p.targetVal.toFixed(2)}
								</text>
							</g>
						)}

						{/* Real point */}
						<circle 
							cx={p.x} 
							cy={p.yReal} 
							r={hoveredTrendIndex === idx ? "6" : "4"} 
							fill="#0284C7" 
							stroke="white" 
							strokeWidth="1.5" 
						/>
						{hoveredTrendIndex === idx && (
							<g>
								<rect 
									x={p.x - 22} 
									y={p.yReal + 10} 
									width="44" 
									height="14" 
									rx="3" 
									fill="#1e293b" 
								/>
								<text 
									x={p.x} 
									y={p.yReal + 20} 
									textAnchor="middle" 
									className="text-[9px] font-extrabold fill-white font-mono"
								>
									{p.realVal.toFixed(2)}
								</text>
							</g>
						)}
					</g>
				))}
			</svg>
		);
	};

	const alertStatusBadge = (status: string) => {
		const clean = status.trim().toLowerCase();
		if (clean === "high" || clean === "styled" || clean === "risk") {
			return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-red-50 text-red-600 border-red-200">Styled</span>;
		}
		if (clean === "medium") {
			return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-amber-50 text-amber-600 border-amber-200">Medium</span>;
		}
		return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-blue-50 text-blue-600 border-blue-200">Monitor</span>;
	};

	return (
		<div className="flex flex-col gap-6 p-6 lg:p-8 w-full max-w-7xl mx-auto min-w-0 bg-[#F8FAFC]">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
						<Calendar className="w-5 h-5" />
					</div>
					<div>
						<span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Pertamina Dashboard</span>
						<p className="text-sm font-semibold text-gray-700">{indonesianDate}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm">
						PT
					</div>
					<div className="text-left">
						<p className="text-xs font-bold text-gray-800 leading-none">Pertamina Test</p>
						<span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Administrator</span>
					</div>
				</div>
			</div>

			{/* Executive Summary Title & Filter bar */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-black text-gray-900 tracking-tight">RINGKASAN EKSEKUTIF</h1>
				</div>

				{/* Filters Panel */}
				<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
					<div className="flex flex-wrap items-end gap-4">
						<div className="flex-1 min-w-[140px]">
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">Tahun</label>
							<Select 
								options={YEAR_OPTIONS} 
								value={tempYear} 
								onChange={(v) => v && setTempYear(v as any)}
								className="text-xs font-semibold"
								styles={SELECT_STYLES}
							/>
						</div>
						<div className="flex-1 min-w-[140px]">
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">Bulan</label>
							<Select 
								options={MONTH_OPTIONS} 
								value={tempMonth} 
								onChange={(v) => v && setTempMonth(v as any)}
								className="text-xs font-semibold"
								styles={SELECT_STYLES}
							/>
						</div>
						<div className="flex-1 min-w-[160px]">
							<label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-0.5">Lokasi / Field</label>
							<Select 
								options={locationOptions} 
								value={tempLocation} 
								onChange={(v) => v && setTempLocation(v as any)}
								className="text-xs font-semibold"
								styles={SELECT_STYLES}
							/>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={handleReset}
								className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm bg-white cursor-pointer"
							>
								<RotateCcw className="w-4 h-4" /> Reset Filter
							</button>
							<button
								onClick={handleApply}
								className="flex items-center gap-2 px-4 py-2 bg-[#008A45] hover:bg-[#007038] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
							>
								<Filter className="w-4 h-4" /> Terapkan Filter
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* KPI Grid */}
			{isLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
					{Array.from({ length: 4 }).map((_, idx) => (
						<div key={idx} className="bg-white h-[160px] rounded-2xl border border-gray-100 shadow-sm p-5"></div>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					
					{/* KPI Card 1: Daily Production */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-snug">
									Produksi Harian Rata-rata (MMSCFD)
								</span>
								<div className="flex items-baseline gap-1.5 mt-2">
									<span className="text-[11px] text-gray-500 font-bold">Real:</span>
									<span className="text-lg font-black text-gray-900">{data?.production.average_real.toFixed(2)}</span>
									<span className="text-[10px] text-gray-400">|</span>
									<span className="text-[11px] text-gray-500 font-bold">Target:</span>
									<span className="text-sm font-extrabold text-gray-700">{data?.production.average_target.toFixed(2)}</span>
								</div>
							</div>
							<div className="p-2 bg-blue-50 rounded-lg text-blue-600">
								<TrendingUp className="w-4 h-4" />
							</div>
						</div>
						{data?.production.sparkline && renderSparkline(data.production.sparkline)}
					</div>

					{/* KPI Card 2: AIRMS Availability */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-snug">
									Rata-rata Ketersediaan AIRMS
								</span>
								<span className="text-2xl font-black text-gray-900 mt-2">{data?.airms.average_availability.toFixed(1)}%</span>
							</div>
							<div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
								<Activity className="w-4 h-4" />
							</div>
						</div>
						{data?.airms.average_availability !== undefined && renderAvailabilityGauge(data.airms.average_availability)}
					</div>

					{/* KPI Card 3: I2AIMS status Monitor */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-snug">
									Aset I2AIMS Status "Monitor"
								</span>
								<span className="text-2xl font-black text-gray-900 mt-2">{data?.i2aims.monitor_assets_count} Aset</span>
							</div>
							<div className="p-2 bg-sky-50 rounded-lg text-sky-600">
								<ShieldCheck className="w-4 h-4" />
							</div>
						</div>
						<div className="mt-2 text-[10px] text-gray-400 space-y-0.5 max-h-[50px] overflow-y-auto no-scrollbar font-semibold">
							{data?.i2aims.monitor_assets_list.slice(0, 2).map((a, idx) => (
								<p key={idx} className="truncate">{a.asset_id}: {a.risk}</p>
							))}
						</div>
					</div>

					{/* KPI Card 4: HSSE critical open */}
					<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-snug">
									Izin Tugas Kritis Terbuka
								</span>
								<span className="text-2xl font-black text-gray-900 mt-2">{data?.hsse.open_permits_count} Izin</span>
							</div>
							<div className="p-2 bg-amber-50 rounded-lg text-amber-600">
								<AlertCircle className="w-4 h-4" />
							</div>
						</div>
						<div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100 text-center">
							<div className="flex flex-col">
								<span className="text-xs font-extrabold text-gray-900">{data?.hsse.distribution.Low || 0}</span>
								<span className="text-[9px] text-gray-400 font-bold uppercase">Low</span>
							</div>
							<div className="flex flex-col border-x border-gray-100">
								<span className="text-xs font-extrabold text-gray-900">{data?.hsse.distribution.Medium || 0}</span>
								<span className="text-[9px] text-gray-400 font-bold uppercase">Medium</span>
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-extrabold text-red-600">{data?.hsse.distribution.High || 0}</span>
								<span className="text-[9px] text-gray-400 font-bold uppercase">Risk</span>
							</div>
						</div>
					</div>

				</div>
			)}

			{/* Visualization Section */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				{/* Production Trend Line Chart */}
				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2 flex flex-col justify-between min-h-[300px]">
					<div>
						<h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-1">
							{data?.production_trend && data.production_trend.length > 0
								? `Tren Produksi vs Target DMF (${data.production_trend[0].month} - ${data.production_trend[data.production_trend.length - 1].month} ${queryYear.value || "2026"})`
								: "Tren Produksi vs Target DMF"}
						</h3>
						<div className="flex items-center gap-4 text-xs font-bold mt-2">
							<div className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
								<span className="text-gray-500">Target</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block"></span>
								<span className="text-gray-500">Real</span>
							</div>
						</div>
					</div>
					<div className="h-[210px] w-full flex items-center justify-center mt-4">
						{data?.production_trend && renderTrendLineChart(data.production_trend)}
					</div>
				</div>

				{/* I2AIMS Donut Chart */}
				<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between min-h-[300px]">
					<div>
						<h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">
							Status Integritas Aset I2AIMS
						</h3>
					</div>
					{data?.i2aims.integrity_status_distribution && renderI2aimsDonut(data.i2aims.integrity_status_distribution)}
				</div>

			</div>

			{/* Alert & tasks table section */}
			<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5">
				<h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">
					Alert Kritis & Tugas Penting
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-gray-100">
								<th className="pb-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Tanggal</th>
								<th className="pb-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Sumber</th>
								<th className="pb-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Deskripsi</th>
								<th className="pb-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50">
							{isLoading ? (
								Array.from({ length: 3 }).map((_, idx) => (
									<tr key={idx} className="animate-pulse">
										<td className="py-3"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
										<td className="py-3"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
										<td className="py-3"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
										<td className="py-3 text-right"><div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
									</tr>
								))
							) : data?.alerts && data.alerts.length > 0 ? (
								data.alerts.map((a, idx) => (
									<tr key={idx} className="hover:bg-gray-50/50 transition-colors">
										<td className="py-3.5 text-xs font-bold text-gray-600 font-mono">{a.date}</td>
										<td className="py-3.5 text-xs font-extrabold text-gray-800">{a.source}</td>
										<td className="py-3.5 text-xs font-semibold text-gray-700">{a.description}</td>
										<td className="py-3.5 text-xs text-right">{alertStatusBadge(a.status)}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={4} className="py-8 text-center text-xs text-gray-400 italic">
										Tidak ada alert aktif.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
