export interface FineRecord {
  id?: number;

  vehicleNo: string;
  projectCode: string;
  site: string;
  engineer: string;

  fineDate: string;
  fineReason: string;
  fineAmount: number;

  remarks: string;
}

export interface FineReportResponse {
  totalRecords: number;
  totalFineAmount: number;
  data: FineRecord[];
}