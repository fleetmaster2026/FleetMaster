import type { BreakdownRecord } from "../../types/Breakdown";

interface Props {
  records: BreakdownRecord[];
}

// Mirrors the live day-count logic used in the Breakdown Register so the
// report always reflects today's date rather than a stored, possibly
// stale number.
const getBreakdownDays = (dateStr?: string): number => {
  if (!dateStr) return 0;

  const breakdownDate = new Date(dateStr);
  if (Number.isNaN(breakdownDate.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  breakdownDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - breakdownDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
};

const BreakdownTable = ({ records }: Props) => {
  return (
    <div className="form-card">
      <h2 className="section-title">
        Breakdown Records
      </h2>

      <table className="data-table">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>BU</th>
            <th>Project Code</th>
            <th>Vehicle No</th>
            <th>Vehicle Name</th>
            <th>Vehicle Type</th>
            <th>Site</th>
            <th>Engineer</th>
            <th>Date</th>
            <th>Days</th>
            <th>Type</th>
            <th>Description</th>
            <th>Estimated Amount</th>
            <th>Approval Status</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {records.map((item, index) => (
            <tr key={item.id ?? `${item.vehicleNo}-${index}`}>

              <td>{index + 1}</td>

              <td>{item.businessUnit}</td>

              <td>{item.projectCode}</td>

              <td>{item.vehicleNo}</td>

              <td>{item.vehicleName}</td>

              <td>{item.vehicleType}</td>

              <td>{item.site}</td>

              <td>{item.engineer || "-"}</td>

              <td>{item.breakdownDate}</td>

              <td>
                {(() => {
                  const days = getBreakdownDays(item.breakdownDate);
                  return (
                    <>
                      {days} day(s)
                      {days > 30 && (
                        <>
                          {" "}
                          <span className="badge-red">Overdue</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </td>

              <td>{item.breakdownType}</td>

              <td>
                {item.breakdownDescription || "-"}
              </td>

              <td>
                ₹
                {Number(item.estimatedAmount).toLocaleString()}
              </td>

              <td>
                <span
                  className={
                    item.approvalStatus === "Approved"
                      ? "badge-green"
                      : item.approvalStatus === "Rejected"
                      ? "badge-red"
                      : "badge-gray"
                  }
                >
                  {item.approvalStatus || "-"}
                </span>
              </td>

              <td>{item.remarks || "-"}</td>

            </tr>
          ))}

          {records.length === 0 && (
            <tr>
              <td
                colSpan={15}
                style={{ textAlign: "center" }}
              >
                No Breakdown Records Found
              </td>
            </tr>
          )}

        </tbody>
      </table>
    </div>
  );
};

export default BreakdownTable;