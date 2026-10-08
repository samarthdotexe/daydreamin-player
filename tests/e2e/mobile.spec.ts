import { expect, test } from "@playwright/test";

import { mockExternalServices } from "./helpers";

test.use({ viewport: { width: 320, height: 700 } });

test("mobile search and now-playing remain fully reachable", async ({ page }) => {
  await mockExternalServices(page);
  await page.goto("/");

  await expect(page.getByRole("radiogroup", { name: "Choose a decade" })).toBeVisible();
  await page.getByRole("radio", { name: /2000s/i }).click();
  await page.getByRole("button", { name: /search any song/i }).click();
  await page.getByRole("searchbox").fill("Midnight City");
  await expect(page.getByText("Midnight City")).toBeVisible();
  await page.getByRole("button", { name: "Play now: Midnight City" }).click();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByRole("dialog", { name: "Search music" })).toBeHidden();

  const expand = page.getByRole("button", { name: "Expand player" });
  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Previous track" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next track" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Seek" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "false");
});
