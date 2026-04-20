export type User = {
	id: string;
	name: string;
	email: string;
	is_verified: boolean;
	is_active: boolean;
	is_logged_in: boolean;
	created_at: string;
	updated_at: any;
};

export type CreateUserRequest = {
	id: string;
	name: string;
	email: string;
	is_verified: boolean;
	is_active: boolean;
	is_logged_in: boolean;
	created_at: string;
	updated_at: any;
};

export type UpdateUserRequest = {
	id?: string;
	name?: string;
	email?: string;
	is_verified?: boolean;
	is_active?: boolean;
	is_logged_in?: boolean;
	created_at?: string;
	updated_at?: any;
};

export type WithToken = { token: string };
