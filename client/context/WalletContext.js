"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  connectWallet as connectFreighter,
  disconnectWallet as disconnectFreighter,
  getConnectedPublicKey,
  signWithFreighter,
  formatAddress,
  isFreighterInstalled,
} from "@/lib/wallet";
import { submitTransaction } from "@/lib/contract";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════════════════════════
//                              WALLET CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);

  // Check initial wallet state on mount
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const installed = await isFreighterInstalled();
        setIsFreighterAvailable(installed);

        if (installed) {
          const key = await getConnectedPublicKey();
          if (key) {
            setPublicKey(key);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWallet();
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await connectFreighter();

      if (result.success) {
        setPublicKey(result.publicKey);
        setIsConnected(true);
        toast.success("Wallet connected!");
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error.message || "Failed to connect wallet";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    disconnectFreighter();
    setPublicKey(null);
    setIsConnected(false);
    toast.success("Wallet disconnected");
  }, []);

  // Sign and submit transaction
  const signAndSubmit = useCallback(
    async (transaction) => {
      if (!isConnected || !publicKey) {
        throw new Error("Wallet not connected");
      }

      try {
        // Sign with Freighter
        const signedXdr = await signWithFreighter(transaction);

        // Submit to network
        const result = await submitTransaction(signedXdr);

        return result;
      } catch (error) {
        console.error("Transaction error:", error);
        throw error;
      }
    },
    [isConnected, publicKey]
  );

  const value = {
    isConnected,
    publicKey,
    isLoading,
    isFreighterAvailable,
    connect,
    disconnect,
    signAndSubmit,
    formatAddress: (addr) => formatAddress(addr || publicKey),
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
