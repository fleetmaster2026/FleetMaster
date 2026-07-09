export interface Utilisation {
  id: number;
  vehicleId: number;
  month: string;

  startKm: number;
  endKm: number;

  startHrs: number;
  endHrs: number;

  runKm: number;
  runHrs: number;

  kmPercent: number;
  hrsPercent: number;
}