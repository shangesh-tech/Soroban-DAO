"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Vote, 
  Users, 
  Coins, 
  TrendingUp, 
  ArrowRight,
  Zap,
  Shield,
  Globe
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { getAllDAOs, getStats } from "@/lib/mockData";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recentDAOs, setRecentDAOs] = useState([]);

  useEffect(() => {
    setStats(getStats());
    setRecentDAOs(getAllDAOs().slice(0, 3));
  }, []);

  const features = [
    {
      icon: Zap,
      title: "Fast & Cheap",
      description: "Stellar's low fees make governance accessible to everyone.",
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Smart contracts ensure transparent and tamper-proof voting.",
    },
    {
      icon: Globe,
      title: "Decentralized",
      description: "No central authority. Your community, your rules.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Decentralized Governance
              <br />
              <span className="text-neutral-500">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-600 max-w-2xl mx-auto">
              Create DAOs, vote on proposals, and shape the future of your community
              using Stellar Soroban smart contracts.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/daos/create"
                className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center"
              >
                Create DAO
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/daos"
                className="w-full sm:w-auto px-8 py-3 bg-white text-black border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Browse DAOs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Vote}
            label="Total DAOs"
            value={stats?.totalDao || 0}
            subtitle="Active proposals"
          />
          <StatsCard
            icon={Users}
            label="Total Votes"
            value={stats?.totalVote || 0}
            subtitle="Community participation"
          />
          <StatsCard
            icon={Coins}
            label="Total Donated"
            value={`${stats?.totalDonate || 0} XLM`}
            subtitle="Platform support"
          />
          <StatsCard
            icon={TrendingUp}
            label="Contract Balance"
            value={`${stats?.contractBalance || 0} XLM`}
            subtitle="Available funds"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center text-black mb-12">
            Why SorobanDAO?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start your DAO?
          </h2>
          <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
            Join the decentralized governance revolution on Stellar. 
            Create your DAO in minutes.
          </p>
          <Link
            href="/daos/create"
            className="inline-flex items-center px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-100 transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
