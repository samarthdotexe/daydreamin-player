import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { mockExternalServices } from "./helpers";

test.use({ viewport: { width: 640, height: 700 }, reducedMotion: "reduce" });

test("supports zoomed keyboard use, accessibility, and reduced motion", async ({ page }) => {
  await mockExternalServices(page);
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: /1940s/i })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /1970s/i })).toHaveAttribute("aria-checked", "true");

  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await expect(page.getByTestId("vinyl")).toHaveAttribute("data-spinning", "false");
  await expect(page.locator('[aria-label="1970s music scene"] > div').first()).not.toHaveCSS("transform", /translate/);
});
