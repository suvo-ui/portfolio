const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const DEFAULT_API_PORT = "5000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getWindowHostname() {
  if (typeof window === "undefined") {
    return "localhost";
  }

  return window.location.hostname;
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    const protocol =
      typeof window === "undefined" ? "http:" : window.location.protocol;

    return `${protocol}//${getWindowHostname()}:${DEFAULT_API_PORT}`;
  }

  try {
    const url = new URL(configuredBaseUrl);
    const windowHostname = getWindowHostname();

    // When the app is opened from another device on the same network,
    // swap localhost for the current machine hostname so API calls reach
    // the laptop instead of the phone/tablet itself.
    if (
      LOCAL_HOSTNAMES.has(url.hostname) &&
      !LOCAL_HOSTNAMES.has(windowHostname)
    ) {
      url.hostname = windowHostname;
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(configuredBaseUrl);
  }
}

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path: string) {
  return new URL(path, `${API_BASE_URL}/`).toString();
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 30000,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `The request timed out after ${Math.round(timeoutMs / 1000)} seconds.`,
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export interface HeroCarouselImage {
  id: number;
  image_url: string;
  title: string;
  position: number;
  active: boolean;
  created_at: string;
}

export async function fetchHeroCarouselImages(): Promise<HeroCarouselImage[]> {
  const response = await fetchWithTimeout(apiUrl("/api/hero-carousel"));
  if (!response.ok) {
    throw new Error("Failed to fetch hero carousel images");
  }
  return response.json();
}

export async function createHeroCarouselImage(data: {
  image_url: string;
  title: string;
  position?: number;
  active?: boolean;
}): Promise<HeroCarouselImage> {
  const response = await fetchWithTimeout(apiUrl("/api/admin/hero-carousel"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create hero carousel image");
  }
  return response.json();
}

export async function updateHeroCarouselImage(
  id: number,
  data: Partial<{
    image_url: string;
    title: string;
    position: number;
    active: boolean;
  }>,
): Promise<HeroCarouselImage> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/admin/hero-carousel/${id}`),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update hero carousel image");
  }
  return response.json();
}

export async function deleteHeroCarouselImage(id: number): Promise<void> {
  const response = await fetchWithTimeout(
    apiUrl(`/api/admin/hero-carousel/${id}`),
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to delete hero carousel image");
  }
}
