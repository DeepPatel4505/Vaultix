import api from "./api";

export const loginRequest = (email, password) =>
    api.post("/auth/login", { email, password });

export const registerRequest = (username, email, password) =>
    api.post("/auth/register", { username, email, password });

export const logoutRequest = () =>
    api.post("/auth/logout");

export const refreshRequest = () =>
    api.post("/auth/refresh");

export const getMeRequest = () =>
    api.get("/auth/me");
