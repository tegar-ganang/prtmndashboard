import { useMemo } from "react";

import useAuthStore from "@/app/stores/useAuthStore";
import { canUploadMenu } from "@/configs/rbac";
import type { DocumentOption } from "../_types";
import { DOC_TYPE_MENU } from "../_constants/docTypeMenuMap";
import {
	DOCUMENT_OPTIONS,
	PSAIMS_OPTIONS,
	LCV_OPTIONS,
	type DocTypeValue,
} from "../_constants/dataGathering.constants";

/** Doc type options filtered down to what the logged-in role can upload (RBAC). */
export function useAllowedDocTypeOptions() {
	const roleName = useAuthStore.useUser()?.role_name;

	return useMemo(() => {
		const canUpload = (docType: DocTypeValue) => canUploadMenu(roleName, DOC_TYPE_MENU[docType]);

		const documentOptions = DOCUMENT_OPTIONS.filter((opt) => canUpload(opt.value));
		const psaimsOptions = PSAIMS_OPTIONS.filter((opt) => canUpload(opt.value));
		const lcvOptions = LCV_OPTIONS.filter((opt) => canUpload(opt.value));

		const documentOptionsWithPsaims: DocumentOption<DocTypeValue>[] = [
			...documentOptions,
			...(psaimsOptions.length > 0 ? [{ value: "PSAIMS" as DocTypeValue, label: "PSAIMS" }] : []),
			...(lcvOptions.length > 0 ? [{ value: "LCV" as DocTypeValue, label: "LCV" }] : []),
		];

		return {
			documentOptions,
			psaimsOptions,
			lcvOptions,
			documentOptionsWithPsaims,
			hasAnyUploadAccess: documentOptionsWithPsaims.length > 0,
		};
	}, [roleName]);
}
