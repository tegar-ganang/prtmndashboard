import type { CreateProjectRequest, ProjectItem } from "@/types/project";

export const getTodayDate = () => new Date().toISOString().split("T")[0];

export const defaultProjectFormValues: CreateProjectRequest = {
	documentCreatedAt: getTodayDate(),
	operationalStartDate: getTodayDate(),
	estimatedCompletionDate: getTodayDate(),
	projectName: "",
	projectLocation: "",
	projectValue: 0,
	projectPriority: "high",
	estimatedProgressPercentage: 0,
	earnedValueEv: 0,
	plannedValuePv: 0,
	actualCostAc: 0,
	budgetBac: 0,
	milestoneAndWorkStages: "",
};

export const toProjectPayload = (data: CreateProjectRequest) => ({
	document_created_at: data.documentCreatedAt,
	operational_start_date: data.operationalStartDate,
	estimated_completion_date: data.estimatedCompletionDate,
	project_name: data.projectName,
	project_location: data.projectLocation,
	project_value: Number(data.projectValue),
	project_priority: data.projectPriority,
	estimated_progress_percentage: Number(data.estimatedProgressPercentage),
	earned_value_ev: Number(data.earnedValueEv),
	planned_value_pv: Number(data.plannedValuePv),
	actual_cost_ac: Number(data.actualCostAc),
	budget_bac: Number(data.budgetBac),
	milestone_and_work_stages: data.milestoneAndWorkStages,
});

export const projectToFormValues = (
	project: ProjectItem,
): CreateProjectRequest => ({
	documentCreatedAt: project.document_project.document_created_at,
	operationalStartDate: project.document_project.operational_start_date,
	estimatedCompletionDate: project.document_project.estimated_completion_date,
	projectName: project.document_project.project_name,
	projectLocation: project.document_project.project_location,
	projectValue: project.document_project.project_value,
	projectPriority: project.document_project.project_priority,
	estimatedProgressPercentage:
		project.document_project.estimated_progress_percentage,
	earnedValueEv: project.earned_value_ev,
	plannedValuePv: project.planned_value_pv,
	actualCostAc: project.actual_cost_ac,
	budgetBac: project.budget_bac,
	milestoneAndWorkStages: project.milestone_and_work_stages,
});

export const formatProjectDate = (value: string) => {
	const parsedDate = new Date(value);

	if (Number.isNaN(parsedDate.getTime())) {
		return "-";
	}

	return parsedDate.toLocaleDateString("id-ID");
};

export const formatProjectCurrency = (value: number) => {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value || 0);
};
