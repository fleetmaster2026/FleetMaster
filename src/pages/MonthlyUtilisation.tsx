export interface MonthlyUtilisation {
  id?: number;

  utilisationMonth: string;

  vehicleNo: string;
  site: string;
  engineer: string;

  // KM
  openingKm: number;
  closingKm: number;
  diffKm: number;
  targetKm: number;
  kmUtilisation: number;

  // Hours
  openingHours: number;
  closingHours: number;
  diffHours: number;
  targetHours: number;
  hoursUtilisation: number;

  remarks: string;
}