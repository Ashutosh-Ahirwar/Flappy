'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Image, Text, Sparkles, Float } from '@react-three/drei';
import { useState, useRef, useEffect, useMemo } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'; 
import { useSendTransaction } from 'wagmi'; 
import { parseEther } from 'viem';
import * as THREE from 'three';

// --- PHYSICS & TUNING ---
const GRAVITY = 0.06;
const JUMP_FORCE = 1.6;
const SPEED = 0.075;
const PIPE_SPACING = 1;
const GAP_SIZE = 4.2;
const VIEW_DISTANCE = 16;
const PLAYER_X_OFFSET = -2;
const CANDLE_WIDTH = 1.0;
const TIP_ADDRESS = '0xa6DEe9FdE9E1203ad02228f00bF10235d9Ca3752';

// --- COLORS ---
const BG_COLOR = "#0f0518"; 
const GREEN_CANDLE = "#10B981";
const RED_CANDLE = "#EF4444";

// --- MEME PHRASES ---
const MEMES = ["WAGMI", "LFG", "Based", "HODL", "Up Only", "Mint It", "Higher", "Warplet"];

// --- 3D COMPONENTS ---

function Player({ url, position, rotation }: { url: string; position: THREE.Vector3, rotation: number }) {
  const mesh = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.lerp(position, 0.4);
      mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, rotation, 0.2);
    }
  });

  return (
    <group ref={mesh}>
      <Billboard follow={true}>
        <Image url={url} scale={[1.5, 1.5]} transparent />
      </Billboard>
      <pointLight distance={4} intensity={3} color="#855DCD" />
    </group>
  );
}

function Candle({ x, gapY, gapSize }: { x: number, gapY: number, gapSize: number }) {
  const isGreen = useMemo(() => Math.random() > 0.5, []);
  const color = isGreen ? GREEN_CANDLE : RED_CANDLE; 
  const height = 100;

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, (gapY + gapSize / 2) + (height / 2), 0]}>
        <boxGeometry args={[CANDLE_WIDTH, height, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, (gapY - gapSize / 2) - (height / 2), 0]}>
        <boxGeometry args={[CANDLE_WIDTH, height, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function MemeBackground({ score }: { score: number }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Text 
        position={[0, 2, -5]} 
        fontSize={2} 
        color="#855DCD" 
        fillOpacity={0.15} 
        anchorX="center"
      >
        {MEMES[score % MEMES.length]}
      </Text>
    </Float>
  );
}

// --- GAME LOGIC ---

function GameScene({ imageUrl, gameState, setGameState, score, setScore }: any) {
  const playerPos = useRef(new THREE.Vector3(PLAYER_X_OFFSET, 0, 0));
  const velocity = useRef(0);
  const rotation = useRef(0);
  const [candles, setCandles] = useState(() => [{ id: 1, x: 10, gapY: 0, passed: false }]);

  const jump = () => {
    if (gameState === 'REKT') return;
    if (gameState === 'START') setGameState('PLAYING');
    velocity.current = JUMP_FORCE;
    rotation.current = 0.5;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { 
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState !== 'REKT') jump(); 
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('game-tap', jump);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('game-tap', jump);
    };
  }, [gameState]);

  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;

    velocity.current -= GRAVITY;
    playerPos.current.y += velocity.current * 0.1;
    rotation.current = Math.max(-0.8, rotation.current - 0.02);

    const nextCandles = candles.map(c => {
      const newX = c.x - SPEED;
      if (!c.passed && newX < PLAYER_X_OFFSET - CANDLE_WIDTH) {
        setScore((s: number) => s + 1);
        return { ...c, x: newX, passed: true };
      }
      return { ...c, x: newX };
    });
    
    if (nextCandles[0].x < -15) {
      nextCandles.shift();
      const lastCandle = nextCandles[nextCandles.length - 1];
      const nextX = lastCandle ? lastCandle.x + PIPE_SPACING : 10;
      nextCandles.push({
        id: Math.random(),
        x: nextX,
        gapY: (Math.random() - 0.5) * 8, 
        passed: false
      });
    }
    setCandles(nextCandles);

    if (playerPos.current.y < -9 || playerPos.current.y > 9) setGameState('REKT');

    nextCandles.forEach(c => {
      if (Math.abs(c.x - playerPos.current.x) < (CANDLE_WIDTH / 2 + 0.3)) {
        if (playerPos.current.y > c.gapY + GAP_SIZE / 2 || playerPos.current.y < c.gapY - GAP_SIZE / 2) {
           setGameState('REKT');
        }
      }
    });
  });

  useEffect(() => {
    if (gameState === 'START') {
      playerPos.current.set(PLAYER_X_OFFSET, 0, 0);
      velocity.current = 0;
      rotation.current = 0;
      setCandles([{ id: 1, x: 10, gapY: 0, passed: false }]);
      setScore(0);
    }
  }, [gameState]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#fbbf24" />
      <color attach="background" args={[BG_COLOR]} />
      <Sparkles count={80} scale={25} size={3} speed={0.4} opacity={0.3} color="#855DCD" />
      <MemeBackground score={score} />
      <Player url={imageUrl} position={playerPos.current} rotation={rotation.current} />
      {candles.map((c) => <Candle key={c.id} x={c.x} gapY={c.gapY} gapSize={GAP_SIZE} />)}
    </>
  );
}

// --- MAIN UI COMPONENT ---

type LeaderboardUser = { fid: number; username: string; score: number; pfp_url: string };

