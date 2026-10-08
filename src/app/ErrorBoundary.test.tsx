import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";

function BrokenView(): never {
  throw new Error("private stack detail");
}

describe("ErrorBoundary", () => {
  it("shows a safe recovery screen without raw error details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reload = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBoundary onReload={reload}><BrokenView /></ErrorBoundary>);

    expect(screen.getByRole("heading", { name: /daydreamin.*drifted off course/i })).toBeInTheDocument();
    expect(screen.queryByText(/private stack detail/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reload experience" }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
