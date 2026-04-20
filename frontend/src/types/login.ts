export type LoginRequest = {
	email: string;
	password: string;
};

export interface LoginResponse {
  id: string
  authorizedAccount: AuthorizedAccount
}

export interface AuthorizedAccount {
  token: string
  email: string
  name: string
  isVerified: boolean
  isActive: boolean
  isLoggedIn: boolean
  createdAt: string
  updatedAt: any
}


export type LoginError = {
	error: string;
};
