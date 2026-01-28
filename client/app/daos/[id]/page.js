"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Users,
  User,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getDAO,
  hasVoted,
  buildVoteTransaction,
  buildDeleteDAOTransaction,
  formatDeadline,
  isExpired,
  getTimeRemaining,
} from "@/lib/contract";
import { useWallet } from "@/context/WalletContext";
import { isSameAddress } from "@/lib/wallet";

export default function DAODetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const daoName = decodeURIComponent(resolvedParams.id);
  
  const { isConnected, publicKey, signAndSubmit, connect } = useWallet();
  
  const [dao, setDao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkingVoteStatus, setCheckingVoteStatus] = useState(false);

  // Fetch DAO data
  useEffect(() => {
    const fetchDAO = async () => {
      try {
        const daoData = await getDAO(daoName);
        setDao(daoData);
      } catch (error) {
        console.error("Error fetching DAO:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDAO();
  }, [daoName]);

  // Check if user has voted when wallet connects
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (isConnected && publicKey && dao) {
        setCheckingVoteStatus(true);
        try {
          const voted = await hasVoted(daoName, publicKey);
          setUserHasVoted(voted);
        } catch (error) {
          console.error("Error checking vote status:", error);
        } finally {
          setCheckingVoteStatus(false);
        }
      }
    };
    checkVoteStatus();
  }, [isConnected, publicKey, dao, daoName]);

  const handleVote = async (choice) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setVoting(true);
    try {
      // Build the vote transaction
      const tx = await buildVoteTransaction(publicKey, daoName, choice);
      
      // Sign and submit
      const result = await signAndSubmit(tx);
      
      if (result.success) {
        // Refresh DAO data
        const updatedDao = await getDAO(daoName);
        setDao(updatedDao);
        setUserHasVoted(true);
        toast.success(`You voted ${choice.toUpperCase()}!`);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Vote error:", error);
      toast.error(error.message || "Failed to submit vote");
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setDeleting(true);
    try {
      // Build the delete transaction
      const tx = await buildDeleteDAOTransaction(publicKey, daoName);
      
      // Sign and submit
      const result = await signAndSubmit(tx);
      
      if (result.success) {
        toast.success("DAO deleted successfully!");
        router.push("/daos");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete DAO");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-neutral-400 mx-auto mb-4 animate-spin" />
          <p className="text-neutral-600">Loading DAO from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">DAO not found</h3>
          <p className="text-neutral-600 mb-6">
            The DAO you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <Link
            href="/daos"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to DAOs
          </Link>
        </div>
      </div>
    );
  }

  const expired = isExpired(dao.dao_deadline);
  const isOwner = isConnected && publicKey && isSameAddress(dao.dao_owner, publicKey);
  const yesPercentage = dao.total_votes > 0 
    ? Math.round((dao.yes / dao.total_votes) * 100) 
    : 0;
  const noPercentage = dao.total_votes > 0 
    ? Math.round((dao.no / dao.total_votes) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/daos"
        className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to DAOs
      </Link>

      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-black">{dao.dao_name}</h1>
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
            <p className="text-neutral-600">{dao.dao_des}</p>
          </div>
          
          {isOwner && !expired && (
            <div className="flex gap-2">
              <Link
                href={`/daos/${encodeURIComponent(dao.dao_name)}/edit`}
                className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="mt-6 pt-6 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center text-sm text-neutral-600">
            <User className="w-4 h-4 mr-2 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Owner</p>
              <p className="font-mono text-xs">{dao.dao_owner.slice(0, 12)}...</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Deadline</p>
              <p className="text-xs">{formatDeadline(dao.dao_deadline)}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <Clock className="w-4 h-4 mr-2 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Status</p>
              <p className="text-xs">{getTimeRemaining(dao.dao_deadline)}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <Users className="w-4 h-4 mr-2 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-400">Total Votes</p>
              <p className="text-xs font-medium">{dao.total_votes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-black mb-6">Vote Results</h2>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          {/* Yes Votes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm font-medium text-black">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Yes
              </span>
              <span className="text-sm text-neutral-600">
                {dao.yes} votes ({yesPercentage}%)
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          {/* No Votes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm font-medium text-black">
                <ThumbsDown className="w-4 h-4 mr-2" />
                No
              </span>
              <span className="text-sm text-neutral-600">
                {dao.no} votes ({noPercentage}%)
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-500 transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vote Buttons - Show when wallet not connected */}
        {!isConnected && !expired && (
          <button
            onClick={connect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet to Vote
          </button>
        )}

        {/* Vote Buttons - Show when connected and eligible */}
        {isConnected && !expired && !isOwner && !userHasVoted && !checkingVoteStatus && (
          <div className="flex gap-4">
            <button
              onClick={() => handleVote("yes")}
              disabled={voting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="w-5 h-5" />
                  Vote Yes
                </>
              )}
            </button>
            <button
              onClick={() => handleVote("no")}
              disabled={voting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 text-black rounded-lg font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ThumbsDown className="w-5 h-5" />
                  Vote No
                </>
              )}
            </button>
          </div>
        )}

        {/* Checking vote status */}
        {checkingVoteStatus && (
          <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-lg">
            <Loader2 className="w-5 h-5 text-neutral-500 mr-2 animate-spin" />
            <span className="text-sm text-neutral-600">
              Checking your vote status...
            </span>
          </div>
        )}

        {/* Status Messages */}
        {isConnected && userHasVoted && (
          <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-black mr-2" />
            <span className="text-sm font-medium text-black">
              You have already voted on this DAO
            </span>
          </div>
        )}

        {isOwner && !expired && (
          <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-neutral-500 mr-2" />
            <span className="text-sm text-neutral-600">
              DAO owners cannot vote on their own proposals
            </span>
          </div>
        )}

        {expired && (
          <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-lg">
            <XCircle className="w-5 h-5 text-neutral-500 mr-2" />
            <span className="text-sm text-neutral-600">
              Voting has ended for this DAO
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-black mb-2">
              Delete DAO?
            </h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete &quot;{dao.dao_name}&quot;? This action
              cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
