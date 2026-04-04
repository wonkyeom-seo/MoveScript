import { test, expect } from "@playwright/test";

const isReadyForFullE2E = process.env.E2E_RUN_FULL === "true";

test.describe("MoveScript smoke flow", () => {
  test.skip(!isReadyForFullE2E, "환경 변수와 백엔드 계정이 준비된 경우에만 실행합니다.");

  test("redirects private routes to sign-in and renders auth screen", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByText("Firebase Authentication으로 Google 또는 이메일 로그인을 처리합니다.")).toBeVisible();
  });
});
