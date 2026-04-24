// Isomorphic: usable from the server render pipeline and from the client-side
// template preview. Kept dependency-free beyond @react-pdf/renderer.
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { DocumentBody } from "./blocks"
import { COLORS, PAGE, TYPE } from "./style-tokens"

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE.padTopPt,
    paddingBottom: PAGE.padBottomPt,
    paddingHorizontal: PAGE.padXPt,
    fontFamily: "Helvetica",
    fontSize: TYPE.body.sizePt,
    color: COLORS.text,
    lineHeight: TYPE.body.lineHeight,
  },
  header: {
    borderBottom: `1px solid ${COLORS.borderStrong}`,
    paddingBottom: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    fontSize: TYPE.brand.sizePt,
    fontFamily: "Helvetica-Bold",
    letterSpacing: TYPE.brand.letterSpacingPt,
    textTransform: "uppercase",
  },
  meta: {
    fontSize: TYPE.meta.sizePt,
    color: COLORS.muted,
    textAlign: "right",
  },
  h1: {
    fontSize: TYPE.h1.sizePt,
    fontFamily: "Helvetica-Bold",
    letterSpacing: TYPE.h1.letterSpacingPt,
    marginTop: TYPE.h1.marginTopPt,
    marginBottom: TYPE.h1.marginBottomPt,
  },
  h2: {
    fontSize: TYPE.h2.sizePt,
    fontFamily: "Helvetica-Bold",
    letterSpacing: TYPE.h2.letterSpacingPt,
    textTransform: "uppercase",
    marginTop: TYPE.h2.marginTopPt,
    marginBottom: TYPE.h2.marginBottomPt,
  },
  h3: {
    fontSize: TYPE.h3.sizePt,
    fontFamily: "Helvetica-Bold",
    marginTop: TYPE.h3.marginTopPt,
    marginBottom: TYPE.h3.marginBottomPt,
  },
  paragraph: {
    marginBottom: TYPE.paragraph.marginBottomPt,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: TYPE.bulletRowMarginBottomPt,
  },
  bulletDot: {
    width: TYPE.bulletDotWidthPt,
  },
  kvRow: {
    flexDirection: "row",
    borderTop: `1px solid ${COLORS.borderLight}`,
    paddingTop: TYPE.kv.paddingYPt,
    paddingBottom: TYPE.kv.paddingYPt,
  },
  kvLabel: {
    width: TYPE.kv.labelWidth,
    color: COLORS.muted,
    textTransform: "uppercase",
    fontSize: TYPE.kv.labelSizePt,
    letterSpacing: TYPE.kv.letterSpacingPt,
  },
  kvValue: {
    width: TYPE.kv.valueWidth,
  },
  divider: {
    borderTop: `1px solid ${COLORS.borderStrong}`,
    marginTop: TYPE.divider.marginYPt,
    marginBottom: TYPE.divider.marginYPt,
  },
  signatureBlock: {
    marginTop: TYPE.signature.marginTopPt,
    marginBottom: TYPE.signature.marginBottomPt,
  },
  signatureLine: {
    borderBottom: `1px solid ${COLORS.borderStrong}`,
    height: TYPE.signature.lineHeightPt,
  },
  signatureLabel: {
    marginTop: TYPE.signature.labelMarginTopPt,
    fontSize: TYPE.signature.labelSizePt,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: TYPE.signature.letterSpacingPt,
  },
  footer: {
    position: "absolute",
    bottom: TYPE.footer.bottomPt,
    left: PAGE.padXPt,
    right: PAGE.padXPt,
    fontSize: TYPE.footer.sizePt,
    color: COLORS.footer,
    textAlign: "center",
    borderTop: `1px solid ${COLORS.borderLight}`,
    paddingTop: TYPE.footer.paddingTopPt,
  },
})

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
              // Keep headings glued to the next block. Prevents a heading
              // from orphaning at the bottom of a page with its content on
              // the next. minPresenceAhead reserves runway below the heading.
              return (
                <View key={i} wrap={false} minPresenceAhead={60}>
                  <Text style={style}>{block.text}</Text>
                </View>
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
                <View
                  key={i}
                  style={{ marginBottom: TYPE.bulletsBlockMarginBottomPt }}
                >
                  {block.items.map((item, j) => (
                    <View key={j} wrap={false} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text>{item}</Text>
                    </View>
                  ))}
                </View>
              )
            case "kv":
              return (
                <View
                  key={i}
                  style={{ marginBottom: TYPE.kv.blockMarginBottomPt }}
                >
                  {block.items.map((kv, j) => (
                    <View key={j} wrap={false} style={styles.kvRow}>
                      <Text style={styles.kvLabel}>{kv.label}</Text>
                      <Text style={styles.kvValue}>{kv.value}</Text>
                    </View>
                  ))}
                </View>
              )
            case "divider":
              return <View key={i} wrap={false} style={styles.divider} />
            case "spacer":
              return (
                <View
                  key={i}
                  wrap={false}
                  style={{ height: TYPE.spacer[block.size ?? "md"] }}
                />
              )
            case "signature":
              return (
                <View key={i} wrap={false} style={styles.signatureBlock}>
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
