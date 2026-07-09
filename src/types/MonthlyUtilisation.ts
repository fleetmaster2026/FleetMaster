export interface MonthlyUtilisation {
  id?: number;

  utilisationMonth: string;

  vehicleNo: string;
  site: string;
  engineer: string;

  // KM
  openingKm: number;
  closingKm: number;
  differenceKm: number;
  targetKm: number;
  kmUtilisation: number;

  // HOURS
  openingHours: number;
  closingHours: number;
  differenceHours: number;
  targetHours: number;
  hoursUtilisation: number;

  remarks: string;
}