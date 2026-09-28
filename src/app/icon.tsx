import { ImageResponse } from "next/og";

import { PwaIconArt } from "@/components/app/pwa-icon-art";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<PwaIconArt size={size.width} />, size);
}
