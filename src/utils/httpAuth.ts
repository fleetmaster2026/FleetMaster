/**
 * Installs a global fetch wrapper (once, on app start) so every existing
 * fetch() call in the app - vehicleApi.ts, breakdownApi.ts, etc. - keeps
 * working unchanged, but automatically:
 *   1. Attaches the logged-in user's token as an Authorization header
 *   2. Logs the user out and redirects to /login if the server returns 401
 *
 * This avoids having to edit every individual service file.
 */

import axios from "axios";

export const TOKEN_KEY = "fm_token";
export const USER_KEY = "fm_user";

function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

let installed = false;

export function installAuthFetch() {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await originalFetch(input, { ...init, headers });

    if (response.status === 401) {
      handleUnauthorized();
    }

    return response;
  };

  // Several service files (rtaDocumentApi.ts, breakdownApi.ts, fineApi.ts,
  // siteEngineerApi.ts, Settings.tsx) use axios instead of fetch. Axios runs
  // on XMLHttpRequest in the browser, so the fetch wrapper above never sees
  // those requests - they need their own interceptor on the same shared
  // axios default instance every file imports.
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        handleUnauthorized();
      }
      return Promise.reject(error);
    }
  );
}
