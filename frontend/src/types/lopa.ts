export interface DocumentMonthlyBatchCreate {
	doc_type: string;
	reporting_year: number;
	reporting_month: number;
	mode?: "append" | "overwrite";
	items: Record<string, any>[];
}

export interface LopaHistoryResponse {
	upload_batch_id: string;
	reporting_year: number;
	reporting_month: number;
	upload_date: string;
	record_count: number;
}

export interface LopaDataResponse {
	id: string;
	upload_batch_id: string;
	owner_account_id: string | null;
	reporting_year: number;
	reporting_month: number;
	function_no: string | null;
	function_name: string | null;
	function_description: string | null;
	final_element: string | null;
	recommendation: string | null;
	rrf_gap_value: string | null;
	rrf_gap_type: string | null;
	responsibility_pic: string | null;
	target_date: string | null;
	reminder_status: string | null;
	response_progress: string | null;
	status: string | null;
	evidence: string | null;
	completion_date: string | null;
	created_at: string;
	updated_at: string | null;
}
