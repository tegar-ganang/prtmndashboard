export interface DocumentBatchCreate {
	doc_type: string;
	items: Record<string, any>[];
}

export interface MITResponse {
	upload_batch_id: string;
}
