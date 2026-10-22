export type ProjectPriority = "low" | "mid" | "high";
export type ProjectType = "BD" | "NON_BD";

export type CreateProjectRequest = {
	documentCreatedAt: string;
	operationalStartDate: string;
	estimatedCompletionDate: string;
	projectName: string;
	pic: string;
	projectLocation: string;
	projectValue: number;
	projectPriority: ProjectPriority;
	projectType: ProjectType;
	estimatedProgressPercentage: number;
	earnedValueEv: number;
	plannedValuePv: number;
	actualCostAc: number;
	budgetBac: number;
	milestoneAndWorkStages: string;
};

export type ProjectDocument = {
	document_created_at: string;
	operational_start_date: string;
	estimated_completion_date: string;
	project_name: string;
	pic: string | null;
	project_location: string;
	project_value: number;
	project_priority: ProjectPriority;
	project_type: ProjectType;
	estimated_progress_percentage: number;
};

export type ProjectItem = {
	id: string;
	owner_account_id: string;
	kategori_proyek: string;
	earned_value_ev: number;
	planned_value_pv: number;
	actual_cost_ac: number;
	budget_bac: number;
	milestone_and_work_stages: string;
	document_project: ProjectDocument;
	created_at: string;
	updated_at: string | null;
};

export type GetAllProjectsResponse = {
	success: boolean;
	message: string;
	data: ProjectItem[];
	err: unknown;
};

export type CreateProjectResponse = {
	success: boolean;
	message: string;
	data: ProjectItem;
	err: unknown;
};

export type GetProjectDetailResponse = {
	success: boolean;
	message: string;
	data: ProjectItem;
	err: unknown;
};

export type UpdateProjectResponse = {
	success: boolean;
	message: string;
	data: ProjectItem;
	err: unknown;
};

export type DeleteProjectResponse = {
	success: boolean;
	message: string;
	data: null;
	err: unknown;
};
