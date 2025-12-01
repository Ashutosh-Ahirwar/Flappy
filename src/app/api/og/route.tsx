import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const score = searchParams.get('score') || '0';

    // 1. Setup Background
    const APP_URL = "https://flappy-dun.vercel.app"; // Ensure this matches your deployment
    const bgUrl = `${APP_URL}/hero.png`;
    
    let bgBuffer: ArrayBuffer | null = null;
    
    try {
      const res = await fetch(bgUrl);
      if (res.ok) {
        bgBuffer = await res.arrayBuffer();
      } else {
        console.error("Image fetch failed", res.status);
      }
    } catch (e) {
      console.error("BG Image Failed, using gradient fallback", e);
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            // Fallback Gradient if image fails
            background: 'linear-gradient(to bottom, #0f0518, #2a0a4a)', 
            position: 'relative',
          }}
        >
          {/* BACKGROUND IMAGE LAYER */}
          {/* We check if bgBuffer exists before rendering */}
          {bgBuffer && (
             <img
             // FIX: Cast ArrayBuffer to 'any' to bypass React's string-only restriction
             src={bgBuffer as any}
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               objectFit: 'cover',
               opacity: 0.6 
             }}
           />
          )}

          {/* TEXT CONTENT LAYER */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', fontSize: 70, color: 'white', marginBottom: 10, fontWeight: 900, letterSpacing: '-2px', textTransform: 'uppercase' }}>
              WARP FLAP
            </div>
            <div style={{ display: 'flex', fontSize: 30, color: '#d1d5db', marginBottom: 5, letterSpacing: '4px', textTransform: 'uppercase' }}>
              GAME SCORE
            </div>
            <div style={{ display: 'flex', fontSize: 160, fontWeight: 900, color: 'white', textShadow: '0 0 50px #855DCD, 0 0 100px #855DCD', marginTop: -20, marginBottom: 20 }}>
              {score} ETH
            </div>
            <div style={{ display: 'flex', padding: '15px 50px', background: 'linear-gradient(90deg, #855DCD 0%, #6d46b0 100%)', borderRadius: 50, fontSize: 32, color: 'white', fontWeight: 700 }}>
              Play on Farcaster
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}