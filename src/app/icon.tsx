import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fffdf7 0%, #f5efe3 55%, #eee4d4 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 36,
            borderRadius: 120,
            border: "12px solid rgba(217, 138, 16, 0.16)",
          }}
        />
        <div
          style={{
            width: 292,
            height: 292,
            borderRadius: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e8a030 0%, #f6b548 100%)",
            color: "#ffffff",
            fontSize: 190,
            fontWeight: 800,
            letterSpacing: "-0.08em",
            boxShadow: "0 28px 80px rgba(217, 138, 16, 0.28)",
          }}
        >
          A
        </div>
      </div>
    ),
    size,
  );
}
