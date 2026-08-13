import axios from "axios";
import type { RtaDocument } from "../types/RtaDocument";

const API_URL = "http://localhost:5000/api/rta-documents";

export interface ReminderRunSiteDetail {
  site: string;
  engineer: string;
  vehicles: number;
  alerts: number;
  status: string;
}

export interface ReminderRunSummary {
  totalVehicles: number;
  totalAlerts: number;
  emailsSent: number;
  failedEmails: number;
  skipped: number;
  errors: string[];
  siteDetails: ReminderRunSiteDetail[];
}

// Get All
export const getRtaDocuments = async (): Promise<RtaDocument[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Manually trigger the "send reminder emails to every engineer + summary
// to admin" run - the same process the 8 AM cron job runs.
export const sendRtaReminders = async (): Promise<ReminderRunSummary> => {
  const response = await axios.post(`${API_URL}/send-reminders`);
  return response.data.summary;
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