import { Metadata, ResolvingMetadata } from 'next';
import App from '../components/App';

const APP_URL = "https://flappy-dun.vercel.app"; 

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// SERVER-SIDE: Generate Dynamic Meta Tags
export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await searchParams;
  
  // FIX: Check if 'score' is actually present in the URL
  const hasScore = params.score !== undefined;
  const score = params.score || '0';

  // 1. Dynamic Image Logic
  // If score exists -> Call API with score (Dark overlay + Text)
  // If no score -> Call API without score (Full brightness Hero Image, No Text)
  const dynamicImageUrl = hasScore 
    ? `${APP_URL}/api/og?score=${score}`
    : `${APP_URL}/api/og`; 

  // 2. Dynamic Titles
  const title = hasScore 
    ? `I scored ${score} ETH on Flappy Warplet!` 
    : "Flappy Warplet";

  const buttonTitle = hasScore 
    ? "Beat My Score" 
    : "Play Flappy Warplet";

  // 3. Define Embed JSON
  const miniappJson = JSON.stringify({
    version: "1",
    imageUrl: dynamicImageUrl, 
    button: {
      title: buttonTitle,
      action: {
        type: "launch_miniapp",
        name: "Flappy Warplet",
        url: APP_URL,
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: "#0f0518",
      },
    },
  });

  return {
    title: title,
    openGraph: {
      title: title,
      description: "Dodge the candles and pump your portfolio!",
      images: [dynamicImageUrl],
    },
    other: {
      "fc:miniapp": miniappJson,
      "fc:frame": JSON.stringify({
        version: "1",
        imageUrl: dynamicImageUrl,
        button: {
          title: "Play Now",
          action: {
            type: "launch_frame",
            name: "Flappy Warplet",
            url: APP_URL,
            splashImageUrl: `${APP_URL}/splash.png`,
            splashBackgroundColor: "#0f0518",
          },
        },
      }), 
    },
  };
}

// CLIENT-SIDE: Render the App
export default function Page() {
  return <App />;
}