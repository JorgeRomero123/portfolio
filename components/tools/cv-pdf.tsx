'use client';

import {
  Document,
  Page,
  View,
  Text,
  Link,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1a1a1a',
  },
  h1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111827',
  },
  h2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    marginTop: 8,
    color: '#1f2937',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 2,
  },
  h3: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    marginTop: 5,
    color: '#374151',
  },
  paragraph: {
    marginBottom: 3,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 1.5,
    paddingLeft: 6,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  separator: {
    marginVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
});

interface CVPdfDocumentProps {
  markdown: string;
}

function parseInline(text: string) {
  // Match **bold** and [label](url) in a single pass
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push plain text before this match
    if (match.index > lastIndex) {
      parts.push(<Text key={key++}>{text.slice(lastIndex, match.index)}</Text>);
    }

    if (match[1] !== undefined) {
      // Bold
      parts.push(<Text key={key++} style={styles.bold}>{match[1]}</Text>);
    } else if (match[2] !== undefined && match[3] !== undefined) {
      // Link — show the label as a clickable hyperlink
      parts.push(
        <Link key={key++} src={match[3]} style={styles.link}>{match[2]}</Link>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    parts.push(<Text key={key++}>{text.slice(lastIndex)}</Text>);
  }

  if (parts.length === 0) return <Text>{text}</Text>;
  return <Text>{parts}</Text>;
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
          <View style={styles.bulletText}>{parseInline(text)}</View>
        </View>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <View key={i} style={styles.paragraph}>{parseInline(line)}</View>
    );
    i++;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {elements}
      </Page>
    </Document>
  );
}
