// Extractable — only depends on @react-pdf/renderer + local types
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';
import type { PropertyData, ColorPalette } from '../types';
import { formatPrice, formatArea } from '../utils';
import { registerFonts, colors } from './shared-styles';

registerFonts();

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  terreno: 'Terreno',
  oficina: 'Oficina',
  local_comercial: 'Local Comercial',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  headerLogo: {
    width: 90,
    height: 36,
    objectFit: 'contain' as const,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 600,
  },
  headerPhone: {
    color: colors.gray200,
    fontSize: 9,
    marginTop: 2,
  },
  hero: {
    width: '100%',
    height: 260,
    objectFit: 'cover' as const,
  },
  titleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 700,
    maxWidth: '60%',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 700,
  },
  operationBadge: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingTop: 16,
    gap: 20,
  },
  descCol: {
    flex: 3,
  },
  specsCol: {
    flex: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: 4,
  },
  descText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.gray700,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  specLabel: {
    fontSize: 9,
    color: colors.gray500,
  },
  specValue: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.gray900,
  },
  location: {
    paddingHorizontal: 30,
    paddingTop: 14,
  },
  locationText: {
    fontSize: 9,
    color: colors.gray600,
    lineHeight: 1.4,
  },
  mapsLink: {
    fontSize: 8,
    marginTop: 4,
    textDecoration: 'none' as const,
  },
  amenitiesWrap: {
    paddingHorizontal: 30,
    paddingTop: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  amenityPill: {
    fontSize: 8,
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray200,
  },
  footerBold: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.white,
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 14,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 30,
    gap: 10,
  },
  galleryItem: {
    width: '48%',
    marginBottom: 8,
  },
  galleryImage: {
    width: '100%',
    height: 170,
    objectFit: 'cover' as const,
    borderRadius: 4,
  },
  galleryLabel: {
    fontSize: 8,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: 3,
  },
});

interface Props {
  data: PropertyData;
  palette: ColorPalette;
}

export default function ClassicTemplate({ data, palette }: Props) {
  const heroImage = data.images[0];
  const galleryImages = data.images.slice(1);
  const hasAgent = data.agent.name;

  const specs: { label: string; value: string }[] = [];
  if (data.totalArea) specs.push({ label: 'Superficie Total', value: formatArea(data.totalArea) });
  if (data.builtArea) specs.push({ label: 'Superficie Construida', value: formatArea(data.builtArea) });
  if (data.bedrooms) specs.push({ label: 'Recámaras', value: String(data.bedrooms) });
  if (data.bathrooms) specs.push({ label: 'Baños', value: String(data.bathrooms) });
  if (data.halfBathrooms) specs.push({ label: 'Medios Baños', value: String(data.halfBathrooms) });
  if (data.parkingSpots) specs.push({ label: 'Estacionamiento', value: String(data.parkingSpots) });
  if (data.floors) specs.push({ label: 'Niveles', value: String(data.floors) });
  if (data.age) specs.push({ label: 'Antigüedad', value: `${data.age} años` });

  const locationParts = [data.address, data.colonia, data.city, data.state, data.zipCode].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={[s.header, { backgroundColor: palette.primary }]}>
          <View>
            {data.agent.companyLogo ? (
              <Image src={data.agent.companyLogo} style={s.headerLogo} />
            ) : (
              <Text style={s.headerName}>{data.agent.company || ''}</Text>
            )}
          </View>
          <View style={s.headerRight}>
            {hasAgent && <Text style={s.headerName}>{data.agent.name}</Text>}
            {data.agent.phone && <Text style={s.headerPhone}>{data.agent.phone}</Text>}
          </View>
        </View>

        {heroImage && <Image src={heroImage.dataUrl} style={s.hero} />}

        <View style={[s.titleBanner, { borderBottomColor: palette.accent }]}>
          <View>
            <Text style={[s.operationBadge, { backgroundColor: palette.primary }]}>
              {data.operationType === 'venta' ? 'EN VENTA' : 'EN RENTA'} — {(PROPERTY_TYPE_LABELS[data.propertyType] || data.propertyType).toUpperCase()}
            </Text>
            <Text style={[s.titleText, { color: palette.primary }]}>{data.title}</Text>
          </View>
          <Text style={[s.priceText, { color: palette.accent }]}>{formatPrice(data.price, data.currency)}</Text>
        </View>

        <View style={s.body}>
          <View style={s.descCol}>
            <Text style={[s.sectionLabel, { color: palette.primary }]}>Descripción</Text>
            <Text style={s.descText}>{data.description || 'Sin descripción.'}</Text>
          </View>
          {specs.length > 0 && (
            <View style={s.specsCol}>
              <Text style={[s.sectionLabel, { color: palette.primary }]}>Especificaciones</Text>
              {specs.map((sp) => (
                <View key={sp.label} style={s.specRow}>
                  <Text style={s.specLabel}>{sp.label}</Text>
                  <Text style={s.specValue}>{sp.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {(locationParts.length > 0 || data.mapsUrl) && (
          <View style={s.location}>
            <Text style={[s.sectionLabel, { color: palette.primary }]}>Ubicación</Text>
            {locationParts.length > 0 && (
              <Text style={s.locationText}>{locationParts.join(', ')}</Text>
            )}
            {data.mapsUrl && (
              <Link src={data.mapsUrl} style={[s.mapsLink, { color: palette.accent }]}>Ver en Google Maps</Link>
            )}
          </View>
        )}

        {data.amenities.length > 0 && (
          <View style={s.amenitiesWrap}>
            <Text style={[s.sectionLabel, { color: palette.primary }]}>Amenidades</Text>
            <View style={s.amenitiesGrid}>
              {data.amenities.map((a) => (
                <Text key={a} style={[s.amenityPill, { color: palette.primary }]}>{a}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={[s.footer, { backgroundColor: palette.primary }]}>
          <View>
            {hasAgent && <Text style={s.footerBold}>{data.agent.name}</Text>}
            {data.agent.email && <Text style={s.footerText}>{data.agent.email}</Text>}
          </View>
          <View>
            {data.agent.phone && <Text style={s.footerText}>{data.agent.phone}</Text>}
          </View>
        </View>
      </Page>

      {galleryImages.length > 0 && (
        <Page size="LETTER" style={s.page}>
          <View style={[s.header, { backgroundColor: palette.primary }]}>
            <View>
              {data.agent.companyLogo ? (
                <Image src={data.agent.companyLogo} style={s.headerLogo} />
              ) : (
                <Text style={s.headerName}>{data.agent.company || ''}</Text>
              )}
            </View>
            <View style={s.headerRight}>
              {hasAgent && <Text style={s.headerName}>{data.agent.name}</Text>}
            </View>
          </View>

          <Text style={[s.galleryTitle, { color: palette.primary }]}>Galería de Fotos</Text>

          <View style={s.galleryGrid}>
            {galleryImages.map((img) => (
              <View key={img.id} style={s.galleryItem}>
                <Image src={img.dataUrl} style={s.galleryImage} />
                {img.label && <Text style={s.galleryLabel}>{img.label}</Text>}
              </View>
            ))}
          </View>

          <View style={[s.footer, { backgroundColor: palette.primary }]}>
            <View>
              {hasAgent && <Text style={s.footerBold}>{data.agent.name}</Text>}
              {data.agent.email && <Text style={s.footerText}>{data.agent.email}</Text>}
            </View>
            <View>
              {data.agent.phone && <Text style={s.footerText}>{data.agent.phone}</Text>}
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}