export default function WarpletGame({ imageUrl, user }: { imageUrl: string; user: any }) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'REKT'>('START');
  const [score, setScore] = useState(0);
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0 });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [globalScores, setGlobalScores] = useState<LeaderboardUser[]>([]);
  
  const { sendTransaction } = useSendTransaction();

  useEffect(() => {
    const init = async () => {
      const context = await sdk.context;
      if (context?.client?.safeAreaInsets) setSafeArea(context.client.safeAreaInsets);
      sdk.actions.ready({ disableNativeGestures: true });
      fetchLeaderboard();
    };
    init();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (Array.isArray(data)) setGlobalScores(data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  const saveScore = async (finalScore: number) => {
    if (!user) return;
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          username: user.username,
          score: finalScore,
          pfpUrl: user.pfpUrl
        })
      });
      fetchLeaderboard();
    } catch (e) {
      console.error("Failed to save score", e);
    }
  };

  const handleTip = () => {
    sendTransaction({
      to: TIP_ADDRESS,
      value: parseEther('0.001'), 
    });
  };

  const handleShare = () => {
    sdk.actions.composeCast({
      text: `I just scored ${score} ETH on Warp Flap with Warplet #${user.fid}! 🚀\n\nCan you beat me?`,
      embeds: ['https://warplets.com'] 
    });
  };

  useEffect(() => {
    if (gameState === 'REKT') {
      saveScore(score);
      setShowLeaderboard(true);
    }
  }, [gameState]);

  return (
    <div className="w-full h-screen relative cursor-pointer select-none overflow-hidden bg-[#0f0518] font-sans text-white">
      <Canvas camera={{ position: [0, 0, VIEW_DISTANCE], fov: 45 }}>
        <GameScene 
          imageUrl={imageUrl} 
          gameState={gameState} 
          setGameState={(state: any) => {
            setGameState(state);
            if (state === 'REKT') setShowLeaderboard(true); 
          }} 
          score={score} 
          setScore={setScore} 
        />
      </Canvas>
      
      <div className="absolute inset-0 z-10" onClick={() => window.dispatchEvent(new Event('game-tap'))} />
      
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col"
        style={{ paddingTop: Math.max(safeArea.top, 16), paddingBottom: Math.max(safeArea.bottom, 20) }}
      >
        <div className="flex justify-between items-start px-4 w-full">
          <div className="drop-shadow-md">
             <span className="font-black text-4xl font-mono tracking-tighter" style={{ textShadow: '0 0 10px #855DCD' }}>
               {score} ETH
             </span>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowLeaderboard(!showLeaderboard); }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-bold p-2 rounded-lg transition"
            >
              🏆
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleTip(); }}
              className="bg-[#855DCD] hover:bg-[#6d46b0] text-white font-bold py-2 px-4 rounded-lg shadow-lg transition"
            >
              Tip
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {gameState === 'START' && !showLeaderboard && (
            <div className="text-center animate-pulse bg-black/40 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
              <h2 className="text-2xl font-black tracking-widest text-[#855DCD]">TAP TO FLY</h2>
              <div className="flex items-center gap-2 mt-4 justify-center bg-white/5 p-2 rounded-lg">
                <img src={user.pfpUrl} alt="pfp" className="w-6 h-6 rounded-full" />
                <span className="text-sm text-gray-300">@{user.username}</span>
              </div>
            </div>
          )}

          {showLeaderboard && (
            <div className="pointer-events-auto bg-[#111827]/95 w-full max-w-sm rounded-3xl backdrop-blur-xl border border-[#855DCD]/30 shadow-2xl flex flex-col overflow-hidden max-h-[70vh]">
              <div className="p-5 text-center border-b border-white/10 bg-gradient-to-b from-[#855DCD]/20 to-transparent">
                {gameState === 'REKT' ? (
                  <>
                    <h2 className="text-3xl font-black text-red-500 drop-shadow-lg tracking-tighter uppercase">LIQUIDATED</h2>
                    <p className="text-xs text-gray-400 mt-1">Don't give up, anon.</p>
                  </>
                ) : (
                  <h2 className="text-2xl font-black text-white tracking-widest uppercase">Leaderboard</h2>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {globalScores.length > 0 ? (
                  globalScores.map((u, i) => (
                    <div key={u.fid} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-mono w-4 text-xs">{i + 1}</span>
                        <img src={u.pfp_url || 'https://warpcast.com/avatar.png'} className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-sm">{u.username}</span>
                      </div>
                      <span className="font-mono text-[#855DCD] text-sm">{u.score}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">
                    Loading top scores...
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#855DCD] text-white shadow-lg transform scale-105 border border-white/20 mt-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono w-4 text-xs opacity-70">★</span>
                    <img src={user.pfpUrl} className="w-8 h-8 rounded-full border-2 border-white/30" />
                    <div className="flex flex-col leading-none">
                      <span className="font-bold text-sm">YOU</span>
                      <span className="text-[10px] opacity-80">@{user.username}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg">{score}</span>
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-white/10 grid grid-cols-2 gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowLeaderboard(false); setGameState('START'); }} 
                  className="bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition active:scale-95"
                >
                  {gameState === 'REKT' ? 'Restart' : 'Close'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare(); }} 
                  className="bg-[#855DCD] text-white font-bold py-3 rounded-xl hover:bg-[#6d46b0] transition active:scale-95 flex items-center justify-center gap-2"
                >
                  Share 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}