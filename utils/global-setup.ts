import { BASE_URL } from "../playwright.config";
import { config } from "../config/testConfig";
import path from "path";
import { SessionManager } from "./SessionManager";
import { SauceDemoAuth } from "../pages/Auth/SauceDemoAuth";

function createSessionManager(): SessionManager {
  const authStrategy = new SauceDemoAuth();
  return new SessionManager({
    authStrategy,
    username: config.credentials.USER,
    password: config.credentials.PASSWORD,
    tokenPath: path.resolve("./token&cookies/session.json"),
    lockFilePath: path.resolve("./locks/setup.lock"),
    baseURL: BASE_URL,
    artifactDir: path.resolve("./artifacts/global-setup/user"),
    retries: 3,
  });
}

async function globalSetup() {
  console.log("=== Global Setup Start ===");
  console.log(`BASE_URL: ${BASE_URL}`);

  const manager = createSessionManager();
  await manager.ensureValidSession();

  console.log("=== Global Setup Complete ===");
}

export async function ensureToken() {
  const manager = createSessionManager();
  await manager.ensureValidSession();
}

export default globalSetup;
