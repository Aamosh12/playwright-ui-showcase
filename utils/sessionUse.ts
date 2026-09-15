import path from "path";
import fs from "fs";
import { ensureToken } from "./global-setup";
import { test as base } from "../lib/BaseTest";

export async function readSession() {
  const tokenPath = path.resolve("./token&cookies/session.json");
  
  // Ensure session token exists AND is verified valid before reading
  await ensureToken();

  if (!fs.existsSync(tokenPath)) {
    throw new Error("Token file not found after executing ensure token");
  }

  const sessionData = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  return sessionData;
}

type SessionFixture = {
  useSession: () => Promise<void>;
};

export const test = base.extend<SessionFixture>({
  useSession: async ({ page, context }, use) => {
    const fn = async () => {
      const sessionData = await readSession();

      // Restore cookies from Playwright storageState
      if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
        await context.clearCookies();
        await context.addCookies(sessionData.cookies);
      }

      // Restore localStorage entries from Playwright storageState origins
      if (sessionData.origins && Array.isArray(sessionData.origins)) {
        for (const origin of sessionData.origins) {
          if (origin.localStorage && Array.isArray(origin.localStorage)) {
            await page.addInitScript(
              ({ entries }) => {
                try {
                  for (const item of entries) {
                    localStorage.setItem(item.name, item.value);
                  }
                } catch {}
              },
              { entries: origin.localStorage }
            );
          }
        }
      }
      console.log("Session restored");
    };
    await use(fn);
  },
});
