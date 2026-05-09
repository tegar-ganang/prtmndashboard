export interface DocumentBatchCreate {
	doc_type: string;
	reporting_year: number;
	reporting_quarter: number;
	mode?: "append" | "overwrite";
	items: Record<string, any>[];
}

export interface MITResponse {
	upload_batch_id: string;
}

export interface MitHistoryResponse {
	upload_batch_id: string;
	reporting_year: number;
	reporting_quarter: number;
	upload_date: string;
	record_count: number;
}

export interface MitDataResponse {
	id: string;
	upload_batch_id: string;
	owner_account_id: string | null;
	reporting_year: number;
	reporting_quarter: number;
	area: string | null;
	reg_lokasi: string | null;
	reg_jenis_mit: string | null;
	reg_kategori: string | null;
	reg_tahun: string | null;
	reg_no: string | null;
	mit_declaration_date: string | null;
	mit_title_asset: string | null;
	integrity_threats: string | null;
	possible_scenario: string | null;
	consequences: string | null;
	available_safeguard: string | null;
	current_likelihood: string | null;
	current_severity: string | null;
	current_risk_rating: string | null;
	rec_no: string | null;
	recommendation_action: string | null;
	pic: string | null;
	target_closing: string | null;
	remarks: string | null;
	target_likelihood: string | null;
	target_severity: string | null;
	target_risk_rating: string | null;
	mit_status: string | null;
	evidence_path: string | null;
	closing_date: string | null;
	created_at: string;
	updated_at: string | null;
}
