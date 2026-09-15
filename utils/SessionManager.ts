import { BrowserContext, chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { AuthStrategy } from "./auth/AuthStrategy";

export interface SessionManagerOptions {
  authStrategy: AuthStrategy;
  username: string;
  password: string;
  tokenPath: string;
  lockFilePath: string;
  baseURL?: string;
  artifactDir?: string;
  retries?: number;
}

/**
 * Application-agnostic session management engine.
 * Responsible for browser context orchestration, session validation,
 * persistence, retries, lock files, tracing, videos, and artifacts.
 */
export class SessionManager {
  private config: SessionManagerOptions;

  constructor(options: SessionManagerOptions) {
    this.config = options;
  }

  /**
   * Validates whether the current browser context holds an active, authenticated session.
   * Delegates application-specific verification to the injected AuthStrategy.
   */
  async isSessionValid(context: BrowserContext): Promise<boolean> {
    const page = await context.newPage();
    try {
      console.log("[SessionManager] Validating session via AuthStrategy...");
      const isValid = await this.config.authStrategy.isAuthenticated(page);
      console.log(`[SessionManager] Session valid: ${isValid}`);
      await page.close();
      return isValid;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[SessionManager] Validation error: ${msg}`);
      try {
        await page.close();
      } catch {}
      return false;
    }
  }

  /**
   * Executes the login workflow via AuthStrategy with retries and saves Playwright storageState.
   */
  async loginAndSaveSession(
    context: BrowserContext,
    retries: number = this.config.retries ?? 3
  ): Promise<boolean> {
    const page = await context.newPage();
    const artDir = this.config.artifactDir || path.resolve("./artifacts/global-setup/user");

    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`[SessionManager] Login attempt ${attempt}/${retries}`);
      try {
        await this.config.authStrategy.login(page, this.config.username, this.config.password);

        // Capture success screenshot artifact
        const screenshotPath = path.join(artDir, "login-success.jpg");
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath });
        console.log(`[SessionManager] Success screenshot saved → ${screenshotPath}`);

        // Persist storage state natively via Playwright API
        fs.mkdirSync(path.dirname(this.config.tokenPath), { recursive: true });
        await context.storageState({ path: this.config.tokenPath });

        // Touch lock file
        fs.mkdirSync(path.dirname(this.config.lockFilePath), { recursive: true });
        fs.writeFileSync(this.config.lockFilePath, "done");

        console.log(`[SessionManager] Storage state saved → ${this.config.tokenPath}`);
        await page.close();
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[SessionManager] Attempt ${attempt} failed: ${msg}`);

        if (attempt === retries) {
          console.error("[SessionManager] All login attempts failed.");
          try {
            const failPath = path.join(artDir, "login-failure.jpg");
            fs.mkdirSync(path.dirname(failPath), { recursive: true });
            await page.screenshot({ path: failPath });
          } catch {}
          try {
            await page.close();
          } catch {}
          return false;
        }
        await page.waitForTimeout(2000);
      }
    }
    return false;
  }

  /**
   * Main lifecycle orchestration:
   * 1. Check existing storage state & lock file.
   * 2. If present, validate session via AuthStrategy. If valid, reuse.
   * 3. If missing or invalid, perform fresh login, capture artifacts/tracing/video, and save state.
   */
  async ensureValidSession(): Promise<void> {
    const { tokenPath, lockFilePath, baseURL } = this.config;
    const artBase = this.config.artifactDir || path.resolve("./artifacts/global-setup/user");

    // Clean orphan lock file if storage state file is missing
    if (!fs.existsSync(tokenPath) && fs.existsSync(lockFilePath)) {
      console.log("[SessionManager] Removing orphan lock file");
      fs.unlinkSync(lockFilePath);
    }

    // Step 1: Validate existing session state
    if (fs.existsSync(tokenPath) && fs.existsSync(lockFilePath)) {
      console.log("[SessionManager] Saved session & lock file found. Validating...");
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        baseURL,
        storageState: tokenPath,
        ignoreHTTPSErrors: true,
        recordVideo: { dir: path.join(artBase, "video") },
      });

      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

      let isValid = false;
      try {
        isValid = await this.isSessionValid(context);
      } catch (e: unknown) {
        console.warn(`[SessionManager] Validation check exception: ${e}`);
      } finally {
        await context.tracing.stop({ path: path.join(artBase, "trace.zip") }).catch(() => {});
        await context.close();
        await browser.close();
      }

      if (isValid) {
        console.log("[SessionManager] Session is valid. Reusing existing storage state.");
        return;
      }
      console.log("[SessionManager] Session is invalid or expired. Performing fresh login...");
    }

    // Step 2: Perform fresh login & save state
    console.log("[SessionManager] Starting fresh login context...");
    const newBrowser = await chromium.launch({ headless: !!process.env.CI });
    const newContext = await newBrowser.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
      recordVideo: { dir: path.join(artBase, "video") },
    });

    fs.mkdirSync(artBase, { recursive: true });
    await newContext.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    try {
      const success = await this.loginAndSaveSession(newContext);
      if (!success) {
        throw new Error("Failed to authenticate and persist session after maximum retries.");
      }
      await newContext.tracing.stop({ path: path.join(artBase, "trace.zip") });
      await newContext.close();
      await newBrowser.close();
      console.log("[SessionManager] Fresh login completed & session locked.");
    } catch (err) {
      await newContext.tracing.stop({ path: path.join(artBase, "trace.zip") }).catch(() => {});
      await newContext.close();
      await newBrowser.close();
      throw err;
    }
  }
}
