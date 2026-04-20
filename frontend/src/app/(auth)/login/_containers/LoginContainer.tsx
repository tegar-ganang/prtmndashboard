"use client";

import Image from "next/image";
import { FormProvider, useForm } from "react-hook-form";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import type { LoginRequest } from "@/types/login";
import { useLoginMutation } from "../_hooks/useLoginMutation";

export default function LoginContainers() {
	const method = useForm<LoginRequest>();

	const { mutate, isPending } = useLoginMutation();

	const handleSubmit = (data: LoginRequest) => {
		mutate(data);
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-blue-50 p-4">
			<div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white">
				<div className="relative hidden lg:block">
					<div
						className="h-full w-full bg-cover bg-center"
						style={{ backgroundImage: "url('background-login.png')" }}
					>
						<div className="flex h-full items-center justify-center bg-black/50 ">
							<div className="text-center text-white bg-white/50 w-fit px-6 py-6 rounded-2xl">
								<div className="w-40 h-4 flex justify-center items-center rounded-2xl">
									<Image
										src={"/PertaminaLogo.png"}
										alt={"Logo Pertamina"}
										width={200}
										height={100}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-center p-8 lg:p-12">
					<div className="w-full max-w-md space-y-8">
						<div className="flex justify-center lg:hidden mb-8">
							<Image
								src={"/PertaminaLogo.png"}
								alt={"Logo Pertamina"}
								width={120}
								height={60}
								className="object-contain"
							/>
						</div>

						<div className="text-center lg:text-left space-y-2">
							<h1 className="text-3xl lg:text-3xl font-bold text-gray-900 text-center">
								Selamat Datang
							</h1>
							<p className="text-base text-gray-600 text-center">
								Masukkan kredensial Anda untuk masuk ke dalam sistem
							</p>
						</div>

						<FormProvider {...method}>
							<form
								onSubmit={method.handleSubmit(handleSubmit)}
								className="space-y-6"
							>
								<div className="space-y-5">
									<Input
										id={"email"}
										type="email"
										label="Email"
										placeholder="nama@email.com"
										validation={{
											required: "Email tidak boleh kosong",
											pattern: {
												value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
												message: "Format email tidak valid",
											},
										}}
									/>
									<Input
										id={"password"}
										type="password"
										label="Password"
										placeholder="Masukkan password Anda"
										validation={{
											required: "Password tidak boleh kosong",
											minLength: {
												value: 6,
												message: "Password minimal 6 karakter",
											},
										}}
									/>
								</div>

								<Button
									type="submit"
									variant="blue"
									size="lg"
									className="w-full mt-3 shadow-lg hover:shadow-xl transition-shadow"
									isLoading={isPending}
								>
									Masuk ke Sistem
								</Button>
							</form>
						</FormProvider>
					</div>
				</div>
			</div>
		</div>
	);
}
