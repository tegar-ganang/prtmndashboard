export type MartSyncCountRow = {
	id: string;
	name: string;
	appTable: string;
	appCount: number | null;
	appError: string | null;
	expectedMartCount: number | null;
	martTable: string;
	martCount: number | null;
	martError: string | null;
};

export type MartSyncRunResult = {
	name: string;
	syncScript: string;
	success: boolean;
	error: string | null;
};

export type GetMartSyncCountsResponse = {
	success: boolean;
	message: string;
	data: MartSyncCountRow[];
	err: unknown;
};

export type RunMartSyncResponse = {
	success: boolean;
	message: string;
	data: MartSyncRunResult[];
	err: unknown;
};
