import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams, protocol, host } = new URL(request.url);
    const score = searchParams.get('score') || '0';

    // 1. Fetch your Hero Image to use as the background
    // We assume 'hero.png' exists in your public folder. 
    // If you prefer the splash screen, change 'hero.png' to 'splash.png'
    const bgUrl = `${protocol}//${host}/hero.png`; 
    const bgBuffer = await fetch(bgUrl).then((res) => res.arrayBuffer());

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
            backgroundColor: '#0f0518', // Fallback color
            position: 'relative', // Needed for stacking
          }}
        >
          {/* BACKGROUND IMAGE LAYER */}
          {/* @ts-ignore */}
          <img
            // FIX: Cast to 'any' because next/og accepts buffers, even if React types don't
            src={bgBuffer as any} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.4 
            }}
          />
          {/* TEXT CONTENT LAYER (Sitting on top) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            textShadow: '0 4px 10px rgba(0,0,0,0.8)', // Strong shadow for readability
          }}>
            
            <div style={{ 
              display: 'flex', 
              fontSize: 60, 
              color: '#855DCD', 
              marginBottom: 10, 
              fontWeight: 900,
              letterSpacing: '-2px'
            }}>
              WARP FLAP
            </div>
            
            {/* CHANGED: More clear terminology */}
            <div style={{ 
              display: 'flex', 
              fontSize: 30, 
              color: '#e0e0e0', 
              marginBottom: 0, 
              letterSpacing: '4px',
              textTransform: 'uppercase'
            }}>
              GAME SCORE
            </div>

            <div style={{ 
              display: 'flex', 
              fontSize: 150, 
              fontWeight: 900, 
              color: 'white',
              // Neon Glow Effect
              textShadow: '0 0 40px #855DCD, 0 0 80px #855DCD',
              marginTop: -10
            }}>
              {score} ETH
            </div>

            {/* "Play Now" Badge */}
            <div style={{ 
              display: 'flex', 
              marginTop: 40, 
              padding: '15px 40px', 
              background: 'rgba(133, 93, 205, 0.4)', 
              border: '2px solid #855DCD',
              borderRadius: 50, 
              fontSize: 32,
              color: 'white',
              fontWeight: 700
            }}>
              Play on Farcaster
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // Caching is crucial for performance [cite: 395]
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
        },
      },
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}