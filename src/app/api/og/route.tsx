import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Get the score from the URL (default to '?' if missing)
    const score = searchParams.get('score') || '?';

    // 2. Return the dynamic image
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
            backgroundImage: 'linear-gradient(to bottom, #0f0518, #2a0a4a)',
            color: 'white',
            fontFamily: 'monospace',
          }}
        >
          {/* Background Elements (Optional decorative circles) */}
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: '#855DCD', opacity: 0.2 }} />
          <div style={{ position: 'absolute', bottom: -50, right: -50, width: 400, height: 400, borderRadius: '50%', background: '#10B981', opacity: 0.1 }} />

          {/* Main Content */}
          <div style={{ display: 'flex', fontSize: 40, color: '#855DCD', marginBottom: 20 }}>
            WARP FLAP
          </div>
          
          <div style={{ display: 'flex', fontSize: 20, color: '#gray', marginBottom: 10 }}>
            PORTFOLIO VALUE
          </div>

          <div style={{ 
            display: 'flex', 
            fontSize: 120, 
            fontWeight: 900, 
            color: 'white',
            textShadow: '0 0 20px #855DCD'
          }}>
            {score} ETH
          </div>

          <div style={{ display: 'flex', marginTop: 40, padding: '10px 30px', background: '#ffffff20', borderRadius: 20, fontSize: 24 }}>
            Play on Farcaster
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800,
        // Caching is important for performance [cite: 395]
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
        },
      },
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}