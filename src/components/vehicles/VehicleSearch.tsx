import {
  FaTimes,
} from "react-icons/fa";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

const VehicleSearch = ({
  search,
  setSearch,
}: Props) => {
  return (
    <div className="form-card">

      <h2 className="section-title">
        Search & Filters
      </h2>

      <div className="form-grid">

        <div className="form-group">

          <label>Search Vehicle</label>

          <input
            type="text"
            placeholder="Vehicle No / Vehicle Name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div
          className="form-group"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >

          <button
            className="clear-btn"
            onClick={() => setSearch("")}
          >
            <FaTimes />
            &nbsp; Clear
          </button>

        </div>

      </div>

    </div>
  );
};

export default VehicleSearch;