export interface RtaDocument {
  id?: number;

  vehicleNo: string;
  registeringRTO: string;
  site: string;
  engineer: string;

  registrationDate: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  taxExpiry: string;

  remarks: string;
}