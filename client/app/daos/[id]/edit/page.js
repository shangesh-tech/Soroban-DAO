"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDAO, buildUpdateDAOTransaction } from "@/lib/contract";
import { useWallet } from "@/context/WalletContext";
import { isSameAddress } from "@/lib/wallet";

export default function EditDAOPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const daoName = decodeURIComponent(resolvedParams.id);

  const { isConnected, publicKey, signAndSubmit, connect } = useWallet();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dao, setDao] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    deadline: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDAO = async () => {
      try {
        const daoData = await getDAO(daoName);
        if (daoData) {
          setDao(daoData);
          setFormData({
            description: daoData.dao_des,
            deadline: new Date(daoData.dao_deadline).toISOString().slice(0, 16),
          });
        } else {
          toast.error("DAO not found");
          router.push("/daos");
        }
      } catch (error) {
        console.error("Error fetching DAO:", error);
        toast.error("Failed to load DAO");
        router.push("/daos");
      } finally {
        setLoading(false);
      }
    };
    fetchDAO();
  }, [daoName, router]);

  // Check if user is owner when wallet connects
  useEffect(() => {
    if (!loading && dao && isConnected && publicKey) {
      if (!isSameAddress(dao.dao_owner, publicKey)) {
        toast.error("You don't have permission to edit this DAO");
        router.push(`/daos/${encodeURIComponent(daoName)}`);
      }
    }
  }, [loading, dao, isConnected, publicKey, daoName, router]);

  const validateForm = () => {
    const newErrors = {};

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

    setSaving(true);

    try {
      const deadlineTimestamp = new Date(formData.deadline).getTime();

      const tx = await buildUpdateDAOTransaction(
        publicKey,
        daoName,
        formData.description.trim(),
        deadlineTimestamp
      );

      const result = await signAndSubmit(tx);

      if (result.success) {
        toast.success("DAO updated successfully!");
        router.push(`/daos/${encodeURIComponent(daoName)}`);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update DAO");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-neutral-400 mx-auto mb-4 animate-spin" />
          <p className="text-neutral-600">Loading DAO...</p>
        </div>
      </div>
    );
  }

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/daos/${encodeURIComponent(daoName)}`}
          className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to DAO
        </Link>
        <div className="text-center py-16 bg-white border border-neutral-200 rounded-xl">
          <Wallet className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">Connect Wallet</h3>
          <p className="text-neutral-600 mb-6">
            Please connect your wallet to edit this DAO.
          </p>
          <button
            onClick={connect}
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href={`/daos/${encodeURIComponent(daoName)}`}
        className="inline-flex items-center text-sm text-neutral-600 hover:text-black mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to DAO
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Edit DAO</h1>
        <p className="mt-1 text-neutral-600">
          Update the details for <span className="font-medium">{daoName}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Note */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-black">Note:</span> The DAO name
            cannot be changed. Only the description and deadline can be updated.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Link
            href={`/daos/${encodeURIComponent(daoName)}`}
            className="flex-1 px-4 py-3 border border-neutral-300 text-black rounded-lg font-medium hover:bg-neutral-50 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
