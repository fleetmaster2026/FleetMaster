import type { Engineer } from "../types/Engineer";

const API_URL = "http://localhost:5000/api/engineers";

export const getEngineers = async (): Promise<Engineer[]> => {
  const response = await fetch(API_URL);
  return response.json();
};

export const addEngineer = async (
  engineer: Omit<Engineer, "id">
) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(engineer),
  });

  return response.json();
};

export const updateEngineer = async (
  id: number,
  engineer: Omit<Engineer, "id">
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(engineer),
  });

  return response.json();
};

export const deleteEngineer = async (id: number) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return response.json();
};