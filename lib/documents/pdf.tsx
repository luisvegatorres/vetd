import "server-only"

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { DocumentBody } from "./blocks"

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0a0a0a",
    lineHeight: 1.5,
  },
  header: {
    borderBottom: "1px solid #0a0a0a",
    paddingBottom: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  meta: {
    fontSize: 9,
    color: "#525252",
    textAlign: "right",
  },
  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 16,
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 10,
  },
  kvRow: {
    flexDirection: "row",
    borderTop: "1px solid #e5e5e5",
    paddingTop: 6,
    paddingBottom: 6,
  },
  kvLabel: {
    width: "40%",
    color: "#525252",
    textTransform: "uppercase",
    fontSize: 8,
    letterSpacing: 1,
  },
  kvValue: {
    width: "60%",
  },
  divider: {
    borderTop: "1px solid #0a0a0a",
    marginTop: 12,
    marginBottom: 12,
  },
  signatureBlock: {
    marginTop: 24,
    marginBottom: 16,
  },
  signatureLine: {
    borderBottom: "1px solid #0a0a0a",
    height: 32,
  },
  signatureLabel: {
    marginTop: 4,
    fontSize: 8,
    color: "#525252",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#737373",
    textAlign: "center",
    borderTop: "1px solid #e5e5e5",
    paddingTop: 8,
  },
})

const SPACER_SIZES = { sm: 6, md: 12, lg: 24 } as const

export function DocumentPDF({
  title,
  brand,
  subtitle,
  body,
}: {
  title: string
  brand: string
  subtitle?: string
  body: DocumentBody
}) {
  return (
    <Document title={title} author={brand}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{brand}</Text>
          {subtitle ? <Text style={styles.meta}>{subtitle}</Text> : null}
        </View>

        {body.map((block, i) => {
          switch (block.type) {
            case "heading": {
              const style =
                block.level === 1
                  ? styles.h1
                  : block.level === 2
                    ? styles.h2
                    : styles.h3
              return (
                <Text key={i} style={style}>
                  {block.text}
                </Text>
              )
            }
            case "paragraph":
              return (
                <Text key={i} style={styles.paragraph}>
                  {block.text}
                </Text>
              )
            case "bullets":
              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  {block.items.map((item, j) => (
                    <View key={j} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>▪</Text>
                      <Text>{item}</Text>
                    </View>
                  ))}
                </View>
              )
            case "kv":
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  {block.items.map((kv, j) => (
                    <View key={j} style={styles.kvRow}>
                      <Text style={styles.kvLabel}>{kv.label}</Text>
                      <Text style={styles.kvValue}>{kv.value}</Text>
                    </View>
                  ))}
                </View>
              )
            case "divider":
              return <View key={i} style={styles.divider} />
            case "spacer":
              return (
                <View
                  key={i}
                  style={{ height: SPACER_SIZES[block.size ?? "md"] }}
                />
              )
            case "signature":
              return (
                <View key={i} style={styles.signatureBlock}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureLabel}>{block.label}</Text>
                </View>
              )
          }
        })}

        <Text style={styles.footer} fixed>
          {brand} — generated {new Date().toLocaleDateString("en-US")}
        </Text>
      </Page>
    </Document>
  )
}
