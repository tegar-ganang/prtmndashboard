"use client";

import * as React from "react";
import { Controller, get, type RegisterOptions, useFormContext } from "react-hook-form";
import ErrorMessage from "@/components/form/ErrorMessage";
import HelperText from "@/components/form/HelperText";
import LabelText from "@/components/form/LabelText";
import clsxm from "@/lib/clsxm";

export type CurrencyInputProps = {
	id: string;
	label?: string;
	helperText?: React.ReactNode;
	hideError?: boolean;
	validation?: RegisterOptions;
	className?: string;
	placeholder?: string;
};

const formatRupiah = (value: unknown): string => {
	const numeric = typeof value === "number" ? value : Number(value);
	if (!numeric || Number.isNaN(numeric)) return "";
	return new Intl.NumberFormat("id-ID").format(numeric);
};

// Digits-only currency field: keystrokes that aren't numbers never reach form state,
// so there's nothing to reject at submit time — the value is always a clean number.
export default function CurrencyInput({
	id,
	label,
	helperText,
	hideError = false,
	validation,
	className,
	placeholder = "0",
}: CurrencyInputProps) {
	const {
		control,
		formState: { errors },
	} = useFormContext();
	const error = get(errors, id);

	return (
		<div className="w-full space-y-2">
			{label && <LabelText required={!!validation?.required}>{label}</LabelText>}

			<Controller
				name={id}
				control={control}
				rules={validation}
				render={({ field }) => (
					<div className="relative w-full">
						<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
							Rp
						</span>
						<input
							type="text"
							inputMode="numeric"
							id={id}
							name={id}
							placeholder={placeholder}
							value={formatRupiah(field.value)}
							onChange={(e) => {
								const digitsOnly = e.target.value.replace(/\D/g, "");
								field.onChange(digitsOnly ? Number(digitsOnly) : 0);
							}}
							onBlur={field.onBlur}
							className={clsxm(
								"h-full w-full rounded-md border border-gray-500 py-2.5 pl-9 pr-3 caret-gray-900",
								"focus:outline-1 focus:outline-gray-900 focus:ring-inset",
								"text-sm hover:ring-1 hover:ring-inset hover:ring-gray-900 transition duration-300",
								"placeholder:text-sm placeholder:text-gray-500 text-gray-900",
								error &&
									"border-none ring-2 ring-inset ring-red-500 placeholder:text-gray-500 focus:ring-red-500 bg-red-100",
								className,
							)}
						/>
					</div>
				)}
			/>

			{!hideError && error && <ErrorMessage>{error?.message?.toString()}</ErrorMessage>}
			{helperText && <HelperText>{helperText}</HelperText>}
		</div>
	);
}
