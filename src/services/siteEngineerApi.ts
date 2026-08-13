import axios from "axios";
import type { SiteEngineer } from "../types/SiteEngineer";

const API = "https://fleetmaster-server.onrender.com/api/site-engineers";

export const getSiteEngineers = async (): Promise<SiteEngineer[]> => {
  const res = await axios.get(API);
  return res.data;
};

export const addSiteEngineer = async (
  data: SiteEngineer
) => {
  const res = await axios.post(API, data);
  return res.data;
};

export const updateSiteEngineer = async (
  id: number,
  data: SiteEngineer
) => {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data;
};

export const deleteSiteEngineer = async (
  id: number
) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};