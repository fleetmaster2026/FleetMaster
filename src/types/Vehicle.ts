export interface Vehicle {
  id: number;

  vehicleNo: string;
  vehicleName: string;
  vehicleType: string;
  owner: string;

  manufacturer: string;

  registeringRTO: string;
  registrationDate: string;

  chassisNo: string;
  engineNo: string;
  fuelType: string;

  projectCode: string;
  site: string;
  engineer: string;

  targetKm: number;
  targetHours: number;
}