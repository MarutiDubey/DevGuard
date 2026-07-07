import Link from "next/link";
import { GitBranch, Settings2, CheckCircle2, XCircle } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SyncButton from "@/components/SyncButton";

export default async function RepositoriesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-xl text-white font-heading">Not Authenticated</h2>
        <p className="text-slate-400">Please sign in via GitHub to view your repositories.</p>
      </div>
    );
  }

  const userId = (session.user as any).id;
  const repos = await prisma.repository.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Repositories</h1>
          <p className="text-slate-400 mt-2 text-sm">Manage GitOwl engine integration for your GitHub repositories.</p>
        </div>
        <SyncButton />
      </div>

      <div className="rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent" />
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.05]">
            <tr>
              <th className="px-6 py-5 font-medium tracking-wide">Repository</th>
              <th className="px-6 py-5 font-medium tracking-wide">Status</th>
              <th className="px-6 py-5 font-medium text-right tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {repos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  No repositories found. Click "Sync GitHub" to pull your repos.
                </td>
              </tr>
            ) : repos.map((repo) => (
              <tr key={repo.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.05] group-hover:border-white/[0.1] transition-colors">
                      <GitBranch className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-white tracking-wide">{repo.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{repo.fullName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {repo.isEnabled ? (
                    <div className="flex items-center gap-2 text-[#00E5FF]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium text-xs tracking-widest uppercase">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <XCircle className="w-4 h-4" />
                      <span className="font-medium text-xs tracking-widest uppercase">Offline</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    href={`/repositories/${repo.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-white rounded-lg transition-all hover:scale-105"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                    Configure
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
