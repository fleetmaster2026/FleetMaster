import axios from "axios";
import type { FineRecord as Fine } from "../types/Fine";

const API_URL = "http://localhost:5000/api/fines";

export const getFines = async (): Promise<Fine[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const addFine = async (fine: Fine) => {
  await axios.post(API_URL, fine);
};

export const updateFine = async (
  id: number,
  fine: Fine
) => {
  await axios.put(`${API_URL}/${id}`, fine);
};

export const deleteFine = async (id: number) => {
  await axios.delete(`${API_URL}/${id}`);
};