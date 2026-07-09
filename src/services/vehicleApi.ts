import type { Vehicle } from "../types/Vehicle";

const API = "http://localhost:5000/api/vehicles";

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