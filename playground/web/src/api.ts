export interface Finding {
  severity: string;
  title: string;
  message: string;
  file: string | null;
  line: number | null;
  suggestion: string | null;
}

export interface ReviewResponse {
  risk: string;
  summary: string;
  findings: Finding[];
  files_changed: number;
  added_lines: number;
  removed_lines: number;
}

export class ReviewApiError extends Error {}

export async function reviewDiff(diff: string): Promise<ReviewResponse> {
  const res = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diff }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail ?? `request failed (${res.status})`;
    throw new ReviewApiError(detail);
  }
  return res.json();
}

export interface Example {
  label: string;
  blurb: string;
  expectedRisk: "high" | "medium" | "low" | "clean";
  diff: string;
}

export const EXAMPLES: Example[] = [
  {
    label: "Security bug",
    blurb: "Weak hashing + hardcoded secret",
    expectedRisk: "high",
    diff: `diff --git a/auth.py b/auth.py
index 1111111..2222222 100644
--- a/auth.py
+++ b/auth.py
@@ -1,6 +1,9 @@
 import hashlib

+API_KEY = "sk-live-9f8a7b6c5d4e3f2a1b0c"
+
 def check_password(pw: str, stored_hash: str) -> bool:
-    return secure_compare(pw, stored_hash)
+    computed = hashlib.md5(pw.encode()).hexdigest()
+    return computed == stored_hash
`,
  },
  {
    label: "Logic bug",
    blurb: "Off-by-one in a range check",
    expectedRisk: "medium",
    diff: `diff --git a/cart.py b/cart.py
index 3333333..4444444 100644
--- a/cart.py
+++ b/cart.py
@@ -1,5 +1,6 @@
 def apply_discount(items, index):
-    if index < 0 or index >= len(items):
+    if index < 0 or index > len(items):
         raise IndexError("bad item")
     items[index].price *= 0.9
`,
  },
  {
    label: "Small refactor",
    blurb: "Tidy-up with a minor nit",
    expectedRisk: "low",
    diff: `diff --git a/utils.py b/utils.py
index 5555555..6666666 100644
--- a/utils.py
+++ b/utils.py
@@ -1,6 +1,5 @@
 def total(nums):
-    result = 0
-    for n in nums:
-        result = result + n
-    return result
+    return sum(nums)
`,
  },
  {
    label: "Clean change",
    blurb: "Docs fix — expect no issues",
    expectedRisk: "clean",
    diff: `diff --git a/README.md b/README.md
index 7777777..8888888 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,3 @@
 # My Project

-A tool for procesing orders.
+A tool for processing orders.
`,
  },
];

// Purane examples ke liye fallback diff rakha hai
export const EXAMPLE_DIFF = EXAMPLES[0].diff;
