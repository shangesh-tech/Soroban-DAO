"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  PlusCircle, 
  Calendar, 
  FileText, 
  Tag,
  AlertCircle,
  Loader2,
  Wallet
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { buildCreateDAOTransaction } from "@/lib/contract";
import { useWallet } from "@/context/WalletContext";

export default function CreateDAOPage() {
  const router = useRouter();
  const { isConnected, publicKey, signAndSubmit, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "DAO name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const deadlineTimestamp = new Date(formData.deadline).getTime();
      
      // Build the transaction
      const tx = await buildCreateDAOTransaction(
        publicKey,
        formData.name.trim(),
        formData.description.trim(),
        deadlineTimestamp
      );

      // Sign and submit
      const result = await signAndSubmit(tx);

      if (result.success) {
        toast.success("DAO created successfully!");
        router.push("/daos");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create DAO");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Get minimum date (now + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/daos"
        className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to DAOs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Create New DAO</h1>
        <p className="mt-1 text-neutral-600">
          Set up a new governance proposal for your community
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DAO Name */}
        <div>
          <label
            htmlFor="name"
            className="flex items-center text-sm font-medium text-black mb-2"
          >
            <Tag className="w-4 h-4 mr-2" />
            DAO Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., TechDAO, CommunityDAO"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white ${
              errors.name ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="flex items-center text-sm font-medium text-black mb-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the purpose and goals of this DAO proposal..."
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white resize-none ${
              errors.description ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.description}
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label
            htmlFor="deadline"
            className="flex items-center text-sm font-medium text-black mb-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Voting Deadline
          </label>
          <input
            type="datetime-local"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            min={getMinDateTime()}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white ${
              errors.deadline ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.deadline && (
            <p className="mt-1 text-sm text-red-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.deadline}
            </p>
          )}
        </div>

        {/* Owner Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-black">Owner Address:</span>{" "}
            <span className="font-mono text-xs">
              {isConnected ? publicKey : "Not connected"}
            </span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            You will be the owner of this DAO and can update or delete it.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Link
            href="/daos"
            className="flex-1 px-4 py-3 border border-neutral-300 text-black rounded-lg font-medium hover:bg-neutral-50 transition-colors text-center"
          >
            Cancel
          </Link>
          {isConnected ? (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create DAO
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
