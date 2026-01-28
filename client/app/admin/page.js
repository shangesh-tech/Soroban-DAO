"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  CheckCircle,
  Key,
  Coins,
  Info,
} from "lucide-react";
import { getStats, getAdmin } from "@/lib/contract";
import { useWallet } from "@/context/WalletContext";
import { isSameAddress } from "@/lib/wallet";

export default function AdminPage() {
  const { isConnected, publicKey, connect, formatAddress } = useWallet();
  
  const [stats, setStats] = useState(null);
  const [adminAddress, setAdminAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, admin] = await Promise.all([
          getStats(),
          getAdmin()
        ]);
        setStats(statsData);
        setAdminAddress(admin);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Check if connected wallet is admin
  useEffect(() => {
    if (isConnected && publicKey && adminAddress) {
      setIsAdmin(isSameAddress(publicKey, adminAddress));
    } else {
      setIsAdmin(false);
    }
  }, [isConnected, publicKey, adminAddress]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
        <p className="mt-2 text-neutral-600">
          Manage contract funds and platform settings
        </p>
      </div>

      {/* Admin Status */}
      {!isConnected ? (
        <div className="mb-6 p-4 rounded-xl border bg-neutral-50 border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-5 h-5 mr-3 text-neutral-500" />
              <div>
                <p className="text-sm font-medium text-black">Wallet Not Connected</p>
                <p className="text-xs text-neutral-500">
                  Connect your wallet to check admin status
                </p>
              </div>
            </div>
            <button
              onClick={connect}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div className={`mb-6 p-4 rounded-xl border ${
          isAdmin 
            ? "bg-black text-white border-black" 
            : "bg-neutral-50 border-neutral-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Key className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm font-medium">Admin Status</p>
                <p className={`text-xs ${isAdmin ? "text-neutral-300" : "text-neutral-500"}`}>
                  {isAdmin ? "You are the admin" : "You are not the admin"}
                </p>
              </div>
            </div>
            {isAdmin ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6 text-neutral-400" />
            )}
          </div>
        </div>
      )}

      {/* Contract Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
          <Coins className="w-5 h-5 mr-2" />
          Contract Information
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm text-neutral-600">Admin Address</span>
            <span className="font-mono text-xs text-black">
              {loadingData ? "Loading..." : (adminAddress ? `${adminAddress.slice(0, 12)}...` : "N/A")}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm text-neutral-600">Contract Balance</span>
            <span className="font-semibold text-black">{stats?.contractBalance || 0} XLM</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm text-neutral-600">Total Donated</span>
            <span className="text-black">{stats?.totalDonate || 0} XLM</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm text-neutral-600">Total DAOs</span>
            <span className="text-black">{stats?.totalDao || 0}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-neutral-600">Total Votes</span>
            <span className="text-black">{stats?.totalVote || 0}</span>
          </div>
        </div>
      </div>

      {/* Withdraw Section - Coming Soon */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
          <ArrowDownToLine className="w-5 h-5 mr-2" />
          Withdraw Funds
        </h2>

        <div className="text-center py-6">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowDownToLine className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-neutral-600 mb-4">
            Withdrawals require additional token setup and will be available in a future update.
          </p>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-left">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
              <p className="text-sm text-neutral-600">
                Token withdrawals on Soroban require deploying a Stellar Asset Contract (SAC) 
                and configuring proper token approvals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-black">Note:</span> Only the admin
            wallet can withdraw funds from the contract. All withdrawals are
            recorded on the Stellar blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
