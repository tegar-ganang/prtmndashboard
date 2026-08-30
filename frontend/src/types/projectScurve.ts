export type ProjectProgressItem = {
	id: string;
	periode_data: string;
	item_no: number;
	description: string;
	wf: number | null;
	previous_week_plan: number | null;
	previous_week_actual: number | null;
	previous_week_variance: number | null;
	this_week_plan: number | null;
	this_week_actual: number | null;
	this_week_variance: number | null;
	to_date_plan: number | null;
	to_date_actual: number | null;
	to_date_variance: number | null;
	remarks: string | null;
};

export type ProjectProgressSummaryItem = {
	id: string;
	progress_date: string;
	actual_this_week: number | null;
	actual_cumulative: number | null;
	plan_this_week: number | null;
	plan_cumulative: number | null;
	variance_to_plan: number | null;
};

export type ProjectScurveUploadItem = {
	id: string;
	file_name: string;
	uploaded_by_account_id: string | null;
	uploaded_at: string;
};

export type ScurveUploadResult = {
	upload_id: string;
	periode_data: string;
	progress_items: number;
	summary_weeks: number;
};

export type GetProgressResponse = {
	success: boolean;
	message: string;
	data: ProjectProgressItem[];
	err: unknown;
};

export type GetSummaryResponse = {
	success: boolean;
	message: string;
	data: ProjectProgressSummaryItem[];
	err: unknown;
};

export type GetUploadsResponse = {
	success: boolean;
	message: string;
	data: ProjectScurveUploadItem[];
	err: unknown;
};

export type UploadScurveResponse = {
	success: boolean;
	message: string;
	data: ScurveUploadResult;
	err: unknown;
};
