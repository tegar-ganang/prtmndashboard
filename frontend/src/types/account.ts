export type AccountItem = {
	id: string;
	email: string;
	name: string | null;
	roleId: number | null;
	roleName: string | null;
	isAdmin: boolean;
	isVerified: boolean;
	isActive: boolean;
	isLoggedIn: boolean;
	createdAt: string;
	updatedAt: string | null;
};

export type RoleItem = {
	id: number;
	roleName: string;
};

export type GetAllAccountsResponse = {
	success: boolean;
	message: string;
	data: AccountItem[];
	err: unknown;
};

export type GetAllRolesResponse = {
	success: boolean;
	message: string;
	data: RoleItem[];
	err: unknown;
};

export type UpdateAccountRoleResponse = {
	success: boolean;
	message: string;
	data: AccountItem;
	err: unknown;
};

export type CreateAccountRequest = {
	email: string;
	name: string | null;
	roleId: number | null;
};

export type UpdateAccountRequest = {
	name?: string;
	email?: string;
};

export type DefaultPasswordHintResponse = {
	success: boolean;
	message: string;
	data: { default_password: string };
	err: unknown;
};

export type ChangePasswordRequest = {
	currentPassword: string;
	newPassword: string;
};

export type ChangePasswordResponse = {
	success: boolean;
	message: string;
	data: null;
	err: unknown;
};

export type CreateAccountResponse = {
	success: boolean;
	message: string;
	data: AccountItem;
	err: unknown;
};

export type UpdateAccountResponse = {
	success: boolean;
	message: string;
	data: AccountItem;
	err: unknown;
};

export type DeleteAccountResponse = {
	success: boolean;
	message: string;
	data: { id: string } | null;
	err: unknown;
};
