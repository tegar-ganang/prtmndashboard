import axios from "axios";
import { ENV } from "@/configs/environment";
import { getToken } from "@/lib/cookies";

const baseURL = ENV.URI.BASE_URL;

const api = axios.create({
	baseURL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Synchronous interceptor: read token using the same library (universal-cookie)
// that was used to store it via setToken(), ensuring encoding consistency.
api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;
