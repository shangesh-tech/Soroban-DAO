/**
 * Freighter Wallet Integration
 * Using @stellar/freighter-api (v2.x)
 */

import freighter from "@stellar/freighter-api";

import { NETWORK_PASSPHRASE } from "./contract";

// ═══════════════════════════════════════════════════════════════════════════════
//                              WALLET STATE
// ═══════════════════════════════════════════════════════════════════════════════

let walletState = {
  isConnected: false,
  publicKey: null,
  networkPassphrase: null,
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              CONNECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if Freighter wallet extension is installed
 */
export async function isFreighterInstalled() {
  try {
    const result = await freighter.isConnected();
    return result.isConnected;
  } catch (error) {
    console.error("Error checking Freighter installation:", error);
    return false;
  }
}

/**
 * Check if our app is allowed to access Freighter
 */
export async function isFreighterAllowed() {
  try {
    const result = await freighter.isAllowed();
    return result.isAllowed;
  } catch (error) {
    console.error("Error checking Freighter permission:", error);
    return false;
  }
}

/**
 * Request permission to access Freighter wallet
 */
export async function requestFreighterAccess() {
  try {
    const result = await freighter.setAllowed();
    return result.isAllowed;
  } catch (error) {
    console.error("Error requesting Freighter access:", error);
    return false;
  }
}

/**
 * Connect to Freighter wallet
 * @returns {Promise<{success: boolean, publicKey?: string, error?: string}>}
 */
export async function connectWallet() {
  try {
    // Check if Freighter is installed
    const installed = await isFreighterInstalled();
    if (!installed) {
      return {
        success: false,
        error: "Freighter wallet not installed. Please install it from https://freighter.app",
      };
    }

    // Check if we have permission
    const allowed = await isFreighterAllowed();
    if (!allowed) {
      // Request permission
      const granted = await requestFreighterAccess();
      if (!granted) {
        return {
          success: false,
          error: "Permission denied. Please allow access in Freighter.",
        };
      }
    }

    // Get public key
    const addressResult = await freighter.getAddress();
    if (addressResult.error || !addressResult.address) {
      return {
        success: false,
        error: addressResult.error || "Could not get public key. Please unlock your Freighter wallet.",
      };
    }

    const publicKey = addressResult.address;

    // Check network
    const networkResult = await freighter.getNetwork();
    
    // Update state
    walletState = {
      isConnected: true,
      publicKey,
      networkPassphrase: networkResult.network || networkResult.networkPassphrase,
    };

    return {
      success: true,
      publicKey,
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return {
      success: false,
      error: error.message || "Failed to connect wallet",
    };
  }
}

/**
 * Disconnect wallet (local state only)
 */
export function disconnectWallet() {
  walletState = {
    isConnected: false,
    publicKey: null,
    networkPassphrase: null,
  };
}

/**
 * Get current wallet state
 */
export function getWalletState() {
  return { ...walletState };
}

/**
 * Get connected public key
 */
export async function getConnectedPublicKey() {
  try {
    const installed = await isFreighterInstalled();
    if (!installed) return null;

    const allowed = await isFreighterAllowed();
    if (!allowed) return null;

    const addressResult = await freighter.getAddress();
    if (addressResult.error || !addressResult.address) {
      return null;
    }
    return addressResult.address;
  } catch (error) {
    console.error("Error getting public key:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              SIGNING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sign a transaction with Freighter
 * @param {Transaction} transaction - Stellar transaction object
 * @returns {Promise<string>} Signed transaction XDR
 */
export async function signWithFreighter(transaction) {
  try {
    // Convert transaction to XDR
    const xdr = transaction.toXDR();

    // Sign with Freighter
    const result = await freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result.signedTxXdr;
  } catch (error) {
    console.error("Error signing transaction:", error);
    throw new Error(error.message || "Failed to sign transaction");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format address for display (truncated)
 */
export function formatAddress(address, chars = 6) {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

/**
 * Check if two addresses are the same
 */
export function isSameAddress(addr1, addr2) {
  if (!addr1 || !addr2) return false;
  return addr1.toUpperCase() === addr2.toUpperCase();
}
