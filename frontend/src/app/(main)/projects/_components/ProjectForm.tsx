"use client";

import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useEffect } from "react";
import { Save } from "lucide-react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import SelectInput from "@/components/form/SelectInput";
import type { CreateProjectRequest } from "@/types/project";
import { useLocationsQuery } from "@/app/(main)/data-gathering/_hooks/useLocationsQuery";

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

const priorityDotColor: Record<string, string> = {
	low: "bg-green-500",
	mid: "bg-yellow-500",
	high: "bg-red-500",
};

const formatPriorityOption = (data: unknown) => {
	const option = data as { value: string | number; label: string };
	return (
		<span className="flex items-center gap-2">
			<span className={`h-2 w-2 rounded-full ${priorityDotColor[option.value] ?? "bg-gray-400"}`} />
			{option.label}
		</span>
	);
};

const FormSection = ({
	step,
	title,
	children,
}: {
	step: number;
	title: string;
	children: React.ReactNode;
}) => (
	<div className="space-y-4">
		<div className="flex items-center gap-3">
			<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
				{step}
			</span>
			<h2 className="text-base font-semibold text-gray-900">{title}</h2>
		</div>
		{children}
	</div>
);

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

	const { data: locations, isLoading: isLoadingLocations } = useLocationsQuery();
	const locationOptions = (locations ?? []).map((loc) => ({
		value: loc.name,
		label: loc.name,
	}));

	return (
		<FormProvider {...methods}>
			<form className="space-y-6" onSubmit={methods.handleSubmit(onSubmit)}>
				<FormSection step={1} title="Project Information">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						<Input
							id="projectName"
							label="Project Name"
							placeholder="Enter project name"
							validation={{ required: "Project name is required" }}
						/>
						<Input
							id="pic"
							label="PIC"
							placeholder="Enter person in charge"
							validation={{ required: "PIC is required" }}
						/>
						<SelectInput
							id="projectLocation"
							label="Project Location"
							placeholder={isLoadingLocations ? "Loading locations..." : "Select location"}
							options={locationOptions}
							isLoading={isLoadingLocations}
							isSearchable={false}
							validation={{ required: "Project location is required" }}
						/>
						<SelectInput
							id="projectPriority"
							label="Project Priority"
							placeholder="Select priority"
							options={projectPriorityOptions}
							formatOptionLabel={formatPriorityOption}
							isSearchable={false}
							validation={{ required: "Project priority is required" }}
						/>
					</div>
				</FormSection>

				<hr className="border-gray-200" />

				<FormSection step={2} title="Timeline">
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						<Input
							id="operationalStartDate"
							type="date"
							label="Start Date"
							validation={{ required: "Start date is required" }}
						/>
						<Input
							id="estimatedCompletionDate"
							type="date"
							label="End Date"
							validation={{ required: "End date is required" }}
						/>
					</div>
				</FormSection>

				<div className="flex justify-end">
					<Button
						type="submit"
						variant="blue"
						leftIcon={Save}
						isLoading={isSubmitting}
					>
						{submitLabel}
					</Button>
				</div>
			</form>
		</FormProvider>
	);
}
