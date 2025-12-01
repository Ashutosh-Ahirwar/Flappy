import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";

const APP_URL = "https://flappy-dun.vercel.app"; // Your production URL

// 1. Define the Mini App Embed JSON
const miniappJson = JSON.stringify({
  version: "1",
  imageUrl: `${APP_URL}/hero.png`, // Must be 3:2 aspect ratio
  button: {
    title: "Play Flappy Warplet",
    action: {
      type: "launch_miniapp",
      name: "Flappy Warplet",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0518",
    },
  },
});

// 2. Define Legacy Frame JSON (for backward compatibility)
const frameJson = JSON.stringify({
  version: "1",
  imageUrl: `${APP_URL}/hero.png`,
  button: {
    title: "Play Flappy Warplet",
    action: {
      type: "launch_frame", // Legacy type
      name: "Flappy Warplet",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0518",
    },
  },
});

// 3. Export Metadata
export const metadata: Metadata = {
  title: "Flappy Warplet",
  description: "Dodge the candles and pump your portfolio!",
  openGraph: {
    title: "Flappy Warplet",
    description: "Dodge the candles and pump your portfolio!",
    images: [`${APP_URL}/hero.png`],
  },
  other: {
    // Farcaster Embed Tags
    "fc:miniapp": miniappJson,
    "fc:frame": frameJson, 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}