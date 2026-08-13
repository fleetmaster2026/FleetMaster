import axios from "axios";
import type { BreakdownRecord as Breakdown } from "../types/Breakdown";

const API_URL = "http://localhost:5000/api/breakdowns";

// ================= GET =================

export const getBreakdowns = async (): Promise<Breakdown[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// ================= ADD =================

export const addBreakdown = async (
  breakdown: Breakdown
): Promise<void> => {
  await axios.post(API_URL, breakdown);
};

// ================= UPDATE =================

export const updateBreakdown = async (
  id: number,
  breakdown: Breakdown
): Promise<void> => {
  await axios.put(`${API_URL}/${id}`, breakdown);
};

// ================= DELETE =================

export const deleteBreakdown = async (
  id: number
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};