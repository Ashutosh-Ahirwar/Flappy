import { Metadata, ResolvingMetadata } from 'next';
import App from '../components/App';

const APP_URL = "https://flappy-dun.vercel.app"; // Your actual domain

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// SERVER-SIDE: Generate Dynamic Meta Tags for the specific score
export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await searchParams;
  const score = params.score || '0';

  // 1. Generate the Dynamic Image URL
  const dynamicImageUrl = `${APP_URL}/api/og?score=${score}`;

  // 2. Define the Embed JSON
  const miniappJson = JSON.stringify({
    version: "1",
    imageUrl: dynamicImageUrl, // Show the scorecard image
    button: {
      title: "Beat My Score",
      action: {
        type: "launch_miniapp",
        name: "Flappy Warplet",
        url: APP_URL, // Always launch app at root
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: "#0f0518",
      },
    },
  });

  return {
    title: `I scored ${score} ETH on Flappy Warplet!`,
    openGraph: {
      title: `Score: ${score} ETH`,
      description: "Can you beat my portfolio?",
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