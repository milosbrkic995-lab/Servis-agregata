export function PwaIconArt({ size }: { size: number }) {
  const iconSize = Math.round(size * 0.58);

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
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </div>
    </div>
  );
}
