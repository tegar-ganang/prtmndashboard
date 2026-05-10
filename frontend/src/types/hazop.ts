export interface DocumentMonthlyBatchCreate {
	doc_type: string;
	reporting_year: number;
	reporting_month: number;
	mode?: "append" | "overwrite";
	items: Record<string, any>[];
}

export interface HazopHistoryResponse {
	upload_batch_id: string;
	reporting_year: number;
	reporting_month: number;
	upload_date: string;
	record_count: number;
}

export interface HazopDataResponse {
	id: string;
	upload_batch_id: string;
	owner_account_id: string | null;
	reporting_year: number;
	reporting_month: number;
	node_no: string | null;
	rec_no: string | null;
	node: string | null;
	deviation: string | null;
	possible_cause: string | null;
	consequences: string | null;
	safeguard: string | null;
	recommendation: string | null;
	likelihood: string | null;
	severity: string | null;
	risk: string | null;
	responsibility_pic: string | null;
	type: string | null;
	target_date: string | null;
	response_progress: string | null;
	category: string | null;
	sub_category: string | null;
	status: string | null;
	evidence: string | null;
	completion_date: string | null;
	sme: string | null;
	created_at: string;
	updated_at: string | null;
}
