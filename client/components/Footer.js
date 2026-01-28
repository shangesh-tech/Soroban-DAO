import { Vote, Github, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo & Description */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-black">SorobanDAO</span>
              <p className="text-xs text-neutral-500">Decentralized Governance on Stellar</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/daos" 
              className="text-sm text-neutral-600 hover:text-black transition-colors"
            >
              Browse DAOs
            </Link>
            <Link 
              href="/daos/create" 
              className="text-sm text-neutral-600 hover:text-black transition-colors"
            >
              Create DAO
            </Link>
            <Link 
              href="/donate" 
              className="text-sm text-neutral-600 hover:text-black transition-colors"
            >
              Donate
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-500">
            © 2026 SorobanDAO. Built on Stellar Soroban. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
