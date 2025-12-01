import { sdk } from "@farcaster/miniapp-sdk";
import { createConnector } from "wagmi";

// A custom Wagmi v3 connector for Farcaster
export function farcasterWallet() {
  return createConnector((config) => ({
    id: "farcaster",
    name: "Farcaster Wallet",
    type: "farcaster",
    
    async connect({ chainId } = {}) {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) throw new Error("Farcaster wallet not found"); // Safety Check
      
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const currentChainId = await this.getChainId();

      // Cast to any to satisfy Wagmi v3 strict types
      return {
        accounts: accounts.map((x) => x as `0x${string}`),
        chainId: currentChainId,
      } as any;
    },

    async getAccounts() {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) throw new Error("Farcaster wallet not found");

      const accounts = await provider.request({ method: "eth_accounts" });
      return accounts.map((x) => x as `0x${string}`);
    },

    async getChainId() {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) throw new Error("Farcaster wallet not found");

      const hex = await provider.request({ method: "eth_chainId" });
      return parseInt(hex as string, 16);
    },

    async getProvider() {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) throw new Error("Farcaster wallet not found");
      return provider;
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },

    async disconnect() {
      // Farcaster manages the session
    },

    onAccountsChanged(accounts) {
      config.emitter.emit("change", { accounts: accounts.map((x) => x as `0x${string}`) });
    },

    onChainChanged(chain) {
      config.emitter.emit("change", { chainId: parseInt(chain as string, 16) });
    },

    onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));
}