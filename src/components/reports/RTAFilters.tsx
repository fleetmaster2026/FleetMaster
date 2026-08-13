export interface Props {
  search: string;
  setSearch: (value: string) => void;

  site: string;
  setSite: (value: string) => void;

  engineer: string;
  setEngineer: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  sites: string[];
  engineers: string[];
}