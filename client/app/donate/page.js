"use client";

import { useState } from "react";
import {
  Gift,
  Coins,
  Heart,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { donate, getStats, MOCK_WALLET } from "@/lib/mockData";

export default function DonatePage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [donated, setDonated] = useState(false);

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  const handleDonate = async (e) => {
    e.preventDefault();

    const donationAmount = parseFloat(amount);

    if (!donationAmount || donationAmount <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      donate(donationAmount);
      toast.success(`Thank you for donating ${donationAmount} XLM!`);
      setDonated(true);
      setAmount("");
    } catch (error) {
      toast.error(error.message || "Donation failed");
    } finally {
      setLoading(false);
    }
  };

  const stats = getStats();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
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

      {/* Donation Form */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        {donated ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">
              Thank You!
            </h3>
            <p className="text-neutral-600 mb-6">
              Your donation has been received and will support the platform.
            </p>
            <button
              onClick={() => setDonated(false)}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Donate Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleDonate}>
            {/* Preset Amounts */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-3">
                Select Amount (XLM)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className={`py-3 rounded-lg font-medium transition-colors ${
                      amount === preset.toString()
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-black hover:bg-neutral-200"
                    }`}
                  >
                    {preset} XLM
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-black mb-2"
              >
                Or Enter Custom Amount
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
                  className="w-full px-4 py-3 pr-16 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                  XLM
                </span>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-neutral-600">
                    <span className="font-medium text-black">Donating from:</span>{" "}
                    <span className="font-mono text-xs">{MOCK_WALLET}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    This is a simulation. No actual tokens will be transferred.
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
                  <Gift className="w-4 h-4 mr-2" />
                  Donate {amount ? `${amount} XLM` : ""}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          All donations go directly to the SorobanDAO contract and can only be
          withdrawn by the admin for platform maintenance and development.
        </p>
      </div>
    </div>
  );
}
