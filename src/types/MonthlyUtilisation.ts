export interface MonthlyUtilisationRecord {
  id?: number;

  utilisationMonth: string;

  vehicleNo: string;
  projectCode: string;
  site: string;
  engineer: string;

  openingKm: number;
  closingKm: number;
  differenceKm: number;
  targetKm: number;
  kmUtilisation: number;

  openingHours: number;
  closingHours: number;
  differenceHours: number;
  targetHours: number;
  hoursUtilisation: number;

  remarks: string;
}