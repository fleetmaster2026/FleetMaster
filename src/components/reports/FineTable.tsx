import type { FineRecord } from "../../types/Fine";

interface Props {
  records: FineRecord[];
}

const FineTable = ({ records }: Props) => {
  return (
    <div className="form-card">
      <h2 className="section-title">
        Fine Records
      </h2>

      <table className="data-table">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>Vehicle No</th>
            <th>Project Code</th>
            <th>Site</th>
            <th>Engineer</th>
            <th>Fine Date</th>
            <th>Fine Reason</th>
            <th>Fine Amount</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {records.map((item, index) => (
            <tr key={item.id ?? `${item.vehicleNo}-${index}`}>

              <td>{index + 1}</td>

              <td>{item.vehicleNo}</td>

              <td>{item.projectCode}</td>

              <td>{item.site}</td>

              <td>{item.engineer || "-"}</td>

              <td>{item.fineDate}</td>

              <td>{item.fineReason}</td>

              <td>
                ₹{Number(item.fineAmount).toLocaleString()}
              </td>

              <td>{item.remarks || "-"}</td>

            </tr>
          ))}

          {records.length === 0 && (
            <tr>
              <td
                colSpan={9}
                style={{ textAlign: "center" }}
              >
                No Fine Records Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FineTable;