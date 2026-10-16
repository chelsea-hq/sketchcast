import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CreatorHome from "./CreatorHome";

const noAction = () => {};
const common = {
  projects: [], activeProjectId: "", takeCounts: {},
  onOpen: noAction, onCreate: noAction, onOpenSync: noAction, onOpenSettings: noAction,
};

describe("creator home storage readiness", () => {
  it("shows a persistent failure and retry action when storage cannot open", () => {
    const markup = renderToStaticMarkup(
      <CreatorHome {...common} recoveryReady={false} recoveryFailed onRetryRecovery={noAction} />
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Local storage is unavailable");
    expect(markup).toContain("Retry local storage");
    expect(markup).not.toContain("Recovery Vault ready on this device");
    expect(markup).not.toContain("Opening your local projects");
    // All three creation actions remain disabled until persistence is ready.
    expect(markup.match(/disabled=""/g)).toHaveLength(3);
  });

  it("keeps the normal ready state free of storage-error guidance", () => {
    const markup = renderToStaticMarkup(
      <CreatorHome {...common} recoveryReady recoveryFailed={false} onRetryRecovery={noAction} />
    );
    expect(markup).toContain("Recovery Vault ready on this device");
    expect(markup).not.toContain('role="alert"');
    expect(markup).not.toContain("Retry local storage");
  });
});
