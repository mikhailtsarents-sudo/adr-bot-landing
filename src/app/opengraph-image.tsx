import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #fffdf7 0%, #f5efe3 48%, #eee4d4 100%)",
          fontFamily: "Arial",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(70,59,40,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(70,59,40,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "999px",
            background: "rgba(246, 181, 72, 0.28)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 40,
            bottom: 40,
            width: 180,
            background: "rgba(255, 247, 232, 0.88)",
            transform: "skewX(-12deg)",
            borderLeft: "8px solid rgba(217, 138, 16, 0.18)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 76px",
            width: "72%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "999px",
                background: "linear-gradient(135deg, #e8a030, #f6b548)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              A
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Telegram-based ADR preparation
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                ADR Bot
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 68,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              color: "#0f172a",
              maxWidth: 760,
            }}
          >
            Prepare for the ADR exam in German with more clarity
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.45,
              color: "#475569",
              maxWidth: 760,
            }}
          >
            Understand terminology, practice exam wording, and prepare step by
            step directly inside Telegram.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
