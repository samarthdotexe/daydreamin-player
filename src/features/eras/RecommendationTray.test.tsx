import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogPage } from "../../services/catalog/types";
import { QueryProvider } from "../../app/QueryProvider";
import { useEraStore } from "./eraStore";
import { RecommendationTray } from "./RecommendationTray";

const getEraRecommendations = vi.fn();
vi.mock("../../services/catalog/catalogClient", () => ({
  getEraRecommendations: (...args: unknown[]) => getEraRecommendations(...args),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function result(id: string, title: string): CatalogPage {
  return { items: [{ id, provider: "youtube", title, artist: "Artist", artwork: "art.jpg" }] };
}

function renderTray() {
  return render(<QueryProvider><RecommendationTray /></QueryProvider>);
}

describe("RecommendationTray", () => {
  beforeEach(() => {
    getEraRecommendations.mockReset();
    useEraStore.setState(useEraStore.getInitialState(), true);
  });

  it("never renders a stale response from an earlier era", async () => {
    const oldRequest = deferred<CatalogPage>();
    const currentRequest = deferred<CatalogPage>();
    getEraRecommendations.mockImplementation((era: string) =>
      era === "1940s" ? oldRequest.promise : currentRequest.promise,
    );
    renderTray();

    act(() => useEraStore.getState().setEra("1970s"));
    await act(async () => currentRequest.resolve(result("new", "Stayin' Alive")));
    expect(await screen.findByText("Stayin' Alive")).toBeInTheDocument();

    await act(async () => oldRequest.resolve(result("old", "Blue Moon")));
    expect(screen.queryByText("Blue Moon")).not.toBeInTheDocument();
  });

  it.each(["offline", "quota_exceeded"])(
    "keeps existing recommendations visible during a %s failure",
    async (code) => {
      getEraRecommendations
        .mockResolvedValueOnce(result("old", "Blue Moon"))
        .mockRejectedValueOnce(Object.assign(new Error(code), { code }));
      renderTray();
      expect(await screen.findByText("Blue Moon")).toBeInTheDocument();

      act(() => useEraStore.getState().setEra("1970s"));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        code === "offline" ? /offline/i : /search limit/i,
      );
      expect(screen.getByText("Blue Moon")).toBeInTheDocument();
    },
  );

  it("retries only the currently selected era", async () => {
    getEraRecommendations.mockRejectedValue(new Error("offline"));
    const user = userEvent.setup();
    renderTray();
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    act(() => useEraStore.getState().setEra("2000s"));
    await waitFor(() => expect(getEraRecommendations).toHaveBeenCalledWith("2000s", expect.any(AbortSignal)));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(getEraRecommendations.mock.calls.at(-1)?.[0]).toBe("2000s");
  });
});
