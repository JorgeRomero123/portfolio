// Zero framework imports — extractable to standalone package

export type OperationType = 'venta' | 'renta';

export type PropertyType =
  | 'casa'
  | 'departamento'
  | 'terreno'
  | 'oficina'
  | 'local_comercial';

export type Currency = 'MXN' | 'USD';

export type TemplateId = 'classic' | 'modern';

export type ColorPaletteId = 'navy-orange' | 'green-gold' | 'black-red' | 'burgundy-cream' | 'blue-teal';

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  primary: string;
  accent: string;
  accentLight: string;
}

export interface PropertyImage {
  id: string;
  dataUrl: string;
  label: string;
  width: number;
  height: number;
}

export interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  company: string;
  photo: string;
  companyLogo: string;
}

export interface PropertyData {
  operationType: OperationType;
  propertyType: PropertyType;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  totalArea: number;
  builtArea: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms: number;
  parkingSpots: number;
  floors: number;
  age: number;
  address: string;
  colonia: string;
  city: string;
  state: string;
  zipCode: string;
  mapsUrl: string;
  amenities: string[];
  agent: AgentInfo;
  images: PropertyImage[];
}
