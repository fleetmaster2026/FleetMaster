import type { Vehicle } from "../types/Vehicle";

const API = "https://fleetmaster-server.onrender.com/api/vehicles";

export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error("Failed to load vehicles");
  }

  return response.json();
};

export const addVehicle = async (
  vehicle: Omit<Vehicle, "id">
): Promise<void> => {
  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vehicle),
  });

  if (!response.ok) {
    throw new Error("Failed to save vehicle");
  }
};

export const updateVehicle = async (
  id: number,
  vehicle: Omit<Vehicle, "id">
): Promise<void> => {
  const response = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vehicle),
  });

  if (!response.ok) {
    throw new Error("Failed to update vehicle");
  }
};

export const deleteVehicle = async (id: number): Promise<void> => {
  const response = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete vehicle");
  }
};

// Wipes every existing vehicle and inserts the given list in a single
// atomic server-side transaction (see /bulk-replace on the backend).
// Used by the Excel import flow instead of one delete/add HTTP request
// per row, which was slow enough on a large fleet to freeze the tab.
export const bulkReplaceVehicles = async (
  vehicles: Omit<Vehicle, "id">[]
): Promise<{ success: boolean; added: number }> => {
  const response = await fetch(`${API}/bulk-replace`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vehicles }),
  });

  if (!response.ok) {
    // A body that isn't valid JSON (e.g. a 413 Payload Too Large error
    // page from Express, or a Render/host-level error page) previously
    // surfaced only as a generic "Unable to Import Excel File" alert
    // with no indication of what actually happened.
    let message = `Import failed (HTTP ${response.status}).`;

    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      if (response.status === 413) {
        message =
          "Import failed: the file is too large for the server to accept in one request.";
      } else if (response.statusText) {
        message = `Import failed (HTTP ${response.status} ${response.statusText}).`;
      }
    }

    throw new Error(message);
  }

  return response.json();
};