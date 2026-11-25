import { Platform } from "react-native";
import { transportHeaders } from "./native-transport.cjs";

const web = Platform.OS === "web";
export const LIVE_ENABLED = process.env.EXPO_PUBLIC_LIVE_ENABLED === "true";
const configured = process.env.EXPO_PUBLIC_API_ORIGIN?.trim() || "";

export function apiOrigin() {
  if (web) return "";
  try {
    const url = new URL(configured);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.protocol === "https:" || (__DEV__ && url.protocol === "http:") ? url.origin : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const safeMessages = {
  400: "Bitte prüfen Sie Ihre Eingaben.",
  401: "Die Anmeldung ist fehlgeschlagen oder abgelaufen.",
  403: "Diese Aktion ist nicht verfügbar.",
  404: "Dieser Inhalt ist nicht mehr verfügbar.",
  409: "Die Aktion ist nicht möglich oder das Konto besteht bereits.",
  413: "Das Bild ist zu groß.",
  415: "Bitte wählen Sie ein JPEG-, PNG- oder WebP-Bild.",
  422: "Bitte prüfen Sie Ihre Eingaben und das Mindestalter von 18 Jahren.",
  429: "Zu viele Versuche. Bitte warten und erneut versuchen.",
  503: "Der Dienst ist gerade nicht erreichbar.",
};

export async function api(path, { method = "GET", data, raw, type, token, signal } = {}) {
  const origin = apiOrigin();
  if (!LIVE_ENABLED || origin === null || !path.startsWith("/api/")) {
    throw new ApiError(0, "Der Kontozugang ist nicht eingerichtet.");
  }
  const headers = { Accept: "application/json", ...transportHeaders(web, token) };
  if (raw !== undefined) headers["Content-Type"] = type;
  else if (data !== undefined) headers["Content-Type"] = "application/json";
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(origin + path, {
      method, headers, credentials: web ? "include" : "omit",
      body: raw ?? (data === undefined ? undefined : JSON.stringify(data)), signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) throw new ApiError(response.status, safeMessages[response.status] || "Die Aktion konnte nicht abgeschlossen werden.");
    if (response.status === 204) return {};
    if (!response.headers.get("content-type")?.includes("application/json")) throw new ApiError(0, "Der Server sendet keine gültige Antwort.");
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) throw error;
    if (controller.signal.aborted) throw new ApiError(0, "Der Server antwortet nicht. Bitte erneut versuchen.");
    throw new ApiError(0, "Keine Verbindung zu HeartPulse. Bitte erneut versuchen.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function photoSource(path, token) {
  const origin = apiOrigin();
  if (origin === null || typeof path !== "string" || !/^\/api\/photos\/[A-Za-z0-9_-]+$/.test(path)) return null;
  return { uri: origin + path, ...(web ? {} : { headers: transportHeaders(false, token) }) };
}
