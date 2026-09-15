import { Page } from "@playwright/test";
import { AuthStrategy } from "../../utils/auth/AuthStrategy";
import { LoginPage } from "./LoginPage";

/**
 * SauceDemo-specific authentication implementation.
 * Encapsulates login workflow and authentication state validation for SauceDemo.
 */
export class SauceDemoAuth implements AuthStrategy {
  /**
   * Navigates to SauceDemo login page, fills credentials, clicks login button,
   * and verifies successful login by asserting navigation to /inventory.html.
   */
  async login(page: Page, username: string, password: string): Promise<void> {
    await page.goto("/", { waitUntil: "networkidle" });
    const loginPage = new LoginPage(page, page.context());
    await loginPage.login(username, password);

    // Verify successful authentication by checking for the inventory URL
    await page.waitForURL("**/inventory.html", { timeout: 10_000 });
  }

  /**
   * Determines if the current session is authenticated for SauceDemo.
   * SauceDemo redirects unauthenticated users back to the login page ("/").
   */
  async isAuthenticated(page: Page): Promise<boolean> {
    try {
      await page.goto("/inventory.html", { waitUntil: "networkidle", timeout: 10_000 });
      const currentUrl = page.url();
      return currentUrl.includes("/inventory.html");
    } catch {
      return false;
    }
  }
}
