const API_URL = "http://localhost:5000/api/rta-documents";

import type { RtaDocument } from "../types/RtaDocument";

// Get All
export const getRtaDocuments = async (): Promise<RtaDocument[]> => {
  const response = await fetch(API_URL);
  return response.json();
};

// Add
export const addRtaDocument = async (document: RtaDocument) => {
  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(document),
  });
};

// Update
export const updateRtaDocument = async (
  id: number,
  document: RtaDocument
) => {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(document),
  });
};

// Delete
export const deleteRtaDocument = async (id: number) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};