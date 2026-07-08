import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const repo = await prisma.repository.findUnique({
      where: { id }
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse the body
    const body = await request.json();
    const { minSeverity, aiModel, ignorePaths, isEnabled } = body;

    // ignorePaths arrives as a newline-separated string from the textarea
    const normalizedIgnorePaths =
      typeof ignorePaths === "string"
        ? ignorePaths
        : Array.isArray(ignorePaths)
          ? ignorePaths.join("\n")
          : undefined;

    // Update the repository
    const updatedRepo = await prisma.repository.update({
      where: { id },
      data: {
        minSeverity,
        aiModel,
        ignorePaths: normalizedIgnorePaths,
        ...(typeof isEnabled === "boolean" && { isEnabled })
      }
    });

    return NextResponse.json(updatedRepo);
  } catch (error) {
    console.error("Failed to update repository policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
