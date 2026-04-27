import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          width="120"
          height="120"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 200L0 133.333L66.667 133.333L66.667 66.667L133.333 66.667L133.333 0L200 0L200 200L0 200Z" />
        </svg>
      </div>
    ),
    size,
  )
}
