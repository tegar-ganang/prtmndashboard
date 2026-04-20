"use client";

import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useEffect } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import SelectInput from "@/components/form/SelectInput";
import TextArea from "@/components/form/TextArea";
import type { CreateProjectRequest } from "@/types/project";

type ProjectFormProps = {
	defaultValues: CreateProjectRequest;
	onSubmit: SubmitHandler<CreateProjectRequest>;
	submitLabel: string;
	isSubmitting?: boolean;
};

const projectPriorityOptions = [
	{ value: "low", label: "Low" },
	{ value: "mid", label: "Medium" },
	{ value: "high", label: "High" },
];

export default function ProjectForm({
	defaultValues,
	onSubmit,
	submitLabel,
	isSubmitting,
}: ProjectFormProps) {
	const methods = useForm<CreateProjectRequest>({
		defaultValues,
	});

	useEffect(() => {
		methods.reset(defaultValues);
	}, [defaultValues, methods]);

	return (
		<FormProvider {...methods}>
			<form className="space-y-4" onSubmit={methods.handleSubmit(onSubmit)}>
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					<Input
						id="projectName"
						label="Project Name"
						placeholder="Input project name"
						validation={{ required: "Project name is required" }}
					/>
					<Input
						id="projectLocation"
						label="Project Location"
						placeholder="Input project location"
						validation={{ required: "Project location is required" }}
					/>
					<SelectInput
						id="projectPriority"
						label="Project Priority"
						placeholder="Select priority"
						options={projectPriorityOptions}
						isSearchable={false}
						validation={{ required: "Project priority is required" }}
					/>

					<Input
						id="documentCreatedAt"
						type="date"
						label="Document Created At"
						validation={{ required: "Document created date is required" }}
					/>
					<Input
						id="operationalStartDate"
						type="date"
						label="Operational Start Date"
						validation={{ required: "Operational start date is required" }}
					/>
					<Input
						id="estimatedCompletionDate"
						type="date"
						label="Estimated Completion Date"
						validation={{ required: "Estimated completion date is required" }}
					/>

					<Input
						id="projectValue"
						type="number"
						label="Project Value"
						placeholder="0"
						validation={{
							required: "Project value is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
						}}
					/>
					<Input
						id="estimatedProgressPercentage"
						type="number"
						label="Estimated Progress (%)"
						placeholder="0"
						validation={{
							required: "Estimated progress is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
							max: { value: 100, message: "Maximum value is 100" },
						}}
					/>
					<Input
						id="earnedValueEv"
						type="number"
						label="Earned Value (EV)"
						placeholder="0"
						validation={{
							required: "EV is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
						}}
					/>

					<Input
						id="plannedValuePv"
						type="number"
						label="Planned Value (PV)"
						placeholder="0"
						validation={{
							required: "PV is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
						}}
					/>
					<Input
						id="actualCostAc"
						type="number"
						label="Actual Cost (AC)"
						placeholder="0"
						validation={{
							required: "AC is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
						}}
					/>
					<Input
						id="budgetBac"
						type="number"
						label="Budget (BAC)"
						placeholder="0"
						validation={{
							required: "BAC is required",
							valueAsNumber: true,
							min: { value: 0, message: "Minimum value is 0" },
						}}
					/>
				</div>

				<TextArea
					id="milestoneAndWorkStages"
					label="Milestone and Work Stages"
					placeholder="Describe milestone and work stages"
					validation={{ required: "Milestone and work stages are required" }}
				/>

				<div className="flex justify-end">
					<Button type="submit" variant="blue" isLoading={isSubmitting}>
						{submitLabel}
					</Button>
				</div>
			</form>
		</FormProvider>
	);
}
