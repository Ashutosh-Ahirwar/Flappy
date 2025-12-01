'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useReadContract, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseAbi } from 'viem';
import WarpletGame from '../components/WarpletGame';

// Warplets Contract (Base)
const CONTRACT_ADDRESS = '0x699727f9e01a822efdcf7333073f0461e5914b4e';

// Expanded ABI to check Ownership
const ABI = parseAbi([
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);

const toGateway = (url: string) => {
  if (!url) return '';
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
};

export default function Home() {
  const [userData, setUserData] = useState<{ fid: number; username: string; pfpUrl: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Wallet State
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  // 1. Initialize Farcaster SDK
  useEffect(() => {
    const init = async () => {
      const context = await sdk.context;
      if (context?.user?.fid) {
        setUserData({
          fid: context.user.fid,
          username: context.user.username || 'Warplet',
          pfpUrl: context.user.pfpUrl || '',
        });
      }
      sdk.actions.ready();
    };
    init();
  }, []);

  // 2. Check Ownership & Get Image
  // We check who owns the Token ID corresponding to the user's FID
  const { data: ownerAddress, isLoading: checkingOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'ownerOf',
    args: userData ? [BigInt(userData.fid)] : undefined,
    query: { enabled: !!userData },
  });

  const { data: tokenUri } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'tokenURI',
    args: userData ? [BigInt(userData.fid)] : undefined,
    query: { enabled: !!userData },
  });

  // 3. Resolve Metadata
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

  // --- RENDERING STATES ---

  // A. Loading Farcaster Context
  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0518] text-white">
        <div className="text-center animate-pulse">
          <h2 className="text-xl font-bold text-[#855DCD]">Connecting to Farcaster...</h2>
        </div>
      </div>
    );
  }

  // B. Wallet Not Connected
  if (!isConnected) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center">
        <img src={userData.pfpUrl} className="w-20 h-20 rounded-full border-4 border-[#855DCD] mb-4" />
        <h1 className="text-2xl font-black mb-2">Welcome, @{userData.username}</h1>
        <p className="text-gray-400 mb-8 max-w-xs">
          Connect your wallet to verify ownership of Warplet #{userData.fid}.
        </p>
        <button
          onClick={() => connect({ connector: injected() })}
          className="bg-[#855DCD] hover:bg-[#6d46b0] text-white font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(133,93,205,0.4)] transition transform active:scale-95"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // C. Checking Ownership (Loading)
  if (checkingOwner) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0518] text-white">
        <p className="text-[#855DCD] animate-bounce font-mono">Verifying Ownership...</p>
      </div>
    );
  }

  // D. Access Denied (Wallet doesn't own the Warplet)
  // We compare the connected wallet (address) vs the contract owner (ownerAddress)
  if (ownerAddress && address && ownerAddress.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center">
        <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/50 max-w-sm">
          <h2 className="text-3xl font-black text-red-500 mb-2">ACCESS DENIED</h2>
          <p className="text-gray-300 mb-4">
            Your connected wallet does not hold Warplet <b>#{userData.fid}</b>.
          </p>
          
          <div className="bg-black/40 p-3 rounded-lg mb-4 text-xs font-mono text-left break-all">
            <div className="text-gray-500">Required Owner:</div>
            <div className="text-green-400 mb-2">{ownerAddress}</div>
            <div className="text-gray-500">You Connected:</div>
            <div className="text-red-400">{address}</div>
          </div>

          <a 
            href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${userData.fid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition"
          >
            View on OpenSea
          </a>
        </div>
      </div>
    );
  }

  // E. Token Doesn't Exist (Minted out or Invalid)
  if (!ownerAddress) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0518] text-white p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Warplet #{userData.fid} not found</h2>
        <p className="text-gray-400">It seems this Warplet has not been minted yet.</p>
      </div>
    );
  }

  // F. Success - Render Game
  return <WarpletGame imageUrl={imageUrl} user={userData} />;
}