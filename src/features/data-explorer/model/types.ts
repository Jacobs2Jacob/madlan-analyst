export type ExplorerFilters = {
  search: string;
  city: string;
  rooms: string;
  propertyType: string;
  parking: string;
};

export const initialFilters: ExplorerFilters = {
  search: '',
  city: '',
  rooms: '',
  propertyType: '',
  parking: '',
};
