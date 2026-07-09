import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";
import { analyzeDiffAndPostReview } from "@/lib/ai";

export const maxDuration = 60; // Allow up to 60 seconds for OpenRouter response

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  
  console.log("🟢 [WEBHOOK RECEIVED] Event:", event);
  console.log("🟢 [WEBHOOK SIGNATURE]", signature ? "Present" : "Missing");

  if (!signature) {
    console.error("🔴 [WEBHOOK ERROR] No signature found");
    return NextResponse.json({ error: "No signature found" }, { status: 401 });
  }

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error("🔴 [WEBHOOK ERROR] Webhook secret not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify signature securely
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest)) === false) {
    console.error("🔴 [WEBHOOK ERROR] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(payload);
  console.log("🟢 [WEBHOOK PARSED] Action:", data.action, "Repo:", data.repository?.full_name);

  // We only care about PRs that are opened or updated
  if (event === "pull_request" && (data.action === "opened" || data.action === "synchronize")) {
    const repoId = data.repository.id;
    const prNumber = data.pull_request.number;
    const installationId = data.installation?.id;

    if (!installationId) {
      return NextResponse.json({ error: "No installation ID" }, { status: 400 });
    }

    // Check if repo is enabled in our DB
    const repo = await prisma.repository.findFirst({
      where: { repoId: repoId }
    });
    
    console.log("🟢 [WEBHOOK REPO CHECK] Found Repo in DB:", repo ? repo.fullName : "None", "Enabled:", repo?.isEnabled);

    if (!repo || !repo.isEnabled) {
      console.log("🟠 [WEBHOOK SKIPPED] Repository not enabled:", repoId);
      return NextResponse.json({ message: "Repository not enabled for GitOwl" });
    }
    
    console.log("🟢 [WEBHOOK AUTHORIZED] Starting AI review for PR:", prNumber);
    try {
      const octokit = await getInstallationOctokit(installationId);
      
      const owner = data.repository.owner.login;
      const repoName = data.repository.name;
      
      // Fetch the actual diff
      const diffResponse = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: prNumber,
        mediaType: {
          format: "diff"
        }
      });
      
      // Octokit returns the diff string when format is 'diff'
      const diff = diffResponse.data as unknown as string;
      console.log("🟢 [WEBHOOK] Diff fetched successfully, length:", diff.length);
      
      // Analyze with AI and post comment
      console.log("🟢 [WEBHOOK] Triggering AI Analysis...");
      await analyzeDiffAndPostReview(
        diff,
        repo.aiModel,
        repo.minSeverity,
        repo.id,
        prNumber,
        async (commentBody: string) => {
          console.log("🟢 [WEBHOOK] AI Analysis complete, posting comment to GitHub...");
          await octokit.rest.issues.createComment({
            owner,
            repo: repoName,
            issue_number: prNumber,
            body: commentBody
          });
          console.log("🟢 [WEBHOOK] Comment posted successfully!");
        }
      );
      
      console.log("🟢 [WEBHOOK] Review flow fully completed!");
      return NextResponse.json({ success: true, message: "Review completed" });
    } catch (error: any) {
      console.error("Error processing PR:", error);
      return NextResponse.json({ error: "Failed to process review", details: error?.message || String(error) }, { status: 500 });
    }
  }

  // Acknowledge other events without processing
  return NextResponse.json({ message: "Event ignored" });
}
