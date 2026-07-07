"use client";

import Link from "next/link";
import { ArrowLeft, Save, TerminalSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function PolicyEditorPage({ params }: { params: { id: string } }) {
  return (
    <motion.div 
      className="space-y-8 max-w-3xl"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-5">
        <Link href="/repositories" className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05] hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-xl hover:-translate-x-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Review Policy Engine</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Fine-tune the GitOwl AI analysis rules for this repository.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md p-8 space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full blur-[60px]" />
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 font-heading flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-[#F5A623]" />
              Minimum Severity Threshold
            </h3>
            <p className="text-sm text-slate-400 mb-4">The engine will drop any findings below this severity level.</p>
            <div className="relative">
              <select className="w-full appearance-none bg-black/60 border border-white/[0.1] rounded-xl p-3.5 text-sm text-white font-medium focus:outline-none focus:border-[#F5A623]/50 focus:ring-1 focus:ring-[#F5A623]/50 transition-all">
                <option value="info">Info (All observations)</option>
                <option value="warning">Warning (Standard PRs)</option>
                <option value="error">Error (Only critical bugs)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-8">
            <h3 className="text-lg font-semibold text-white mb-2 font-heading flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-[#00E5FF]" />
              Ignore Paths
            </h3>
            <p className="text-sm text-slate-400 mb-4">Glob patterns for files the engine should never analyze.</p>
            <textarea 
              className="w-full bg-black/60 border border-white/[0.1] rounded-xl p-4 text-sm text-[#00E5FF] font-mono focus:outline-none focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/50 transition-all min-h-[120px] placeholder:text-slate-600"
              placeholder="e.g., tests/**&#10;**/*.md"
              defaultValue="tests/**&#10;**/*.md"
            />
          </div>

          <div className="border-t border-white/[0.05] pt-8">
            <h3 className="text-lg font-semibold text-white mb-2 font-heading flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-slate-400" />
              AI Model Override
            </h3>
            <p className="text-sm text-slate-400 mb-4">Force a specific LLM to run the analysis for this repository.</p>
            <div className="relative">
              <select className="w-full appearance-none bg-black/60 border border-white/[0.1] rounded-xl p-3.5 text-sm text-white font-medium focus:outline-none focus:border-slate-400/50 focus:ring-1 focus:ring-slate-400/50 transition-all">
                <option value="openrouter/auto">Auto (Managed by GitOwl - Recommended)</option>
                <option value="gpt-4o">GPT-4o (Maximum precision, highest cost)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (Fastest, low cost)</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Best complex logic reasoning)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_25px_rgba(245,166,35,0.5)]">
            <Save className="w-4 h-4" />
            Save Policy
          </button>
        </div>
      </div>
    </motion.div>
  );
}
