"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Wallet,
  ArrowDownToLine,
  AlertCircle,
  CheckCircle,
  Key,
  Coins,
} from "lucide-react";
import toast from "react-hot-toast";
import { withdraw, getStats, getAdmin, MOCK_ADMIN, MOCK_WALLET } from "@/lib/mockData";

export default function AdminPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setStats(getStats());
    // In a real app, this would check if the connected wallet is the admin
    setIsAdmin(MOCK_WALLET === MOCK_ADMIN);
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (withdrawAmount > parseFloat(stats?.contractBalance || 0)) {
      toast.error("Insufficient contract balance");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      withdraw(MOCK_ADMIN, withdrawAmount);
      toast.success(`Successfully withdrew ${withdrawAmount} XLM!`);
      setStats(getStats());
      setAmount("");
    } catch (error) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Contract Info */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
          <Coins className="w-5 h-5 mr-2" />
          Contract Information
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-100">
            <span className="text-sm text-neutral-600">Admin Address</span>
            <span className="font-mono text-xs text-black">{getAdmin()}</span>
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

      {/* Withdraw Form */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
          <ArrowDownToLine className="w-5 h-5 mr-2" />
          Withdraw Funds
        </h2>

        {!isAdmin ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">Access Denied</p>
            <p className="text-sm text-neutral-500">
              Only the admin can withdraw funds from the contract.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdraw}>
            {/* Amount Input */}
            <div className="mb-6">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-black mb-2"
              >
                Withdrawal Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  max={stats?.contractBalance || 0}
                  className="w-full px-4 py-3 pr-16 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  XLM
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-neutral-500">
                  Available: {stats?.contractBalance || 0} XLM
                </p>
                <button
                  type="button"
                  onClick={() => setAmount(stats?.contractBalance || "")}
                  className="text-xs font-medium text-black hover:underline"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Wallet className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-black">Recipient:</span>{" "}
                    <span className="font-mono text-xs">{MOCK_ADMIN}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Funds will be withdrawn to the admin address.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Withdraw {amount ? `${amount} XLM` : ""}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Warning Notice */}
      <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-black">Simulation Mode:</span> This
            is a demo interface. No actual blockchain transactions are being made.
          </p>
        </div>
      </div>
    </div>
  );
}
