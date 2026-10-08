import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthMenu } from "./AuthMenu";
import type { AuthService, AuthUser } from "../../services/firebase/auth";

function service(user: AuthUser | null = null): AuthService {
  return {
    subscribe: vi.fn((listener) => { listener(user); return vi.fn(); }),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
}

describe("AuthMenu", () => {
  it("lets anonymous listeners dismiss sign-in and continue playback", async () => {
    const user = userEvent.setup();
    render(<><div role="region" aria-label="Music player">Still playing</div><AuthMenu service={service()} /></>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(screen.getByRole("button", { name: "Continue without signing in" }));

    expect(screen.queryByText("Save your daydreams")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Music player" })).toHaveTextContent("Still playing");
  });

  it("shows the authenticated listener's name and library access", () => {
    render(<AuthMenu service={service({ id: "u1", displayName: "Samarth" })} onOpenLibrary={vi.fn()} />);

    expect(screen.getByRole("button", { name: /samarth/i })).toBeInTheDocument();
  });

  it("surfaces a Firebase sign-in failure without affecting the player", async () => {
    const auth = service();
    vi.mocked(auth.signIn).mockRejectedValue(new Error("popup blocked"));
    const user = userEvent.setup();
    render(<><div role="region" aria-label="Music player" /><AuthMenu service={auth} /></>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not sign you in/i);
    expect(screen.getByRole("region", { name: "Music player" })).toBeInTheDocument();
  });
});
