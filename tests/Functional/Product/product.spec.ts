import { expect } from "@playwright/test";
import { test } from "../../../utils/sessionUse";
import { Desktop, setViewport } from "../../../utils/viewports";

test.describe("Product Related Tests", () => {
  test.beforeEach(async ({ page, useSession, context }) => {
    await setViewport(page, Desktop.size);
    console.log("Viewport Set");
    await useSession();
  });

  test("Testing framework", async ({ page, productPage, context }) => {
    await productPage.visitInventory();
    await page.screenshot({ path: "./test.jpg" });
    console.log("Job Done");
    console.log(page.url());
    expect(page.url()).toContain("inventory");
  });
});
