'use client';

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { PaletteEntry } from '@/lib/paint-by-numbers';

const styles = StyleSheet.create({
  // ── Outline page ───────────────────────────────────────────────────────
  outlinePage: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  outlineImage: {
    width: '100%',
    objectFit: 'contain',
  },
  // ── Palette page ───────────────────────────────────────────────────────
  palettePage: {
    padding: 30,
    paddingBottom: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 14,
    color: '#6b7280',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 6,
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#d1d5db',
  },
  colorInfo: {
    flex: 1,
  },
  colorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  colorNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  colorHex: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#6b7280',
  },
  recipe: {
    fontSize: 7.5,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
  },
});

interface PBNPdfDocumentProps {
  outlineDataUrl: string;
  palette: PaletteEntry[];
  imageWidth: number;
  imageHeight: number;
}

export default function PBNPdfDocument({
  outlineDataUrl,
  palette,
  imageWidth,
  imageHeight,
}: PBNPdfDocumentProps) {
  const isLandscape = imageWidth > imageHeight;

  return (
    <Document>
      {/* Page 1: Outline template */}
      <Page
        size="A4"
        orientation={isLandscape ? 'landscape' : 'portrait'}
        style={styles.outlinePage}
      >
        <Image src={outlineDataUrl} style={styles.outlineImage} />
      </Page>

      {/* Page 2: Color palette & paint recipes */}
      <Page size="A4" style={styles.palettePage}>
        <Text style={styles.title}>Color Palette</Text>
        <Text style={styles.subtitle}>
          {palette.length} colors — acrylic paint mixing recipes
        </Text>

        <View style={styles.paletteGrid}>
          {palette.map((entry) => (
            <View key={entry.index} style={styles.colorCard}>
              <View style={[styles.swatch, { backgroundColor: entry.hex }]} />
              <View style={styles.colorInfo}>
                <View style={styles.colorHeader}>
                  <Text style={styles.colorNumber}>#{entry.index}</Text>
                  <Text style={styles.colorHex}>{entry.hex}</Text>
                </View>
                <Text style={styles.recipe}>
                  {entry.recipe.parts.map((p) => `${p.amount} ${p.paint}`).join(' + ')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Paint by Numbers</Text>
          <Text>{palette.length} colors</Text>
        </View>
      </Page>
    </Document>
  );
}
