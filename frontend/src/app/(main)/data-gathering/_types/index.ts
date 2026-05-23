/**
 * Shared TypeScript types for the Data Gathering feature.
 */

/** A parsed row from the uploaded Excel file, enriched with validation metadata. */
export interface ExcelRow {
	/** 1-based row index shown in the preview table */
	_index: number;
	/** Whether the row passes all required-field validations */
	_isValid: boolean;
	/** List of human-readable validation error messages */
	_errors: string[];
	[key: string]: any;
}

/** Map of extra column visibility flags by header name. */
export type ExtraColumnsState = Record<string, boolean>;

/** Document select option shape. */
export interface DocumentOption<TValue extends string = string> {
	value: TValue;
	label: string;
}

/** The result shape returned from a successful batch upload */
export interface BatchUploadResult {
	upload_batch_id: string;
}
