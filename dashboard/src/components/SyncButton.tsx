"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/repos/sync", { method: "POST" });
      
      if (!res.ok) {
        throw new Error("Failed to sync");
      }
      
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to sync repositories. Please ensure you are logged in via GitHub.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isSyncing}
      className="bg-[#F5A623] hover:bg-[#F5A623]/90 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_25px_rgba(245,166,35,0.5)] flex items-center gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync GitHub"}
    </button>
  );
}
