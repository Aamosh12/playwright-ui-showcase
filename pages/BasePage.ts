import { BrowserContext, Locator, Page, Response } from "@playwright/test";
import { getViewportNameFromPage, ViewportKey } from "../utils/viewports";
import apiMap, { HttpMethod } from "../api/apiMap";
import * as allure from "allure-js-commons";

type LocatorValue = Locator | Locator[];

type LocatorMap = Partial<Record<"default" | ViewportKey, LocatorValue>>;

interface ExpectAndClickOptions {
  maxAttempt?: number;
  delay?: number;
  detectApi?: boolean;
  timeout?: number;
}
type ApiAssertion = {
  url: string;
  method: HttpMethod;
  expectedStatus: number;
};
export default class BasePage {
  protected page: Page;
  protected context: BrowserContext;
  protected defaultTimeout: number;
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.defaultTimeout = 20000;
  }

  // Get Viewport name using shared util (viewport.ts)
  #_viewportName(): ViewportKey {
    return getViewportNameFromPage(this.page);
  }

  #_isLocator(value: unknown): value is Locator {
    return (
      value !== null &&
      typeof value === "object" &&
      "click" in value &&
      typeof value.click === "function" &&
      "waitFor" in value &&
      typeof value.waitFor === "function"
    );
  }

  #_resolveLocator(locatororMap?: Locator | LocatorMap): Locator[] | null {
    if (this.#_isLocator(locatororMap)) {
      return [locatororMap];
    }
    const vp = this.#_viewportName();
    const map = locatororMap || {};

    const resolved =
      map[vp] ||
      map.default ||
      map.Desktop ||
      map.Laptop ||
      map.Tablet ||
      map.Mobile;

    if (!resolved) {
      return null;
    }
    return Array.isArray(resolved) ? resolved : [resolved];
  }

  #_getApiAssertion(apiKeyWithMethod: string): ApiAssertion {
    const [apikey, methodOverride] = apiKeyWithMethod.split(":");
    const apiEntry = apiMap[apikey];
    if (!apiEntry) {
      throw new Error(`API Key ${apikey} not found in Api Map`);
    }
    const method = methodOverride
      ? (methodOverride.toUpperCase() as HttpMethod)
      : "GET";
    const expectedStatus = apiEntry.methods[method]?.expectedStatus || 200;
    return {
      url: apiEntry.url,
      method,
      expectedStatus,
    };
  }

  async expectAndClick(
    locatororMap: Locator | LocatorMap,
    alias: string = "element",
    apiKeyWithMethod: string | null = null,
    {
      maxAttempt = 1,
      delay = 500,
      detectApi = true,
      timeout = 10000,
    }: ExpectAndClickOptions = {},
  ) {
    const locators = this.#_resolveLocator(locatororMap);
    if (!locators || !locators.length) {
      throw new Error(`expectAndClick: no locator(s) resolved for [${alias}]`);
    }
    const vp = this.#_viewportName();
    const apiAssertion = apiKeyWithMethod
      ? this.#_getApiAssertion(apiKeyWithMethod)
      : null;
    for (let attempt = 1; attempt <= maxAttempt; attempt++) {
      try {
        const responses = await this.#_clickLocators(
          locators,
          alias,
          vp,
          apiAssertion,
          detectApi,
          timeout,
        );

        this.#_assertApiResponse(responses, apiAssertion);
        await this.#_attachApiDetails(responses);
        return responses;
      } catch (err) {
        if (attempt === maxAttempt) throw err;
        console.warn(
          `Retrying click (${attempt}/${maxAttempt}) for [${alias} @ ${vp}]...`,
        );
        await this.page.waitForTimeout(delay);
      }
    }
  }

  async #_clickLocators(
    locators: Locator[],
    alias: string,
    viewport: string,
    apiAssertion: ApiAssertion | null,
    detectApi: boolean,
    timeout: number,
  ) {
    let response: Response | Response[] | null = null;

    for (let i = 0; i < locators.length; i++) {
      const locator = locators[i];
      const stepAlias =
        locators.length > 1 ? `${alias} (Step ${i + 1})` : alias;

      await locator.waitFor({
        state: "visible",
        timeout: this.defaultTimeout,
      });

      const text =
        (await locator.innerText().catch(() => ""))?.trim() ||
        (await locator.getAttribute("aria-label").catch(() => ""))?.trim() ||
        (await locator.getAttribute("alt").catch(() => ""))?.trim() ||
        stepAlias;

      const isLastLocator = i === locators.length - 1;

      if (detectApi && isLastLocator) {
        response = await this.#_clickAndCaptureApi(
          locator,
          apiAssertion,
          timeout,
        );
      } else {
        await locator.click();
      }
      console.log(`✅ Clicked [${stepAlias} @ ${viewport}] → "${text}"`);
    }
    return response;
  }

  async #_clickAndCaptureApi(
    locator: Locator,
    apiAssertion: ApiAssertion | null,
    timeout: number,
  ) {
    if (apiAssertion) {
      return this.#_captureSpecificApi(locator, apiAssertion, timeout);
    }
    return this.#_captureAllApis(locator);
  }

  async #_captureSpecificApi(
    locator: Locator,
    apiAssertion: ApiAssertion,
    timeout: number,
  ) {
    const waitForResponse = this.page.waitForResponse(
      (response) =>
        response.url().startsWith(apiAssertion.url) &&
        response.request().method().toUpperCase() === apiAssertion.method,
      { timeout },
    );

    const [response] = await Promise.all([waitForResponse, locator.click()]);
    return response;
  }

  async #_captureAllApis(locator: Locator) {
    const collectedResponses: Response[] = [];
    const listener = (response: Response) => {
      if (this.#_isRelevantApi(response)) {
        collectedResponses.push(response);
      }
    };

    this.page.on("response", listener);
    try {
      await locator.click();
      await this.page.waitForTimeout(2000);
    } finally {
      this.page.off("response", listener);
    }
    return collectedResponses;
  }

  #_isRelevantApi(response: Response): boolean {
    const url = new URL(response.url());
    if (url.hostname.includes("cdn.80.lv")) return false;
    if (url.hostname.includes("consent-api.xsolla.com")) return false;

    const ignorePaths = [
      "/api/updpromos",
      "/upload/promo",
      "/upload/post",
      "/upload/vendor",
      "/updpromos",
      "/upload",
    ];
    if (ignorePaths.some((path) => url.href.includes(path))) {
      return false;
    }

    // Assuming that the path starts as /api/.....
    const pathIsApi = url.pathname
      .replace(/^\//, "")
      .toLowerCase()
      .startsWith("api");

    const firstLabel = url.hostname.split(".")[0].toLowerCase();

    // to accept something like api.example.com or payment-api
    const hostIsApi =
      /^api(\d+)?(?:$|-)/.test(firstLabel) || /-api$/.test(firstLabel);

    return pathIsApi || hostIsApi;
  }

  #_assertApiResponse(
    response: Response | Response[] | null,
    apiAssertion: ApiAssertion | null,
  ) {
    if (!response || !apiAssertion) return;

    const responses = Array.isArray(response) ? response : [response];

    const actualResponse = responses[0];

    const actualStatus = actualResponse.status();

    console.log(
      `Captured API: ${actualResponse.url()} ` +
        `Method: ${actualResponse.request().method()} | ` +
        `Status: ${actualStatus}`,
    );

    console.log(
      `Expected API: ${apiAssertion.url} → ` +
        `Method: ${apiAssertion.method} | ` +
        `Status: ${apiAssertion.expectedStatus}`,
    );

    const passed = actualStatus === apiAssertion.expectedStatus;

    console.log(`✅ Assertion API: ${passed ? "Passed" : "Failed"}`);
    if (!passed) {
      throw new Error(` API Assertion failed for ${apiAssertion.url}`);
    }
  }

  async #_attachApiDetails(response: Response | Response[] | null) {
    if (!response) return;
    const responses = Array.isArray(response) ? response : [response];

    for (const res of responses) {
      if (!res) {
        continue;
      }
      await this.#_attachCurl(res);
      await this.#_attachResponseBody(res);
    }
  }

  async #_attachCurl(response: Response) {
    const req = response.request();
    const curl = [
      `curl -X ${req.method()}`,
      ...Object.entries(req.headers()).map(
        ([key, value]) => `-H "${key}: ${value}"`,
      ),
      req.postData() ? `-d '${req.postData()}'` : "",
      `'${response.url()}'`,
    ]
      .filter(Boolean)
      .join("\\\n");
    await allure.attachment(
      "API Request (cURL)",
      Buffer.from(curl, "utf-8"),
      "text/plain",
    );
  }

  async #_attachResponseBody(response: Response) {
    try {
      const bodyText = await response.text();
      let prettyText: string;

      try {
        prettyText = JSON.stringify(JSON.parse(bodyText), null, 2);
      } catch {
        prettyText = bodyText;
      }
      await allure.attachment(
        "API Response",
        Buffer.from(prettyText, "utf-8"),
        "application/json",
      );
    } catch (error) {
      console.warn("Failed to attch response body: ", error);
    }
  }

  async visit(slug: string){
    await this.page.goto(slug);
  }
}
