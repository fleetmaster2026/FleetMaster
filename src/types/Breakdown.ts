export interface BreakdownRecord {
  id?: number;

  businessUnit: string;
  projectCode: string;

  vehicleNo: string;
  vehicleName: string;
  vehicleType: string;

  site: string;
  engineer: string;

  breakdownDate: string;
  breakdownDays: number;
  breakdownType: string;
  breakdownDescription: string;

  estimatedAmount: number;
  approvalStatus: string;

  remarks: string;
}