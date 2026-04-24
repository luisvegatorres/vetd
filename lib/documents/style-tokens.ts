// Shared visual tokens consumed by both the server-side PDF renderer
// (lib/documents/pdf.tsx, @react-pdf/renderer) and the client-side HTML
// preview (components/documents/document-html.tsx). All values are in points
// (pt). The PDF renderer uses pt natively, and the HTML renderer applies
// them via CSS pt units so proportions stay identical between the two.

export const PAGE = {
  /** US Letter in points. */
  widthPt: 612,
  heightPt: 792,
  padTopPt: 48,
  padBottomPt: 56,
  padXPt: 56,
} as const

export const COLORS = {
  text: "#0a0a0a",
  muted: "#525252",
  footer: "#737373",
  borderStrong: "#0a0a0a",
  borderLight: "#e5e5e5",
  paper: "#ffffff",
} as const

export const TYPE = {
  body: { sizePt: 10, lineHeight: 1.5 },
  brand: { sizePt: 11, letterSpacingPt: 1 },
  meta: { sizePt: 9 },
  h1: { sizePt: 20, letterSpacingPt: 0.5, marginTopPt: 8, marginBottomPt: 16 },
  h2: {
    sizePt: 13,
    letterSpacingPt: 1,
    marginTopPt: 16,
    marginBottomPt: 8,
  },
  h3: { sizePt: 11, marginTopPt: 12, marginBottomPt: 6 },
  paragraph: { marginBottomPt: 8 },
  bulletDotWidthPt: 10,
  bulletRowMarginBottomPt: 4,
  bulletsBlockMarginBottomPt: 8,
  kv: {
    labelWidth: "40%",
    valueWidth: "60%",
    labelSizePt: 8,
    letterSpacingPt: 1,
    paddingYPt: 6,
    blockMarginBottomPt: 12,
  },
  divider: { marginYPt: 12 },
  spacer: { sm: 6, md: 12, lg: 24 },
  signature: {
    marginTopPt: 24,
    marginBottomPt: 16,
    lineHeightPt: 32,
    labelSizePt: 8,
    letterSpacingPt: 1,
    labelMarginTopPt: 4,
  },
  footer: { sizePt: 8, bottomPt: 24, paddingTopPt: 8 },
} as const
