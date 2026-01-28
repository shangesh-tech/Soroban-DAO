/**
 * Soroban DAO Contract Integration
 * Using @stellar/stellar-sdk v23
 */

import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  StrKey,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";

// ═══════════════════════════════════════════════════════════════════════════════
//                              CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Contract ID from deployment
export const CONTRACT_ID = "CASPJ3SPGNPEYLOSRSNIETEFUSB4FMXBSCYA7QUSVCAV4JIIDROIXBGC";

// Network configuration
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";

// Create RPC server instance
export const server = new rpc.Server(RPC_URL);

// Create contract instance
export const contract = new Contract(CONTRACT_ID);

// ═══════════════════════════════════════════════════════════════════════════════
//                              HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert JavaScript string to Soroban ScVal String
 */
export const toScString = (str) => nativeToScVal(str, { type: "string" });

/**
 * Convert JavaScript number to Soroban ScVal u64
 */
export const toScU64 = (num) => nativeToScVal(num, { type: "u64" });

/**
 * Convert JavaScript BigInt to Soroban ScVal i128
 */
export const toScI128 = (num) => nativeToScVal(num, { type: "i128" });

/**
 * Convert Stellar address string to Soroban Address ScVal
 * Handles both account addresses (G...) and contract addresses (C...)
 */
export const toScAddress = (address) => {
  if (address.startsWith("C")) {
    // Contract address - use contract() method
    return Address.contract(StrKey.decodeContract(address)).toScVal();
  } else {
    // Account address (G...)
    return new Address(address).toScVal();
  }
};

/**
 * Convert timestamp (milliseconds) to ledger timestamp (seconds as u64)
 */
export const msToLedgerTimestamp = (ms) => Math.floor(ms / 1000);

/**
 * Convert ledger timestamp (seconds) to milliseconds
 */
export const ledgerTimestampToMs = (timestamp) => Number(timestamp) * 1000;

/**
 * Format stroops to XLM (1 XLM = 10^7 stroops)
 */
export const stroopsToXLM = (stroops) => {
  return (Number(stroops) / 10000000).toFixed(2);
};

/**
 * Format XLM to stroops
 */
export const xlmToStroops = (xlm) => {
  return BigInt(Math.floor(xlm * 10000000));
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              VIEW FUNCTIONS (Read-Only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Call a view function on the contract (no signature required)
 */
async function callViewFunction(functionName, args = []) {
  try {
    // Create a temporary account for simulation (view functions don't need real account)
    const tempKeypair = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    let account;
    try {
      account = await server.getAccount(tempKeypair);
    } catch {
      // Use a simulated account if not found
      const { Account } = await import("@stellar/stellar-sdk");
      account = new Account(tempKeypair, "0");
    }

    // Build the transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(30)
      .build();

    // Simulate (don't submit)
    const simulation = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation error: ${simulation.error}`);
    }

    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result) {
      return scValToNative(simulation.result.retval);
    }

    return null;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Get all DAOs from the contract
 */
export async function getAllDAOs() {
  try {
    const result = await callViewFunction("get_all_daos");
    if (!result) return [];
    
    // Convert the result to our expected format
    return result.map((dao) => ({
      dao_name: dao.dao_name,
      dao_des: dao.dao_des,
      dao_owner: dao.dao_owner,
      dao_deadline: ledgerTimestampToMs(dao.dao_deadline),
      yes: Number(dao.yes),
      no: Number(dao.no),
      total_votes: Number(dao.total_votes),
    }));
  } catch (error) {
    console.error("Error fetching DAOs:", error);
    return [];
  }
}

/**
 * Get a single DAO by name
 */
export async function getDAO(daoName) {
  try {
    const result = await callViewFunction("get_dao", [toScString(daoName)]);
    if (!result) return null;
    
    return {
      dao_name: result.dao_name,
      dao_des: result.dao_des,
      dao_owner: result.dao_owner,
      dao_deadline: ledgerTimestampToMs(result.dao_deadline),
      yes: Number(result.yes),
      no: Number(result.no),
      total_votes: Number(result.total_votes),
    };
  } catch (error) {
    console.error("Error fetching DAO:", error);
    return null;
  }
}

/**
 * Check if user has voted on a DAO
 */
export async function hasVoted(daoName, voterAddress) {
  try {
    const result = await callViewFunction("has_voted", [
      toScString(daoName),
      toScAddress(voterAddress),
    ]);
    return result === true;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
}

/**
 * Get admin address
 */
export async function getAdmin() {
  try {
    return await callViewFunction("get_admin");
  } catch (error) {
    console.error("Error fetching admin:", error);
    return null;
  }
}

/**
 * Get total DAO count
 */
export async function getTotalDao() {
  try {
    const result = await callViewFunction("get_total_dao");
    return Number(result) || 0;
  } catch (error) {
    console.error("Error fetching total DAO:", error);
    return 0;
  }
}

/**
 * Get total vote count
 */
export async function getTotalVote() {
  try {
    const result = await callViewFunction("get_total_vote");
    return Number(result) || 0;
  } catch (error) {
    console.error("Error fetching total votes:", error);
    return 0;
  }
}

/**
 * Get total donations
 */
export async function getTotalDonate() {
  try {
    const result = await callViewFunction("get_total_donate");
    return result || 0n;
  } catch (error) {
    console.error("Error fetching total donations:", error);
    return 0n;
  }
}

/**
 * Get contract balance for a token
 */
export async function getContractBalance(tokenAddress) {
  try {
    const result = await callViewFunction("get_contract_balance", [
      toScAddress(tokenAddress),
    ]);
    return result || 0n;
  } catch (error) {
    console.error("Error fetching contract balance:", error);
    return 0n;
  }
}

/**
 * Get all stats
 */
export async function getStats() {
  try {
    const [totalDao, totalVote, totalDonate] = await Promise.all([
      getTotalDao(),
      getTotalVote(),
      getTotalDonate(),
    ]);

    return {
      totalDao,
      totalVote,
      totalDonate: stroopsToXLM(totalDonate),
      contractBalance: stroopsToXLM(totalDonate), // Same as totalDonate for now
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalDao: 0,
      totalVote: 0,
      totalDonate: "0.00",
      contractBalance: "0.00",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              WRITE FUNCTIONS (Requires Wallet)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a transaction for contract call
 */
export async function buildTransaction(publicKey, functionName, args = []) {
  try {
    const account = await server.getAccount(publicKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(300)
      .build();

    // Simulate to get resource estimates
    const simulation = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation error: ${simulation.error}`);
    }

    // Assemble transaction with simulation results
    const preparedTx = rpc.assembleTransaction(tx, simulation).build();

    return preparedTx;
  } catch (error) {
    console.error(`Error building transaction for ${functionName}:`, error);
    throw error;
  }
}

