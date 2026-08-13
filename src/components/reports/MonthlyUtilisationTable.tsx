import type { MonthlyUtilisationRecord } from "../../types/MonthlyUtilisation";

interface Props {
  records: MonthlyUtilisationRecord[];
}

const getBadgeClass = (value: number) => {
  if (value >= 100) return "badge-green";
  if (value >= 75) return "badge-yellow";
  return "badge-red";
};

const MonthlyUtilisationTable = ({ records }: Props) => {
  return (
    <div className="form-card">

      <h2 className="section-title">
        Monthly Utilisation Report
      </h2>

      <table className="data-table">

        <thead>

          <tr>

            <th>Sr.No</th>

            <th>Month</th>

            <th>Vehicle</th>

            <th>Project Code</th>

            <th>Site</th>

            <th>Engineer</th>

            <th>Opening KM</th>

            <th>Closing KM</th>

            <th>Difference KM</th>

            <th>Target KM</th>

            <th>KM Utilisation</th>

            <th>Opening Hours</th>

            <th>Closing Hours</th>

            <th>Difference Hours</th>

            <th>Target Hours</th>

            <th>Hours Utilisation</th>

            <th>Remarks</th>

          </tr>

        </thead>

        <tbody>

          {records.map((item, index) => (

            <tr
              key={`${item.vehicleNo}-${item.utilisationMonth}-${index}`}
            >

              <td>{index + 1}</td>

              <td>{item.utilisationMonth}</td>

              <td>{item.vehicleNo}</td>

              <td>{item.projectCode}</td>

              <td>{item.site}</td>

              <td>{item.engineer || "-"}</td>

              <td>{item.openingKm}</td>

              <td>{item.closingKm}</td>

              <td>{item.differenceKm}</td>

              <td>{item.targetKm}</td>

              <td>
                <span className={getBadgeClass(item.kmUtilisation)}>
                  {item.kmUtilisation}%
                </span>
              </td>

              <td>{item.openingHours}</td>

              <td>{item.closingHours}</td>

              <td>{item.differenceHours}</td>

              <td>{item.targetHours}</td>

              <td>
                <span className={getBadgeClass(item.hoursUtilisation)}>
                  {item.hoursUtilisation}%
                </span>
              </td>

              <td>{item.remarks || "-"}</td>

            </tr>

          ))}

          {records.length === 0 && (

            <tr>

              <td
                colSpan={17}
                style={{ textAlign: "center" }}
              >
                No Monthly Utilisation Records Found
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
};

export default MonthlyUtilisationTable;