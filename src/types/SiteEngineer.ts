export interface SiteEngineer {
  id?: number;

  siteLocation: string;
  projectCode: string;
  businessUnit: "IRR" | "WATER";

  engineerName: string;
  mobile: string;
  email: string;
  designation: string;

  projectManagerName: string;
  pmContact: string;
  pmEmail: string;
}