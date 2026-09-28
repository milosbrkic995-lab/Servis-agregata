import { ImageResponse } from "next/og";

import { PwaIconArt } from "@/components/app/pwa-icon-art";

export function GET() {
  return new ImageResponse(<PwaIconArt size={192} />, {
    width: 192,
    height: 192,
  });
}
