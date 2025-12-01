'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useReadContract, useAccount, useConnect } from 'wagmi';
import { parseAbi } from 'viem';
import WarpletGame from '../components/WarpletGame';

// Warplets Contract (Base)
const CONTRACT_ADDRESS = '0x699727f9e01a822efdcf7333073f0461e5914b4e';

// ABI to check Ownership & Get Image
const ABI = parseAbi([
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);

// Helper to fix IPFS links
const toGateway = (url: string) => {
  if (!url) return '';
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
};

export default function Home() {
  const [userData, setUserData] = useState<{ fid: number; username: string; pfpUrl: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Wallet Hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // 1. Initialize Farcaster SDK & Get Context
  useEffect(() => {
    const init = async () => {
      const context = await sdk.context;
      if (context?.user?.fid) {
        setUserData({
          fid: context.user.fid,
          username: context.user.username || 'Warplet',
          pfpUrl: context.user.pfpUrl || 'https://warpcast.com/avatar.png',
        });
      }
      sdk.actions.ready();
    };
    init();
  }, []);

  // 2. READ CONTRACT: Who owns the token with ID = FID?
  const { data: ownerAddress, isLoading: checkingOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'ownerOf',
    args: userData ? [BigInt(userData.fid)] : undefined,
    query: { enabled: !!userData },
  });

  // 3. READ CONTRACT: Get the image for that token
  const { data: tokenUri } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'tokenURI',
    args: userData ? [BigInt(userData.fid)] : undefined,
    query: { enabled: !!userData },
  });

  // 4. Fetch Image Metadata
  useEffect(() => {
    if (tokenUri) {
      const fetchImage = async () => {
        try {
          const res = await fetch(toGateway(tokenUri));
          const json = await res.json();
          if (json.image) setImageUrl(toGateway(json.image));
        } catch (e) {
          console.error("Metadata error", e);
        }
      };
      fetchImage();
    }
  }, [tokenUri]);

  // --- HANDLERS ---
  const handleConnect = () => {
    // Use the custom 'farcaster' connector we built earlier
    const farcasterConnector = connectors.find((c) => c.id === 'farcaster');
    if (farcasterConnector) {
      connect({ connector: farcasterConnector });
    } else {
      // Fallback mostly for local testing
      const firstAvailable = connectors[0];
      if (firstAvailable) connect({ connector: firstAvailable });
    }
  };

  // --- RENDER STATES ---

  // State 1: Loading Farcaster User
  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0518] text-white">
        <p className="animate-pulse text-[#855DCD] font-mono">Initializing...</p>
      </div>
    );
  }

  // State 2: Wallet Not Connected
  if (!isConnected) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center font-sans">
        <img src={userData.pfpUrl} className="w-20 h-20 rounded-full border-4 border-[#855DCD] mb-4 shadow-[0_0_20px_#855DCD]" />
        <h1 className="text-2xl font-black mb-2">Welcome, @{userData.username}</h1>
        <p className="text-gray-400 mb-8 max-w-xs text-sm">
          Connect your wallet to verify ownership of Warplet #{userData.fid}.
        </p>
        <button
          onClick={handleConnect}
          className="bg-[#855DCD] hover:bg-[#6d46b0] text-white font-bold py-4 px-8 rounded-xl shadow-lg transition active:scale-95"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // State 3: Checking Blockchain (Loading)
  if (checkingOwner) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0518] text-white">
        <p className="text-[#855DCD] animate-bounce font-mono">Verifying Ownership...</p>
      </div>
    );
  }

  // State 4: Access Denied (Wallet doesn't match Owner)
  // We compare the connected 'address' vs the contract 'ownerAddress'
  if (ownerAddress && address && ownerAddress.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center font-sans">
        <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/50 max-w-sm">
          <h2 className="text-3xl font-black text-red-500 mb-2">ACCESS DENIED</h2>
          <p className="text-gray-300 mb-4 text-sm">
            You are logged in as <b>@{userData.username}</b>, but your connected wallet does not own Warplet <b>#{userData.fid}</b>.
          </p>
          
          <div className="bg-black/40 p-3 rounded-lg mb-4 text-[10px] font-mono text-left break-all border border-white/5">
            <div className="text-gray-500 mb-1">Warplet Owner:</div>
            <div className="text-green-400 mb-3">{ownerAddress}</div>
            <div className="text-gray-500 mb-1">Your Wallet:</div>
            <div className="text-red-400">{address}</div>
          </div>

          <a 
            href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${userData.fid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            Buy on OpenSea ↗
          </a>
        </div>
      </div>
    );
  }

  // State 5: Token Doesn't Exist (Not Minted)
  if (!ownerAddress) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center font-sans">
        <h2 className="text-2xl font-bold mb-2 text-gray-300">Warplet #{userData.fid} Not Found</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          It seems this Warplet has not been minted yet.
        </p>
        <a 
            href={`https://opensea.io/collection/warplets`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#855DCD] text-white font-bold py-3 px-6 rounded-xl"
          >
            Check Collection
        </a>
      </div>
    );
  }

  // State 6: Success! (User owns the token)
  // We pass the fetched imageUrl so the game uses their specific NFT
  return <WarpletGame imageUrl={imageUrl} user={userData} />;
}