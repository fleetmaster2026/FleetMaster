import Select from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  placeholder,
  onChange,
  isDisabled = false,
}: Props) {
  return (
    <Select
  options={options}
  value={options.find((o) => o.value === value) ?? null}
  onChange={(option) => onChange(option?.value ?? "")}
  placeholder={placeholder}
  isSearchable
  isClearable
  isDisabled={isDisabled}
  menuPortalTarget={document.body}
  styles={{
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    control: (base) => ({
      ...base,
      minHeight: 42,
    }),
  }}
/>
  );
}