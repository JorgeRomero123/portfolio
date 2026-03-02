'use client';

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  h1: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    color: '#111827',
  },
  h2: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    marginTop: 14,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 3,
  },
  h3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    marginTop: 10,
    color: '#374151',
  },
  paragraph: {
    marginBottom: 6,
    fontSize: 10,
    lineHeight: 1.6,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  separator: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});

interface CVPdfDocumentProps {
  markdown: string;
}

function parseBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return <Text>{text}</Text>;
  return (
    <Text>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={styles.bold}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function CVPdfDocument({ markdown }: CVPdfDocumentProps) {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<View key={i} style={styles.separator} />);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <Text key={i} style={styles.h1}>{line.replace(/^# /, '')}</Text>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={i} style={styles.h2}>{line.replace(/^## /, '')}</Text>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={i} style={styles.h3}>{line.replace(/^### /, '')}</Text>
      );
      i++;
      continue;
    }

    // Bullet points
    if (/^\s*[-*]\s/.test(line)) {
      const text = line.replace(/^\s*[-*]\s+/, '');
      elements.push(
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <View style={styles.bulletText}>{parseBold(text)}</View>
        </View>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <View key={i} style={styles.paragraph}>{parseBold(line)}</View>
    );
    i++;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {elements}
      </Page>
    </Document>
  );
}
