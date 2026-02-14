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
    color: colors.white,
    backgroundColor: colors.dark,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 60,
    backgroundColor: colors.darkOverlay,
  },
  heroOperationBadge: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 4,
  },
  heroPrice: {
    fontSize: 18,
    fontWeight: 700,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 7,
    color: colors.gray200,
    marginTop: 2,
    textTransform: 'uppercase' as const,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 16,
    backgroundColor: colors.white,
    color: colors.gray900,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    marginTop: 10,
  },
  descText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.gray700,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  locationPin: {
    fontSize: 11,
    fontWeight: 700,
  },
  locationText: {
    fontSize: 9,
    color: colors.gray600,
    flex: 1,
    lineHeight: 1.4,
  },
  mapsLink: {
    fontSize: 8,
    marginTop: 4,
    marginLeft: 15,
    textDecoration: 'none' as const,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 3,
  },
  amenityCheck: {
    fontSize: 8,
    marginRight: 4,
    fontWeight: 700,
  },
  amenityText: {
    fontSize: 8,
    color: colors.gray700,
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
    paddingVertical: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    objectFit: 'cover' as const,
  },
  footerName: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.white,
  },
  footerDetail: {
    fontSize: 8,
    color: colors.gray200,
    marginTop: 1,
  },
  footerLogo: {
    width: 70,
    height: 28,
    objectFit: 'contain' as const,
  },
  galleryPage: {
    fontFamily: 'Montserrat',
    backgroundColor: colors.dark,
    paddingTop: 20,
  },
  galleryHeader: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  galleryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  galleryLarge: {
    width: '55%',
    height: 200,
    borderRadius: 6,
    objectFit: 'cover' as const,
  },
  gallerySmallCol: {
    width: '45%',
    gap: 10,
  },
  gallerySmall: {
    width: '100%',
    height: 95,
    borderRadius: 6,
    objectFit: 'cover' as const,
  },
  galleryFullRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  galleryHalf: {
    width: '48%',
    height: 170,
    borderRadius: 6,
    objectFit: 'cover' as const,
  },
  galleryLabel: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    fontSize: 7,
    color: colors.white,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
});

interface Props {
  data: PropertyData;
  palette: ColorPalette;
}

