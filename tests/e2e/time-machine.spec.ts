import { expect, test } from "@playwright/test";

import { mockExternalServices } from "./helpers";

test("travels between decades without interrupting playback", async ({ page }) => {
  await mockExternalServices(page);
  await page.goto("/");

  await page.getByRole("radio", { name: /1970s/i }).click();
  await expect(page.getByText("Stayin' Alive")).toBeVisible();
  await page.getByRole("button", { name: "Play now: Stayin' Alive" }).click();
  await expect(page.getByRole("region", { name: "Music player" }).getByRole("button", { name: "Pause" })).toBeVisible();

  await page.getByRole("radio", { name: /2000s/i }).click();
  await expect(page.getByText("Crazy in Love")).toBeVisible();
  await page.getByRole("button", { name: "Add to queue: Crazy in Love" }).click();
  await expect(page.getByRole("region", { name: "Music player" }).getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Music player" }).getByText("Stayin' Alive")).toBeVisible();

  await page.evaluate(() => {
    (window as unknown as { __daydreaminPlayers: Array<{ __end(): void }> }).__daydreaminPlayers[0].__end();
  });
  await expect(page.getByRole("region", { name: "Music player" }).getByText("Crazy in Love")).toBeVisible();
});

test("removing the current queue item preserves pause intent and stops the final track", async ({ page }) => {
  await mockExternalServices(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Play now: Moonlight Serenade" }).click();
  await page.getByRole("radio", { name: /1970s/i }).click();
  await page.getByRole("button", { name: "Add to queue: Stayin' Alive" }).click();
  const player = page.getByRole("region", { name: "Music player" });
  await player.getByRole("button", { name: "Pause", exact: true }).click();

  await player.getByRole("button", { name: "Show queue" }).click();
  await page.getByRole("button", { name: "Remove Moonlight Serenade from queue" }).click();
  await expect(player.locator("strong").filter({ hasText: "Stayin' Alive" })).toBeVisible();
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window as unknown as { __daydreaminPlayers: Array<{ state: number }> }
  ).__daydreaminPlayers[0].state)).toBe(5);

  await page.getByRole("button", { name: "Remove Stayin' Alive from queue" }).click();
  await expect(player.getByText("Nothing playing")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    window as unknown as { __daydreaminPlayers: Array<{ state: number }> }
  ).__daydreaminPlayers[0].state)).toBe(2);
});
