"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Menu, 
  X, 
  Vote, 
  Wallet,
  LogOut,
  Loader2
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, publicKey, isLoading, connect, disconnect, formatAddress } = useWallet();

  const navLinks = [
    { href: "/", label: "Home"},
    { href: "/daos", label: "DAOs" },
    { href: "/donate", label: "Donate" },
    { href: "/admin", label: "Admin"},
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleWalletClick}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnected
                  ? "bg-neutral-100 text-black border border-neutral-300 hover:bg-neutral-200"
                  : "bg-black text-white hover:bg-neutral-800"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isConnected ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              <span>
                {isLoading 
                  ? "Loading..." 
                  : isConnected 
                    ? formatAddress(publicKey) 
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
            {navLinks.map((link) => (
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
                <span>{link.label}</span>
              </Link>
            ))}
            <button
              onClick={handleWalletClick}
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium mt-3 ${
                isConnected
                  ? "bg-neutral-100 text-black border border-neutral-300"
                  : "bg-black text-white"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isConnected ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              <span>
                {isLoading 
                  ? "Loading..." 
                  : isConnected 
                    ? formatAddress(publicKey) 
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
