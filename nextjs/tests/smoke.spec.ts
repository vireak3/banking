import { expect, test } from "@playwright/test";

test("redirects protected dashboard traffic to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /access your banking workspace/i })).toBeVisible();
});

test("renders registration flow entrypoint", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: /create your blueledger access/i })).toBeVisible();
  await expect(page.getByLabel(/full name/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /create profile/i })).toBeVisible();
});