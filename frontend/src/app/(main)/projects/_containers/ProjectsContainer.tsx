"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import IconButton from "@/components/button/IconButton";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog";
import ButtonLink from "@/components/links/ButtonLink";
import IconLink from "@/components/links/IconLink";
import Table from "@/components/table/Table";
import type { ProjectItem } from "@/types/project";
import { formatProjectCurrency, formatProjectDate } from "../_lib/projectTransform";
import { useDeleteProjectMutation } from "../_hooks/useDeleteProjectMutation";
import { useProjectsQuery } from "../_hooks/useProjectsQuery";

type ProjectRow = {
    id: string;
    projectName: string;
    projectLocation: string;
    priority: string;
    projectValue: number;
    estimatedProgressPercentage: number;
    documentCreatedAt: string;
    operationalStartDate: string;
    estimatedCompletionDate: string;
    kategoriProyek: string;
    raw: ProjectItem;
};

const mapProjectToRow = (project: ProjectItem): ProjectRow => ({
    id: project.id,
    projectName: project.document_project.project_name,
    projectLocation: project.document_project.project_location,
    priority: project.document_project.project_priority,
    projectValue: project.document_project.project_value,
    estimatedProgressPercentage:
        project.document_project.estimated_progress_percentage,
    documentCreatedAt: project.document_project.document_created_at,
    operationalStartDate: project.document_project.operational_start_date,
    estimatedCompletionDate: project.document_project.estimated_completion_date,
    kategoriProyek: project.kategori_proyek,
    raw: project,
});

export default function ProjectsContainer() {
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
    const { mutate: deleteProject, isPending: isDeleting } =
        useDeleteProjectMutation();
    const { data: projects = [], isLoading } = useProjectsQuery();

    const columns = useMemo<ColumnDef<ProjectRow>[]>(
        () => [
            {
                accessorKey: "projectName",
                header: "Project Name",
                cell: (props) => <span>{`${props.getValue()}`}</span>,
            },
            {
                accessorKey: "projectLocation",
                header: "Location",
                cell: (props) => <span>{`${props.getValue()}`}</span>,
            },
            {
                accessorKey: "priority",
                header: "Priority",
                cell: (props) => (
                    <span className="uppercase font-medium">{`${props.getValue()}`}</span>
                ),
            },
            {
                accessorKey: "kategoriProyek",
                header: "Category",
                cell: (props) => <span>{`${props.getValue()}`}</span>,
            },
            {
                accessorKey: "projectValue",
                header: "Project Value",
                cell: (props) => (
                    <span>{formatProjectCurrency(Number(props.getValue() || 0))}</span>
                ),
            },
            {
                accessorKey: "estimatedProgressPercentage",
                header: "Progress",
                cell: (props) => <span>{`${props.getValue()}%`}</span>,
            },
            {
                accessorKey: "documentCreatedAt",
                header: "Doc Created",
                cell: (props) => <span>{formatProjectDate(`${props.getValue()}`)}</span>,
            },
            {
                accessorKey: "operationalStartDate",
                header: "Start Date",
                cell: (props) => <span>{formatProjectDate(`${props.getValue()}`)}</span>,
            },
            {
                accessorKey: "estimatedCompletionDate",
                header: "Est. Complete",
                cell: (props) => <span>{formatProjectDate(`${props.getValue()}`)}</span>,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-2">
                        <IconLink
                            href={`/projects/${row.original.id}`}
                            variant="blue"
                            size="sm"
                            icon={Eye}
                            title="Detail project"
                            aria-label="Detail project"
                        />
                        <IconLink
                            href={`/projects/${row.original.id}/edit`}
                            variant="yellow"
                            size="sm"
                            icon={Pencil}
                            title="Update project"
                            aria-label="Update project"
                        />
                        <IconButton
                            type="button"
                            variant="red"
                            size="sm"
                            icon={Trash2}
                            title="Delete project"
                            aria-label="Delete project"
                            onClick={() => setSelectedDeleteId(row.original.id)}
                        />
                    </div>
                ),
            },
        ],
        [],
    );

    const projectRows = useMemo(() => {
        return projects.map(mapProjectToRow);
    }, [projects]);

    const handleDelete = () => {
        if (!selectedDeleteId) {
            return;
        }

        deleteProject(selectedDeleteId, {
            onSuccess: () => {
                setSelectedDeleteId(null);
            },
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage project list and open detail, update, or delete actions.
                    </p>
                </div>
                <ButtonLink href="/projects/create" variant="blue">
                    Create New Project
                </ButtonLink>
            </div>

            <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-5 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">All Projects</h2>
                <Table
                    className="text-black"
                    data={projectRows}
                    columns={columns}
                    withFilter
                    withEntries
                    withPaginationControl
                    isLoading={isLoading}
                />
            </section>

            <ConfirmationDialog
                isOpen={Boolean(selectedDeleteId)}
                setIsOpen={(open) => {
                    if (!open) {
                        setSelectedDeleteId(null);
                    }
                }}
                message={
                    isDeleting
                        ? "Deleting project..."
                        : "Are you sure you want to delete this project?"
                }
                onConfirm={handleDelete}
            />
        </div>
    );
}