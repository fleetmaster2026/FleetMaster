export interface RTARecord {

    id?: number;

    vehicleNo: string;

    site: string;

    engineer: string;

    registrationDate: string;
    insuranceExpiry: string;
    fitnessExpiry: string;
    permitExpiry: string;
    pollutionExpiry: string;
    taxExpiry: string;

    insuranceStatus: string;
    fitnessStatus: string;
    permitStatus: string;
    pollutionStatus: string;

    overallStatus: string;

    remarks: string;

}