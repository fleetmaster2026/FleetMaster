import SearchableSelect from "../common/SearchableSelect";
import {
  FaSave,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";

import type { Vehicle } from "../../types/Vehicle";

import type { SiteEngineer } from "../../types/SiteEngineer";

interface Props {
  formData: Vehicle;
  setFormData: React.Dispatch<React.SetStateAction<Vehicle>>;
  editingId: number | null;
  handleSave: () => void;
  clearForm: () => void;

  siteEngineers: SiteEngineer[];
}

const VehicleForm = ({
  formData,
  setFormData,
  editingId,
  handleSave,
  clearForm,
  siteEngineers,
}: Props) => {
  const uniqueSites = [
  ...new Map(
    siteEngineers.map((item) => [
      item.siteLocation,
      item,
    ])
  ).values(),
];

const filteredEngineers =
  siteEngineers.filter(
    (item) =>
      item.siteLocation === formData.site
  );
  return (
    <>
      <div className="form-card">

        <h2 className="section-title">
          Vehicle Information
        </h2>

        <div className="form-grid">

          <div className="form-group">
            <label>Owner</label>

            <input
              value={formData.owner}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  owner: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Vehicle Number</label>

            <input
              value={formData.vehicleNo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vehicleNo: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Vehicle Name</label>

            <input
              value={formData.vehicleName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vehicleName: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Vehicle Type</label>

            <input
              value={formData.vehicleType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vehicleType: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Manufacturer</label>

            <input
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  manufacturer: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Registering RTO</label>

            <input
              value={formData.registeringRTO}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registeringRTO: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Registration Date</label>

            <input
              type="date"
              value={formData.registrationDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  registrationDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Chassis Number</label>

            <input
              value={formData.chassisNo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  chassisNo: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Engine Number</label>

            <input
              value={formData.engineNo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  engineNo: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Fuel Type</label>

            <input
              value={formData.fuelType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fuelType: e.target.value,
                })
              }
            />
          </div>

        </div>

      </div>

      <div className="form-card">

        <h2 className="section-title">
          Assignment Details
        </h2>

        <div className="form-grid">

          <div className="form-group">
  <label>Site</label>

  <SearchableSelect
  options={uniqueSites.map((site) => ({
    value: site.siteLocation,
    label: site.siteLocation,
  }))}
  value={formData.site}
  placeholder="Select Site"
  onChange={(value) => {
    const selectedSite = siteEngineers.find(
      (item) => item.siteLocation === value
    );

    setFormData({
      ...formData,
      site: value,
      engineer: "",
      projectCode: selectedSite
        ? selectedSite.projectCode
        : "",
    });
  }}
/>
</div>

          <div className="form-group">
  <label>Project Code</label>

  <input
    value={formData.projectCode}
    readOnly
  />
</div>

          <div className="form-group">
  <label>Engineer</label>

  <SearchableSelect
  options={filteredEngineers.map((engineer) => ({
    value: engineer.engineerName,
    label: engineer.engineerName,
  }))}
  value={formData.engineer}
  placeholder="Select Engineer"
  onChange={(value) =>
    setFormData({
      ...formData,
      engineer: value,
    })
  }
/>
</div>

          <div className="form-group">
            <label>Target KM</label>

            <input
              type="number"
              value={formData.targetKm}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetKm: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Target Hours</label>

            <input
              type="number"
              value={formData.targetHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetHours: Number(e.target.value),
                })
              }
            />
          </div>

        </div>

      </div>

      <div className="form-card">

        <div className="button-group">

          {editingId === null ? (
            <>
              <button
                className="save-btn"
                onClick={handleSave}
              >
                <FaSave />
                &nbsp; Save Vehicle
              </button>

              <button
                className="clear-btn"
                onClick={clearForm}
              >
                <FaTimes />
                &nbsp; Clear
              </button>
            </>
          ) : (
            <>
              <button
                className="update-btn"
                onClick={handleSave}
              >
                <FaSyncAlt />
                &nbsp; Update Vehicle
              </button>

              <button
                className="clear-btn"
                onClick={clearForm}
              >
                <FaTimes />
                &nbsp; Cancel
              </button>
            </>
          )}

        </div>

      </div>

    </>
  );
};

export default VehicleForm;