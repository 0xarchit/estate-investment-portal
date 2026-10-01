import { api, unwrap } from "./client";
import type { Property, Paginated } from "../types";
export type PropertyFilters = Record<string, string | number | undefined>;
export const getProperties = (filters: PropertyFilters = {}) =>
  unwrap<Paginated<Property>>(api.get("/properties", { params: filters }));
export const listProperties = getProperties;
export const getProperty = (id: string) =>
  unwrap<Property>(api.get(`/properties/${id}`));
