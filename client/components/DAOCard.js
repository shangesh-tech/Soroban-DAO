"use client";

import Link from "next/link";
import { Clock, ThumbsUp, ThumbsDown, Users, ArrowRight } from "lucide-react";
import { formatDeadline, isExpired, getTimeRemaining } from "@/lib/mockData";

export default function DAOCard({ dao }) {
  const expired = isExpired(dao.dao_deadline);
  const yesPercentage = dao.total_votes > 0 
    ? Math.round((dao.yes / dao.total_votes) * 100) 
    : 0;
  const noPercentage = dao.total_votes > 0 
    ? Math.round((dao.no / dao.total_votes) * 100) 
    : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-400 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-black">{dao.dao_name}</h3>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Owner: {dao.dao_owner.slice(0, 10)}...
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            expired
              ? "bg-neutral-100 text-neutral-600"
              : "bg-black text-white"
          }`}
        >
          {expired ? "Ended" : "Active"}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
        {dao.dao_des}
      </p>

      {/* Vote Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span className="flex items-center">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Yes: {dao.yes} ({yesPercentage}%)
          </span>
          <span className="flex items-center">
            <ThumbsDown className="w-3 h-3 mr-1" />
            No: {dao.no} ({noPercentage}%)
          </span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${yesPercentage}%` }}
          />
          <div
            className="h-full bg-neutral-400 transition-all"
            style={{ width: `${noPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center space-x-4 text-xs text-neutral-500">
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {dao.total_votes} votes
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {getTimeRemaining(dao.dao_deadline)}
          </span>
        </div>
        <Link
          href={`/daos/${encodeURIComponent(dao.dao_name)}`}
          className="flex items-center text-sm font-medium text-black hover:underline"
        >
          View
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
