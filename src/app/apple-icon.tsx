import { ImageResponse } from "next/og";

import { PwaIconArt } from "@/components/app/pwa-icon-art";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PwaIconArt size={size.width} />, size);
}
