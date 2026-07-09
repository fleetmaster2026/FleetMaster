export interface Site {
  id: number;
  siteName: string;
  location: string;
  projectCode: string;
  status: "Active" | "Inactive";
}