import {
  APIRequestContext,
  BrowserContext,
  Locator,
  Page,
} from "@playwright/test";
import BasePage from "../BasePage";

export class LoginPage extends BasePage {
  protected readonly request: APIRequestContext | undefined;
  constructor(
    page: Page,
    context: BrowserContext,
    request?: APIRequestContext,
  ) {
    super(page, context);
    this.request = request;
  }

  get usernameInput(): Locator {
    return this.page.locator('[data-test="username"]');
  }

  get passwordInput(): Locator {
    return this.page.locator('[data-test="password"]');
  }

  get loginButton(): Locator {
    return this.page.locator('[data-test="login-button"]');
  }

  async clickLoginBtn(): Promise<void> {
    await this.loginButton.click();
  }

  async fillUsernameField(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillPasswordField(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async login(username: string, password: string): Promise<void> {
    console.log("login is called");
    console.log(username);
    await this.fillUsernameField(username);
    await this.fillPasswordField(password);
    await this.clickLoginBtn();
  }
}
