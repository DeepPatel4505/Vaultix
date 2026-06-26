import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    withCredentials: true,
});

api.withCredentials = true;

let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

api.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
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
                // If it's already a refresh request or a login/register/logout request, do not retry
                if (
                    originalRequest.url.includes("/auth/refresh") ||
                    originalRequest.url.includes("/auth/login") ||
                    originalRequest.url.includes("/auth/register") ||
                    originalRequest.url.includes("/auth/logout")
                ) {
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                if (!refreshPromise) {
                    refreshPromise = api
                        .post("/auth/refresh")
                        .then((res) => {
                            refreshPromise = null;
                            const accessToken = typeof res.data === "string" ? res.data : res.data.accessToken;
                            setAuthToken(accessToken);
                            if (onTokenRefreshed) {
                                onTokenRefreshed(accessToken);
                            }
                            return accessToken;
                        })
                        .catch((err) => {
                            refreshPromise = null;
                            if (onLogout) {
                                onLogout();
                            }
                            throw err;
                        });
                }

                try {
                    const accessToken = await refreshPromise;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        },
    );
};

export default api;

