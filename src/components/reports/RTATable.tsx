import React from "react";
import type { RTARecord } from "../../types/RTA";

interface Props {
  records: RTARecord[];
}

const getBadgeClass = (status: string) => {
  switch (status) {
    case "Valid":
      return "badge-green";

    case "Expired":
      return "badge-red";

    case "Expiring Soon":
      return "badge-yellow";

    default:
      return "badge-grey";
  }
};

const RTATable: React.FC<Props> = ({ records }) => {
  return (
    <div className="form-card">
      <h2 className="section-title">RTA Records</h2>

      <table className="data-table">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>Vehicle No</th>
            <th>Site</th>
            <th>Engineer</th>

            <th>Registration Date</th>
<th>Insurance Expiry</th>
<th>Fitness Expiry</th>
<th>Permit Expiry</th>
<th>Pollution Expiry</th>

            <th>Overall</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {records.map((item, index) => (
            <tr key={item.id ?? `${item.vehicleNo}-${index}`}>
              <td>{index + 1}</td>
              <td>{item.vehicleNo}</td>
              <td>{item.site}</td>
              <td>{item.engineer || "-"}</td>

              <td>
                {item.registrationDate}
              </td>

              <td>
                {item.insuranceExpiry}
              </td>

              <td>
                {item.fitnessExpiry}
              </td>

              <td>
                {item.permitExpiry}
              </td>

              <td>
                {item.pollutionExpiry}
              </td>

              <td>
                <span className={getBadgeClass(item.overallStatus)}>
                  {item.overallStatus}
                </span>
              </td>

              <td>{item.remarks || "-"}</td>
            </tr>
          ))}

          {records.length === 0 && (
            <tr>
              <td colSpan={11} style={{ textAlign: "center" }}>
                No RTA Records Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RTATable;