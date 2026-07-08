"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, GitBranch, ShieldAlert, LogIn, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const links = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/repositories", label: "Repositories", icon: GitBranch },
    { href: "/analytics", label: "Analytics", icon: ShieldAlert },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 glass-panel rounded-2xl flex flex-col relative overflow-hidden shadow-2xl border-white/[0.05]">
      {/* Subtle top-left glare */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

      <div className="p-8 pb-4 relative z-10">
        <div className="flex items-center gap-3 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gitowl-logo.png" alt="GitOwl Logo" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white font-heading flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">GitOwl</span>
              <span className="w-2 h-2 rounded-full bg-[#F5A623] glow-accent animate-pulse" />
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">Precision Engine</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6 relative z-10">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/");
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                isActive ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-white/[0.06] border border-white/[0.1] rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <link.icon className={`w-4 h-4 relative z-10 transition-colors ${isActive ? "text-[#00E5FF]" : "group-hover:text-slate-300"}`} />
              <span className="text-sm font-medium relative z-10">{link.label}</span>
              
              {/* Subtle hover glow */}
              {!isActive && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-white/[0.03] to-transparent transition-opacity duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 relative z-10">
        {status === "loading" ? (
          <div className="flex items-center justify-center p-3 h-[62px] rounded-xl bg-black/20 border border-white/[0.05]">
            <div className="w-5 h-5 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : session ? (
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/[0.05] hover:border-white/[0.1] transition-colors group text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E2333] to-[#0B0E14] border border-white/[0.1] flex items-center justify-center text-[#F5A623] text-xs font-bold shadow-inner overflow-hidden">
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                session.user?.name?.substring(0, 2).toUpperCase() || "U"
              )}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{session.user?.name || "User"}</span>
              <span className="text-xs text-slate-500 truncate">{session.user?.email}</span>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </button>
        ) : (
          <button 
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white font-medium text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign in with GitHub
          </button>
        )}
      </div>
    </aside>
  );
}