export default function ModernTemplate({ data, palette }: Props) {
  const heroImage = data.images[0];
  const galleryImages = data.images.slice(1);
  const hasAgent = data.agent.name;

  const locationParts = [data.address, data.colonia, data.city, data.state, data.zipCode].filter(Boolean);

  const statBoxes: { value: string; label: string }[] = [];
  if (data.bedrooms) statBoxes.push({ value: String(data.bedrooms), label: 'Recámaras' });
  if (data.bathrooms) statBoxes.push({ value: String(data.bathrooms), label: 'Baños' });
  if (data.totalArea) statBoxes.push({ value: formatArea(data.totalArea), label: 'Superficie' });
  if (data.parkingSpots) statBoxes.push({ value: String(data.parkingSpots), label: 'Estac.' });
  if (data.floors) statBoxes.push({ value: String(data.floors), label: 'Niveles' });

  const galleryRows: React.ReactNode[] = [];
  let i = 0;
  while (i < galleryImages.length) {
    if (i + 2 < galleryImages.length) {
      const large = galleryImages[i];
      const sm1 = galleryImages[i + 1];
      const sm2 = galleryImages[i + 2];
      galleryRows.push(
        <View key={`row-${i}`} style={s.galleryRow}>
          <View style={{ width: '55%', position: 'relative' }}>
            <Image src={large.dataUrl} style={s.galleryLarge} />
            {large.label && <Text style={s.galleryLabel}>{large.label}</Text>}
          </View>
          <View style={s.gallerySmallCol}>
            <View style={{ position: 'relative' }}>
              <Image src={sm1.dataUrl} style={s.gallerySmall} />
              {sm1.label && <Text style={s.galleryLabel}>{sm1.label}</Text>}
            </View>
            <View style={{ position: 'relative' }}>
              <Image src={sm2.dataUrl} style={s.gallerySmall} />
              {sm2.label && <Text style={s.galleryLabel}>{sm2.label}</Text>}
            </View>
          </View>
        </View>
      );
      i += 3;
    } else {
      const remaining = galleryImages.slice(i);
      galleryRows.push(
        <View key={`row-${i}`} style={s.galleryFullRow}>
          {remaining.map((img) => (
            <View key={img.id} style={{ width: '48%', position: 'relative' }}>
              <Image src={img.dataUrl} style={s.galleryHalf} />
              {img.label && <Text style={s.galleryLabel}>{img.label}</Text>}
            </View>
          ))}
        </View>
      );
      i = galleryImages.length;
    }
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.heroContainer}>
          {heroImage && <Image src={heroImage.dataUrl} style={s.heroImage} />}
          <View style={s.heroOverlay}>
            <Text style={[s.heroOperationBadge, { backgroundColor: palette.accent }]}>
              {data.operationType === 'venta' ? 'EN VENTA' : 'EN RENTA'} — {(PROPERTY_TYPE_LABELS[data.propertyType] || data.propertyType).toUpperCase()}
            </Text>
            <Text style={s.heroTitle}>{data.title}</Text>
            <Text style={[s.heroPrice, { color: palette.accentLight }]}>{formatPrice(data.price, data.currency)}</Text>
          </View>
        </View>

        {statBoxes.length > 0 && (
          <View style={[s.statsRow, { backgroundColor: palette.primary }]}>
            {statBoxes.map((sb) => (
              <View key={sb.label} style={s.statBox}>
                <Text style={[s.statValue, { color: palette.accent }]}>{sb.value}</Text>
                <Text style={s.statLabel}>{sb.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.content}>
          {data.description && (
            <View>
              <Text style={[s.sectionLabel, { color: palette.primary }]}>Descripción</Text>
              <Text style={s.descText}>{data.description}</Text>
            </View>
          )}

          {(data.builtArea > 0 || data.halfBathrooms > 0 || data.age > 0) && (
            <View>
              <Text style={[s.sectionLabel, { color: palette.primary }]}>Detalles Adicionales</Text>
              <View style={s.amenitiesGrid}>
                {data.builtArea > 0 && (
                  <View style={s.amenityItem}>
                    <Text style={[s.amenityCheck, { color: palette.accent }]}>●</Text>
                    <Text style={s.amenityText}>Construidos: {formatArea(data.builtArea)}</Text>
                  </View>
                )}
                {data.halfBathrooms > 0 && (
                  <View style={s.amenityItem}>
                    <Text style={[s.amenityCheck, { color: palette.accent }]}>●</Text>
                    <Text style={s.amenityText}>Medios baños: {data.halfBathrooms}</Text>
                  </View>
                )}
                {data.age > 0 && (
                  <View style={s.amenityItem}>
                    <Text style={[s.amenityCheck, { color: palette.accent }]}>●</Text>
                    <Text style={s.amenityText}>Antigüedad: {data.age} años</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {(locationParts.length > 0 || data.mapsUrl) && (
            <View>
              {locationParts.length > 0 && (
                <View style={s.locationRow}>
                  <Text style={[s.locationPin, { color: palette.accent }]}>▸</Text>
                  <Text style={s.locationText}>{locationParts.join(', ')}</Text>
                </View>
              )}
              {data.mapsUrl && (
                <Link src={data.mapsUrl} style={[s.mapsLink, { color: palette.accent }]}>Ver en Google Maps</Link>
              )}
            </View>
          )}

          {data.amenities.length > 0 && (
            <View>
              <Text style={[s.sectionLabel, { color: palette.primary }]}>Amenidades</Text>
              <View style={s.amenitiesGrid}>
                {data.amenities.map((a) => (
                  <View key={a} style={s.amenityItem}>
                    <Text style={[s.amenityCheck, { color: palette.accent }]}>✓</Text>
                    <Text style={s.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={[s.footer, { backgroundColor: palette.primary }]}>
          <View style={s.footerLeft}>
            {data.agent.photo && (
              <Image src={data.agent.photo} style={s.agentPhoto} />
            )}
            <View>
              {hasAgent && <Text style={s.footerName}>{data.agent.name}</Text>}
              {data.agent.phone && <Text style={s.footerDetail}>{data.agent.phone}</Text>}
              {data.agent.email && <Text style={s.footerDetail}>{data.agent.email}</Text>}
            </View>
          </View>
          {data.agent.companyLogo && (
            <Image src={data.agent.companyLogo} style={s.footerLogo} />
          )}
        </View>
      </Page>

      {galleryImages.length > 0 && (
        <Page size="LETTER" style={s.galleryPage}>
          <Text style={s.galleryHeader}>Galería de Fotos</Text>
          {galleryRows}

          <View style={[s.footer, { backgroundColor: palette.primary }]}>
            <View style={s.footerLeft}>
              {data.agent.photo && (
                <Image src={data.agent.photo} style={s.agentPhoto} />
              )}
              <View>
                {hasAgent && <Text style={s.footerName}>{data.agent.name}</Text>}
                {data.agent.phone && <Text style={s.footerDetail}>{data.agent.phone}</Text>}
              </View>
            </View>
            {data.agent.companyLogo && (
              <Image src={data.agent.companyLogo} style={s.footerLogo} />
            )}
          </View>
        </Page>
      )}
    </Document>
  );
}
