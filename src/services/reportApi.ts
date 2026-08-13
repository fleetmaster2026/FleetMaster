import axios from "axios";

import type { Vehicle } from "../types/Vehicle";

const API_URL = "http://localhost:5000/api/reports";

export const getVehicleReport = async (
  params?: {
    search?: string;
    site?: string;
    type?: string;
    status?: string;
  }
): Promise<Vehicle[]> => {

  const response = await axios.get(
    `${API_URL}/vehicles`,
    {
      params,
    }
  );

  return response.data;
};
export const getRTAReport = async (
  params?: {
    search?: string;
    site?: string;
    engineer?: string;
    status?: string;
  }
) => {
  const response = await axios.get(
    `${API_URL}/rta`,
    {
      params,
    }
  );

  return response.data;
};
export const getBreakdownReport = async (
  params?: {
    search?: string;
    site?: string;
    engineer?: string;
    breakdownType?: string;
  }
) => {
  const response = await axios.get(
    `${API_URL}/breakdowns`,
    {
      params,
    }
  );

  return response.data;
};
export const getFineReport = async (
  params?: {
    search?: string;
    site?: string;
    engineer?: string;
  }
) => {
  const response = await axios.get(
    `${API_URL}/fines`,
    {
      params,
    }
  );

  return response.data;
};
export const getMonthlyUtilisationReport = async (
  params?: {
    month?: string;
    site?: string;
    engineer?: string;
    vehicleNo?: string;
  }
) => {
  const response = await axios.get(
    `${API_URL}/monthly-utilisation`,
    {
      params,
    }
  );

  return response.data;
};