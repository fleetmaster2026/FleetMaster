import type { MonthlyUtilisation } from "../types/MonthlyUtilisation";

const API_URL = "http://localhost:5000/api/monthly-utilisation";

// =======================
// GET
// =======================
export const getMonthlyUtilisations = async (): Promise<
  MonthlyUtilisation[]
> => {
  const response = await fetch(API_URL);
  return response.json();
};

// =======================
// ADD
// =======================
export const addMonthlyUtilisation = async (
  data: Omit<MonthlyUtilisation, "id">
) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// =======================
// UPDATE
// =======================
export const updateMonthlyUtilisation = async (
  id: number,
  data: Omit<MonthlyUtilisation, "id">
) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// =======================
// DELETE
// =======================
export const deleteMonthlyUtilisation = async (id: number) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return response.json();
};