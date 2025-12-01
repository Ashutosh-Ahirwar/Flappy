import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams, protocol, host } = new URL(request.url);
    
    // FIX: Check if 'score' is present in the URL at all (even if it is 0)
    const hasScore = searchParams.has('score');
    const score = searchParams.get('score') || '0';

    const APP_URL = "https://flappy-dun.vercel.app";
    const bgUrl = `${APP_URL}/hero.png`;
    
    let bgBuffer: ArrayBuffer | null = null;
    try {
      const res = await fetch(bgUrl);
      if (res.ok) bgBuffer = await res.arrayBuffer();
    } catch (e) { console.error("BG Image Failed", e); }

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
            background: '#0f0518',
            position: 'relative',
          }}
        >
          {/* BACKGROUND IMAGE LAYER */}
          {bgBuffer && (
             <img
             src={bgBuffer as any}
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               objectFit: 'cover',
               // If score is showing -> Dim background (0.2)
               // If NO score (Hero Mode) -> Full brightness (1.0)
               opacity: hasScore ? 0.2 : 1.0 
             }}
           />
          )}

          {/* TEXT CONTENT LAYER - ONLY RENDER IF SCORE PARAM EXISTS */}
          {hasScore && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              textShadow: '0 4px 30px rgba(0,0,0,0.9)', 
            }}>
              
              <div style={{ 
                display: 'flex', 
                fontSize: 80, 
                color: 'white', 
                marginBottom: 0, 
                fontWeight: 900,
                letterSpacing: '-2px',
                textTransform: 'uppercase',
                textShadow: '0 0 20px #855DCD'
              }}>
                Flappy Warplet
              </div>
              
              <div style={{ 
                display: 'flex', 
                fontSize: 32, 
                color: '#a884f3', 
                marginBottom: 10, 
                letterSpacing: '8px',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>
                GAME SCORE
              </div>

              <div style={{ 
                display: 'flex', 
                fontSize: 220, 
                fontWeight: 900, 
                color: 'white',
                textShadow: '0 0 80px #855DCD, 0 0 150px #855DCD',
                marginTop: -10,
                lineHeight: 1,
              }}>
                {score} ETH
              </div>
            </div>
          )}
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