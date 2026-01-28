"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Coins,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { getStats } from "@/lib/contract";

export default function DonatePage() {
  const [stats, setStats] = useState({ totalDonate: 0, contractBalance: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black">Support SorobanDAO</h1>
        <p className="mt-2 text-neutral-600">
          Your donations help maintain and improve the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
          <Coins className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-black">{stats.totalDonate} XLM</p>
          <p className="text-xs text-neutral-500">Total Donated</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
          <Sparkles className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-black">{stats.contractBalance} XLM</p>
          <p className="text-xs text-neutral-500">Contract Balance</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">
            Donations Coming Soon
          </h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Token donations require additional setup with Stellar Asset Contracts (SAC). 
            This feature will be available in a future update.
          </p>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-left">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
              <div className="text-sm text-neutral-600">
                <p className="font-medium text-black mb-1">Why is this not available yet?</p>
                <p>
                  Donating tokens on Soroban requires deploying a Stellar Asset Contract (SAC) 
                  for the native XLM token and setting up proper token approvals. This is 
                  planned for a future release.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          All donations will go directly to the SorobanDAO contract and can only be
          withdrawn by the admin for platform maintenance and development.
        </p>
      </div>
    </div>
  );
}
