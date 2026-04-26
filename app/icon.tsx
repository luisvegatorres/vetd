import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
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
          viewBox="0 55 141 145"
          width="18"
          height="18"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M105.12 55.6316H140.257V137.402L73.468 199.382H47.6235L0 135.84V55.6316H35.1369V129.85L63.014 167.09L105.12 127.767V55.6316Z" />
        </svg>
      </div>
    ),
    size,
  )
}
