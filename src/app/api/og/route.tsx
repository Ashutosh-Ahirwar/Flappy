import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams, protocol, host } = new URL(request.url);
    const score = searchParams.get('score') || '0';

    // Fetch hero.png
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
            backgroundColor: '#0f0518',
            position: 'relative',
          }}
        >
          {/* BACKGROUND IMAGE LAYER */}
          <img
            src={bgBuffer as any}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // Increased opacity to 0.7 to make text more readable
              opacity: 0.2 
            }}
          />

          {/* TEXT CONTENT LAYER */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            // Added text shadow to lift text off the background
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}>
            
            {/* TITLE: Changed to White for better contrast */}
            <div style={{ 
              display: 'flex', 
              fontSize: 70, 
              color: 'white', 
              marginBottom: 10, 
              fontWeight: 900,
              letterSpacing: '-2px',
              textTransform: 'uppercase'
            }}>
              Flappy Warplet
            </div>
            
            <div style={{ 
              display: 'flex', 
              fontSize: 30, 
              color: '#d1d5db', // Light gray
              marginBottom: 5, 
              letterSpacing: '4px',
              textTransform: 'uppercase'
            }}>
              GAME SCORE
            </div>

            <div style={{ 
              display: 'flex', 
              fontSize: 160, 
              fontWeight: 900, 
              color: 'white',
              // Stronger Neon Glow
              textShadow: '0 0 50px #855DCD, 0 0 100px #855DCD',
              marginTop: -20,
              marginBottom: 20
            }}>
              {score} ETH
            </div>

            {/* BUTTON */}
            <div style={{ 
              display: 'flex', 
              padding: '15px 50px', 
              background: 'linear-gradient(90deg, #855DCD 0%, #6d46b0 100%)',
              borderRadius: 50, 
              fontSize: 32,
              color: 'white',
              fontWeight: 700,
              boxShadow: '0 10px 30px rgba(133, 93, 205, 0.5)'
            }}>
              Play on Farcaster
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
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