export interface Vehicle {
  id: number;

  vehicleNo: string;
  vehicleName: string;
  vehicleType: string;

  manufacturer: string;
  model: string;

  rcNumber: string;
  registeringRTO: string;
  registrationDate: string;

  chassisNo: string;
  engineNo: string;
  fuelType: string;

  site: string;
  engineer: string;

  targetKm: number;
  targetHours: number;

  status: "Active" | "Inactive";
}