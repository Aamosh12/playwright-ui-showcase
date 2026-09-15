import { test as baseTest } from "@playwright/test";
import { LoginPage } from "../pages/Auth/LoginPage";
import { ProductPage } from "../pages/Inventory/ProductPage";

type MyFixtures = {
  loginPage: LoginPage;
  productPage: ProductPage;
};

export const test = baseTest.extend<MyFixtures>({
  loginPage: async ({ page, context }, use) => {
    await use(new LoginPage(page, context));
  },
  productPage: async ({ page, context }, use) => {
    await use(new ProductPage(page, context));
  },
});
