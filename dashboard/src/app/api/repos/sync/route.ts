import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized or missing GitHub token" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const accessToken = (session as any).accessToken;

    // Fetch user's repositories from GitHub
    const githubRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!githubRes.ok) {
      throw new Error(`GitHub API error: ${githubRes.statusText}`);
    }

    const repos = await githubRes.json();

    // Prepare data for Prisma
    const upsertPromises = repos.map((repo: any) => {
      return prisma.repository.upsert({
        where: {
          userId_repoId: {
            userId: userId,
            repoId: repo.id,
          },
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
        },
        create: {
          userId: userId,
          repoId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          // Defaults for isEnabled, minSeverity, aiModel are set in Prisma schema
        },
      });
    });

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true, count: repos.length }, { status: 200 });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
