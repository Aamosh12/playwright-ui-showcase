import { BrowserContext, Locator, Page } from "@playwright/test";
import BasePage from "../BasePage";

export class ProductPage extends BasePage {
  constructor(page: Page, context: BrowserContext) {
    super(page, context);
  }

  get pageTitle(): Locator {
    return this.page.getByTestId("title");
  }

  async visitInventory() {
    await this.visit("/inventory.html");
  }
}
