import { describe, expect, it } from "vitest";

import { fallbackDiagram } from "./fallbacks";

describe("offline diagram fallback", () => {
  it("splits common separators without a user-controlled complex regex", () => {
    const result = fallbackDiagram(
      "Start with a problem -> draw the flow, explain the tradeoff → share the result"
    );

    expect(result.mermaid).toContain('A["Start with a problem"]');
    expect(result.mermaid).toContain('B["draw the flow"]');
    expect(result.mermaid).toContain('C["explain the tradeoff"]');
    expect(result.mermaid).toContain('D["share the result"]');
  });

  it("handles the maximum public input size", () => {
    const concept = `${"a".repeat(499)}.${"b".repeat(499)}.${"c".repeat(499)}`;
    const result = fallbackDiagram(concept);

    expect(result.mermaid.length).toBeLessThan(500);
    expect(result.talkTrack).toHaveLength(4);
  });
});
