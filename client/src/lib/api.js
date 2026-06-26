import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    withCredentials: true,
});

api.withCredentials = true;

api.interceptors.request.use(
    (config) => {
        const token = window.localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

let refreshPromise = null;
let responseInterceptorId = null;

export const setupInterceptors = (onTokenRefreshed, onLogout) => {
    if (responseInterceptorId !== null) {
        api.interceptors.response.eject(responseInterceptorId);
    }

    responseInterceptorId = api.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                // If it's already a refresh request or a login/register request, do not retry
                if (
                    originalRequest.url.includes("/auth/refresh") ||
                    originalRequest.url.includes("/auth/login") ||
                    originalRequest.url.includes("/auth/register")
                ) {
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                if (!refreshPromise) {
                    refreshPromise = api
                        .post("/auth/refresh")
                        .then((res) => {
                            refreshPromise = null;
                            return res.data.accessToken;
                        })
                        .catch((err) => {
                            refreshPromise = null;
                            throw err;
                        });
                }

                try {
                    const accessToken = await refreshPromise;
                    onTokenRefreshed(accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    onLogout();
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        },
    );
};

export default api;

