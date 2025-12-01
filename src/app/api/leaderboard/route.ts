import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
// We use the SERVICE_ROLE key here to bypass RLS policies for writing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch Top 50 Leaderboard (Public)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('leaderboard')
    .select('fid, username, score, pfp_url')
    .order('score', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}

// POST: Securely Submit a new Score
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, username, score, pfpUrl } = body;

    if (!fid || score === undefined) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // 1. Check existing score
    const { data: existingUser } = await supabaseAdmin
      .from('leaderboard')
      .select('score')
      .eq('fid', fid)
      .single();

    // 2. Only update if the new score is higher (High Score Logic)
    if (!existingUser || score > existingUser.score) {
      const { error } = await supabaseAdmin
        .from('leaderboard')
        .upsert({ 
          fid, 
          username, 
          score, 
          pfp_url: pfpUrl 
        });

      if (error) throw error;
      return NextResponse.json({ success: true, newHighScore: true });
    }

    return NextResponse.json({ success: true, newHighScore: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}