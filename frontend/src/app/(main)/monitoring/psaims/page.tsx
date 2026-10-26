import { redirect } from "next/navigation";

// PSAIMS children live at /monitoring/zona_indicator and /monitoring/zona_pse_list.
export default function PsaimsRedirect() {
	redirect("/monitoring/zona_indicator");
}
