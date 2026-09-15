import dotenv from "dotenv";

dotenv.config();

export const config = {
  PROD: process.env.BASE_URL_PROD || "https://www.saucedemo.com/",
  QA: process.env.BASE_URL_QA || "https://www.saucedemo.com/",
  API_PROD: process.env.API_BASE_URL_PROD || "https://www.saucedemo.com/",
  API_QA: process.env.API_BASE_URL_QA || "https://www.saucedemo.com/",

  // credentials
  credentials: {
    USER: process.env.user || "standard_user",
    PASSWORD: process.env.password || "secret_sauce",
  },
};

