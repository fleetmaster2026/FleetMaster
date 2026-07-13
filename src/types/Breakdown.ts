export interface Breakdown {
  id?: number;

  vehicleNo: string;
  site: string;
  engineer: string;

  breakdownDate: string;
  breakdownType: string;
  breakdownDescription: string;

  requireFund: string;
  estimatedAmount: number;

  remarks: string;
}