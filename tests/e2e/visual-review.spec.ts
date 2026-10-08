import { expect, test } from "@playwright/test";

import { mockExternalServices } from "./helpers";

test.use({ viewport: { width: 1440, height: 900 }, video: "on" });

test("captures every era and the primary motion states", async ({ page }, testInfo) => {
  await mockExternalServices(page);
  await page.goto("/");

  const expectedTrack = {
    "1940s": "Moonlight Serenade",
    "1970s": "Stayin' Alive",
    "2000s": "Crazy in Love",
    "2020s": "Modern Love",
  } as const;
  for (const era of ["1940s", "1970s", "2000s", "2020s"] as const) {
    await page.getByRole("radio", { name: new RegExp(era, "i") }).click();
    await expect(page.getByRole("navigation", { name: "Decade navigation" }).getByRole("status")).toContainText(`${era} selected`);
    await expect(page.getByRole("heading", { name: expectedTrack[era] })).toBeVisible();
    await page.waitForTimeout(350);
    await page.screenshot({ path: testInfo.outputPath(`${era}-desktop.png`), fullPage: true });
  }

  await page.getByRole("button", { name: "Search any song" }).click();
  await page.getByRole("searchbox").fill("Midnight City");
  await expect(page.getByText("Midnight City")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("search-open.png"), fullPage: true });
  await page.getByRole("button", { name: "Play now: Midnight City" }).click();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(page.getByRole("dialog", { name: "Search music" })).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("track-playing.png"), fullPage: true });

  await page.setViewportSize({ width: 320, height: 700 });
  await page.screenshot({ path: testInfo.outputPath("mobile-320.png"), fullPage: true });
});
