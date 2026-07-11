export interface RtaDocument {
  id?: number;

  vehicleNo: string;
  site: string;
  engineer: string;

  rcExpiry: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;

  remarks: string;
}