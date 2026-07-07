"use client";

import { Activity, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold tracking-tight text-white font-heading">Precision Overview</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">Real-time metrics from your AI code reviews. The engine is constantly analyzing diffs to filter out noise.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Reviews" value="1,248" change="+12% from last month" icon={<Activity className="w-4 h-4 text-[#00E5FF]" />} />
        <MetricCard title="Bugs Caught" value="342" change="+18% from last month" icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} accent="glow-cyan" />
        <MetricCard title="Tokens Used" value="4.2M" change="Estimated cost: $1.20" icon={<Zap className="w-4 h-4 text-[#F5A623]" />} />
        <MetricCard title="High Risk PRs" value="12" change="Requires human review" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} accent="glow-accent" />
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-colors duration-700" />
          <h2 className="text-lg font-semibold text-white mb-6 font-heading flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
            Review Activity
          </h2>
          <div className="h-[280px] flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <span className="text-slate-500 text-sm tracking-widest uppercase font-medium">Chart Engine Initializing...</span>
          </div>
        </div>
        
        <div className="col-span-3 rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md p-6">
          <h2 className="text-lg font-semibold text-white mb-6 font-heading flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
            Recent Interventions
          </h2>
          <div className="space-y-4">
            <FindingItem repo="frontend-web" pr="#104" severity="high" message="Hardcoded JWT secret detected." />
            <FindingItem repo="backend-api" pr="#442" severity="medium" message="Unoptimized database query mapping." />
            <FindingItem repo="frontend-web" pr="#102" severity="low" message="Console.log left in production build." />
            <FindingItem repo="core-engine" pr="#88" severity="medium" message="Potential memory leak in async loop." />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ title, value, change, icon, accent }: { title: string, value: string, change: string, icon: React.ReactNode, accent?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md p-6 flex flex-col hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 ${accent ? 'hover:' + accent : ''}`}>
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500 scale-150 transform translate-x-4 -translate-y-4">
        {icon}
      </div>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05] shadow-inner">
          {icon}
        </div>
      </div>
      <div className="mt-6 relative z-10">
        <span className="text-4xl font-bold text-white font-heading tracking-tight">{value}</span>
      </div>
      <p className="text-xs text-slate-500 mt-2 relative z-10 font-medium">{change}</p>
    </div>
  );
}

function FindingItem({ repo, pr, severity, message }: { repo: string, pr: string, severity: "low"|"medium"|"high", message: string }) {
  const colors = {
    low: "text-slate-300 bg-slate-400/10 border-slate-400/20",
    medium: "text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/20 shadow-[0_0_10px_rgba(245,166,35,0.1)]",
    high: "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]",
  };

  return (
    <div className="group flex flex-col gap-2.5 p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-default">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-black/50 px-2 py-1 rounded-md border border-white/[0.05]">{repo}</span>
          <span className="text-xs font-mono text-slate-500">{pr}</span>
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md border ${colors[severity]}`}>{severity}</span>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed font-medium group-hover:text-white transition-colors">{message}</p>
    </div>
  );
}
