import { Page } from "@playwright/test";

/**
 * Contract for application authentication strategies.
 * Decouples generic session management from application-specific authentication logic.
 */
export interface AuthStrategy {
  /**
   * Performs application-specific login workflow using credentials.
   * @param page Playwright Page instance
   * @param username User credential
   * @param password Password credential
   */
  login(page: Page, username: string, password: string): Promise<void>;

  /**
   * Determines whether the current browser session is authenticated.
   * @param page Playwright Page instance
   * @returns Promise resolving to true if authenticated, false otherwise.
   */
  isAuthenticated(page: Page): Promise<boolean>;
}
