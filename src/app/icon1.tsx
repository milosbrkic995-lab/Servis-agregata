import { ImageResponse } from "next/og";

import { PwaIconArt } from "@/components/app/pwa-icon-art";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function IconSmall() {
  return new ImageResponse(<PwaIconArt size={size.width} />, size);
}
