import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffaf0",
          borderRadius: 64,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 18,
            borderRadius: 52,
            border: "6px solid rgba(217, 138, 16, 0.16)",
          }}
        />
        <div
          style={{
            width: 148,
            height: 148,
            borderRadius: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e8a030 0%, #f6b548 100%)",
            color: "#ffffff",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.08em",
          }}
        >
          A
        </div>
      </div>
    ),
    size,
  );
}
