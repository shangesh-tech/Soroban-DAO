"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, PlusCircle, Vote, Loader2 } from "lucide-react";
import DAOCard from "@/components/DAOCard";
import { getAllDAOs, isExpired } from "@/lib/contract";

export default function DAOsPage() {
  const [daos, setDaos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, ended

  useEffect(() => {
    const fetchDAOs = async () => {
      try {
        const data = await getAllDAOs();
        setDaos(data);
      } catch (error) {
        console.error("Error fetching DAOs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDAOs();
  }, []);

  const filteredDAOs = daos.filter((dao) => {
    const matchesSearch = 
      dao.dao_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.dao_des.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "active") {
      return matchesSearch && !isExpired(dao.dao_deadline);
    }
    if (filter === "ended") {
      return matchesSearch && isExpired(dao.dao_deadline);
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">All DAOs</h1>
          <p className="mt-1 text-neutral-600">
            Browse and participate in community proposals
          </p>
        </div>
        <Link
          href="/daos/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create DAO
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search DAOs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {["all", "active", "ended"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-neutral-400 mx-auto mb-4 animate-spin" />
          <p className="text-neutral-600">Loading DAOs from blockchain...</p>
        </div>
      ) : filteredDAOs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDAOs.map((dao) => (
            <DAOCard key={dao.dao_name} dao={dao} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl">
          <Vote className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No DAOs found</h3>
          <p className="text-neutral-600 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Be the first to create a DAO!"}
          </p>
          <Link
            href="/daos/create"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create DAO
          </Link>
        </div>
      )}
    </div>
  );
}
