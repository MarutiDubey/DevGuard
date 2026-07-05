import { useState } from "react";

export function Screenshot() {
  const [failed, setFailed] = useState(false);

  // Hide the whole section if the screenshot asset isn't present, so the
  // page never shows a broken-image icon.
  if (failed) return null;

  return (
    <section className="shot">
      <h2>This is what your team sees</h2>
      <p className="shot-sub">A real GitOwl review, posted straight onto a pull request.</p>
      <div className="shot-frame">
        <img
          src="/pr-review.png"
          alt="A GitOwl review comment on a GitHub pull request, showing a risk badge and findings"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    </section>
  );
}
