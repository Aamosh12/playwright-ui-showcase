# Playwright Automation Showcase Framework

A scalable, production-grade Playwright UI & API automation framework built with TypeScript. Demonstrates enterprise architecture, clean code principles, Strategy Pattern authentication, session state management, and multi-environment execution using **SauceDemo** as a target web application.

> [!NOTE]
> **Framework Scope Note**: Because SauceDemo is a static client-side demonstration website with limited backend functionality and no exposed backend REST APIs, complex API testing and dynamic backend state manipulations are omitted in this showcase. The framework infrastructure (`apiMap.ts`, `BasePage` API assertion helpers, multi-environment API base URL mapping) is fully architected and ready for real-world API integration.

---

## 🚀 Key Features

* **Strategy Pattern Authentication**: Decouples framework-level session management from application-specific login workflows (`AuthStrategy` interface).
* **Robust Session Management**: Custom `SessionManager` handles browser context orchestration, session pre-validation, retry mechanisms, file locking, and Playwright native `storageState()`.
* **Multi-Environment Support**: Configurable environment resolution (`QA` vs `PROD`) with environment variable overrides and fallback configuration maps (`config/testConfig.ts`).
* **Page Object Model (POM)**: Strongly-typed, reusable page objects (`BasePage`, `LoginPage`, `ProductPage`) inheriting common locator resolution and interaction patterns.
* **Responsive Testing Utilities**: Built-in viewport mappings and responsive helpers (`utils/viewports.ts`) supporting Desktop, Laptop, Tablet, and Mobile layouts.
* **Custom Playwright Fixtures**: Extended test runner (`lib/BaseTest.ts` and `utils/sessionUse.ts`) providing pre-instantiated page objects and automatic session restoration.
* **Rich Artifact & Report Capturing**: Captures trace files, failure screenshots, context videos, HTML reports, and Allure reporting compatibility.

---

## 📁 Project Structure

```text
playwright-automation/
├── .github/
│   └── workflows/
│       └── playwright.yml       # GitHub Actions CI pipeline
├── api/
│   └── apiMap.ts                # API endpoint mappings & method specs
├── config/
│   ├── testConfig.ts            # Environment URLs & credential fallbacks
│   └── test-data.ts             # Test data & validation constants
├── lib/
│   └── BaseTest.ts              # Extended Playwright test fixture with POM instances
├── pages/
│   ├── BasePage.ts              # Core Base Page with common actions & assertions
│   ├── Auth/
│   │   ├── LoginPage.ts         # SauceDemo Login Page Object
│   │   └── SauceDemoAuth.ts     # SauceDemo implementation of AuthStrategy
│   └── Inventory/
│       └── ProductPage.ts       # Product inventory Page Object
├── tests/
│   └── Functional/
│       └── Product/
│           └── product.spec.ts  # End-to-end product test suite
├── utils/
│   ├── auth/
│   │   └── AuthStrategy.ts      # Authentication strategy interface
│   ├── SessionManager.ts        # Browser launch & session lifecycle orchestrator
│   ├── global-setup.ts          # Playwright global setup entry point
│   ├── sessionUse.ts            # Session restoration fixture
│   └── viewports.ts            # Viewport size definitions & helpers
├── .gitignore                   # Git ignore rule definitions
├── package.json                 # Project dependencies & scripts
└── playwright.config.ts         # Main Playwright test configuration
```

---

## 🛠️ Setup & Installation

### Prerequisites
* **Node.js**: `v18.x` or higher
* **npm**: `v9.x` or higher

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Aamosh12/playwright-ui-showcase
   cd playwright-automation
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Install Playwright Browsers**:
   ```bash
   npx playwright install --with-deps
   ```

4. **Set Up Environment Variables (`.env`)**:
   Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

---

## ⚙️ Environment Configuration

Environment variables are loaded automatically via `dotenv` in `playwright.config.ts`. If an environment variable is omitted, the framework automatically uses fallback values defined in `config/testConfig.ts`.

### Supported Environment Variables

| Variable Name | Required | Description | Default Fallback (QA / PROD) |
|---|---|---|---|
| `ENV` | Optional | Target execution environment (`QA` or `PROD`). | `QA` |
| `user` | Optional | Username for authentication. | `standard_user` |
| `password` | Optional | Password for authentication. | `secret_sauce` |
| `BASE_URL_QA` | Optional | Base URL for QA environment. | `https://www.saucedemo.com/` |
| `BASE_URL_PROD` | Optional | Base URL for PROD environment. | `https://www.saucedemo.com/` |
| `API_BASE_URL_QA` | Optional | API Base URL for QA environment. | `https://www.saucedemo.com/` |
| `API_BASE_URL_PROD` | Optional | API Base URL for PROD environment. | `https://www.saucedemo.com/` |

### Sample `.env` Configuration

To override default configurations, add any of the following key-value pairs to your local `.env` file:

```env
ENV=QA
user=standard_user
password=secret_sauce
BASE_URL_QA=https://www.saucedemo.com/
BASE_URL_PROD=https://www.saucedemo.com/
```

---

## 🧪 Running Tests

### Standard Test Execution
Run all tests headlessly across Chromium, Firefox, and WebKit:
```bash
npx playwright test
```

### Run Tests in Headed Mode
```bash
npx playwright test --headed
```

### Run Specific Test Suite
```bash
npx playwright test tests/Functional/Product/product.spec.ts
```

### Target Specific Environment
Run tests against the `PROD` environment:
```bash
ENV=PROD npx playwright test
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

---

## 📊 Viewing Reports & Artifacts

### Playwright HTML Report
Generate and view the interactive HTML report after test completion:
```bash
npx playwright show-report
```

### Artifacts Captured
* **Screenshots**: Automatically saved on failure or setup milestone under `artifacts/`
* **Traces & Videos**: Enabled on retries or setup failures under `artifacts/global-setup/`

---

## 🏛️ Architectural Highlights

### 1. Strategy Pattern Authentication
Instead of coupling generic framework logic with specific login forms or cookie keys, authentication logic is decoupled:
* **`AuthStrategy`** defines a strict interface: `login()` and `isAuthenticated()`.
* **`SauceDemoAuth`** implements `AuthStrategy` for SauceDemo.
* To support a new web application, implement a new `AuthStrategy` class without modifying `SessionManager` or setup hooks.

### 2. Session Pre-Validation & Storage State
Before test execution begins:
1. `SessionManager` checks for an existing `storageState` file (`session.json`).
2. It validates whether the saved session is still authenticated.
3. If valid, setup reuses the session without performing unnecessary UI logins.
4. If expired or missing, it triggers a clean login flow and writes the new `storageState`.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
