interface VehicleSearchProps {
  search: string;
  setSearch: (value: string) => void;
}

const VehicleSearch = ({
  search,
  setSearch,
}: VehicleSearchProps) => {
  return (
    <input
      placeholder="Search Vehicle..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{
        width: 300,
        padding: 8,
        marginBottom: 20,
      }}
    />
  );
};

export default VehicleSearch;