import type { Site } from "../types/Site";

const API = "http://localhost:5000/api/sites";

export const getSites = async (): Promise<Site[]> => {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error("Failed to load sites");
  }

  return response.json();
};

export const addSite = async (
  site: Omit<Site, "id">
): Promise<void> => {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(site),
  });

  if (!response.ok) {
    throw new Error("Failed to save site");
  }
};

export const updateSite = async (
  id: number,
  site: Omit<Site, "id">
): Promise<void> => {
  const response = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(site),
  });

  if (!response.ok) {
    throw new Error("Failed to update site");
  }
};

export const deleteSite = async (id: number): Promise<void> => {
  const response = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete site");
  }
};