/**
 * Submit a signed transaction and wait for result
 */
export async function submitTransaction(signedTxXdr) {
  try {
    const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const sendResponse = await server.sendTransaction(tx);

    if (sendResponse.status === "PENDING") {
      // Poll for result
      let getResponse = await server.getTransaction(sendResponse.hash);
      
      while (getResponse.status === "NOT_FOUND") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResponse = await server.getTransaction(sendResponse.hash);
      }

      if (getResponse.status === "SUCCESS") {
        return {
          success: true,
          hash: sendResponse.hash,
          result: getResponse.returnValue
            ? scValToNative(getResponse.returnValue)
            : null,
        };
      } else {
        throw new Error(`Transaction failed: ${getResponse.status}`);
      }
    } else {
      throw new Error(`Send failed: ${sendResponse.status}`);
    }
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              CONTRACT WRITE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new DAO
 * @param {string} publicKey - Wallet public key
 * @param {string} daoName - Name of the DAO
 * @param {string} description - Description of the DAO
 * @param {number} deadline - Deadline timestamp in milliseconds
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildCreateDAOTransaction(
  publicKey,
  daoName,
  description,
  deadline
) {
  // Convert deadline from ms to seconds for ledger timestamp
  const deadlineSeconds = msToLedgerTimestamp(deadline);

  return buildTransaction(publicKey, "create_dao", [
    toScString(daoName),
    toScString(description),
    toScAddress(publicKey),
    toScU64(deadlineSeconds),
  ]);
}

/**
 * Vote on a DAO
 * @param {string} publicKey - Voter's public key
 * @param {string} daoName - Name of the DAO
 * @param {string} choice - "yes" or "no"
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildVoteTransaction(publicKey, daoName, choice) {
  return buildTransaction(publicKey, "vote_dao", [
    toScAddress(publicKey),
    toScString(daoName),
    toScString(choice),
  ]);
}

/**
 * Update a DAO
 * @param {string} publicKey - Owner's public key
 * @param {string} daoName - Name of the DAO
 * @param {string} newDescription - New description
 * @param {number} newDeadline - New deadline in milliseconds
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildUpdateDAOTransaction(
  publicKey,
  daoName,
  newDescription,
  newDeadline
) {
  const deadlineSeconds = msToLedgerTimestamp(newDeadline);

  return buildTransaction(publicKey, "update_dao", [
    toScAddress(publicKey),
    toScString(daoName),
    toScString(newDescription),
    toScU64(deadlineSeconds),
  ]);
}

/**
 * Delete a DAO
 * @param {string} publicKey - Owner's public key
 * @param {string} daoName - Name of the DAO
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildDeleteDAOTransaction(publicKey, daoName) {
  return buildTransaction(publicKey, "delete_dao", [
    toScAddress(publicKey),
    toScString(daoName),
  ]);
}

/**
 * Donate to the contract
 * @param {string} publicKey - Donor's public key
 * @param {string} tokenAddress - XLM token contract address
 * @param {BigInt} amount - Amount in stroops
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildDonateTransaction(publicKey, tokenAddress, amount) {
  return buildTransaction(publicKey, "donate", [
    toScAddress(publicKey),
    toScAddress(tokenAddress),
    toScI128(amount),
  ]);
}

/**
 * Withdraw from the contract (admin only)
 * @param {string} publicKey - Admin's public key
 * @param {string} tokenAddress - XLM token contract address
 * @param {string} recipient - Recipient address
 * @param {BigInt} amount - Amount in stroops
 * @returns {Promise<object>} Transaction object for signing
 */
export async function buildWithdrawTransaction(
  publicKey,
  tokenAddress,
  recipient,
  amount
) {
  return buildTransaction(publicKey, "withdraw", [
    toScAddress(publicKey),
    toScAddress(tokenAddress),
    toScAddress(recipient),
    toScI128(amount),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a deadline has expired
 */
export function isExpired(deadline) {
  return Date.now() > deadline;
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline) {
  return new Date(deadline).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get time remaining until deadline
 */
export function getTimeRemaining(deadline) {
  const now = Date.now();
  if (now >= deadline) return "Ended";

  const diff = deadline - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m remaining`;
}
