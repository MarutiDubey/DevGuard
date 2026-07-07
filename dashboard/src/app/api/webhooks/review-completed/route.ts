import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { repoFullName, prNumber, riskScore, tokensUsed, cost, latency } = body;

    if (!repoFullName || !prNumber || !riskScore) {
      return NextResponse.json(
        { error: "Missing required fields: repoFullName, prNumber, riskScore" },
        { status: 400 }
      );
    }

    // Find the repository in our database
    const repository = await prisma.repository.findFirst({
      where: { fullName: repoFullName },
    });

    if (!repository) {
      return NextResponse.json(
        { error: `Repository ${repoFullName} is not registered in the dashboard.` },
        { status: 404 }
      );
    }

    // Create the review log
    const reviewLog = await prisma.reviewLog.create({
      data: {
        repositoryId: repository.id,
        prNumber: Number(prNumber),
        riskScore: String(riskScore),
        tokensUsed: Number(tokensUsed),
        cost: cost ? Number(cost) : null,
        latency: latency ? Number(latency) : null,
      },
    });

    return NextResponse.json({ success: true, logId: reviewLog.id }, { status: 201 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error processing webhook." },
      { status: 500 }
    );
  }
}
