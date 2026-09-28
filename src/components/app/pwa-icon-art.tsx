import { Bolt } from "lucide-react";

export function PwaIconArt({ size }: { size: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#234f75",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          color: "#ffffff",
          display: "flex",
          height: "72%",
          justifyContent: "center",
          width: "72%",
        }}
      >
        <Bolt color="#ffffff" size={Math.round(size * 0.58)} strokeWidth={1.8} />
      </div>
    </div>
  );
}
