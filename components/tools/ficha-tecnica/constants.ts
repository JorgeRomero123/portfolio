// Zero framework imports — extractable to standalone package

import type { OperationType, PropertyType, PropertyData, ColorPalette } from './types';

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'navy-orange', name: 'Navy / Naranja', primary: '#1a2744', accent: '#e8792b', accentLight: '#f5a623' },
  { id: 'green-gold', name: 'Verde / Dorado', primary: '#1b4332', accent: '#b8860b', accentLight: '#daa520' },
  { id: 'black-red', name: 'Negro / Rojo', primary: '#1a1a1a', accent: '#c0392b', accentLight: '#e74c3c' },
  { id: 'burgundy-cream', name: 'Borgoña / Crema', primary: '#4a1526', accent: '#c49a6c', accentLight: '#d4b896' },
  { id: 'blue-teal', name: 'Azul / Teal', primary: '#1a3a4a', accent: '#0d9488', accentLight: '#2dd4bf' },
];

export const OPERATION_TYPES: { value: OperationType; label: string }[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'renta', label: 'Renta' },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'local_comercial', label: 'Local Comercial' },
];

export const MEXICAN_STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];

export const AMENITY_PRESETS = [
  'Alberca',
  'Jardín',
  'Terraza',
  'Roof Garden',
  'Gimnasio',
  'Estacionamiento Techado',
  'Cuarto de Servicio',
  'Bodega',
  'Elevador',
  'Seguridad 24/7',
  'Área de Juegos',
  'Salón de Eventos',
  'Cocina Integral',
  'Aire Acondicionado',
  'Calefacción',
  'Chimenea',
  'Jacuzzi',
  'Cisterna',
  'Paneles Solares',
  'Portón Eléctrico',
];

export const IMAGE_LABELS = [
  'Fachada',
  'Sala',
  'Comedor',
  'Cocina',
  'Recámara Principal',
  'Recámara',
  'Baño',
  'Jardín',
  'Alberca',
  'Terraza',
  'Estacionamiento',
  'Vista',
  'Otro',
];

export const MAX_IMAGES = 12;

export const DEFAULT_PROPERTY_DATA: PropertyData = {
  operationType: 'venta',
  propertyType: 'casa',
  title: '',
  description: '',
  price: 0,
  currency: 'MXN',
  totalArea: 0,
  builtArea: 0,
  bedrooms: 0,
  bathrooms: 0,
  halfBathrooms: 0,
  parkingSpots: 0,
  floors: 0,
  age: 0,
  address: '',
  colonia: '',
  city: '',
  state: '',
  zipCode: '',
  mapsUrl: '',
  amenities: [],
  agent: {
    name: '',
    phone: '',
    email: '',
    company: '',
    photo: '',
    companyLogo: '',
  },
  images: [],
};
