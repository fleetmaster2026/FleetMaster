import axios from "axios";
import type { RtaDocument } from "../types/RtaDocument";

const API_URL = "http://localhost:5000/api/rta-documents";

// Get All
export const getRtaDocuments = async (): Promise<RtaDocument[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Add
export const addRtaDocument = async (
  data: RtaDocument
): Promise<RtaDocument> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

// Update
export const updateRtaDocument = async (
  id: number,
  data: RtaDocument
): Promise<RtaDocument> => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

// Delete
export const deleteRtaDocument = async (
  id: number
): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};