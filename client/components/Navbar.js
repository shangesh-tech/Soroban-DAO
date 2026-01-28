"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Menu, 
  X, 
  Home, 
  Vote, 
  PlusCircle, 
  Gift, 
  Shield,
  Wallet
} from "lucide-react";
import { MOCK_WALLET } from "@/lib/mockData";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/daos", label: "DAOs", icon: Vote },
    { href: "/daos/create", label: "Create", icon: PlusCircle },
    { href: "/donate", label: "Donate", icon: Gift },
    { href: "/admin", label: "Admin", icon: Shield },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-black">SorobanDAO</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleConnect}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnected
                  ? "bg-neutral-100 text-black border border-neutral-300"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isConnected 
                  ? `${MOCK_WALLET.slice(0, 6)}...${MOCK_WALLET.slice(-4)}` 
                  : "Connect Wallet"
                }
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-neutral-200">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleConnect}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium mt-3 ${
                isConnected
                  ? "bg-neutral-100 text-black border border-neutral-300"
                  : "bg-black text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isConnected 
                  ? `${MOCK_WALLET.slice(0, 6)}...${MOCK_WALLET.slice(-4)}` 
                  : "Connect Wallet"
                }
              </span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
