import { API_BASE_URL } from "../playwright.config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type MethodConfig = Record<HttpMethod, {expectedStatus: number}>

type ApiConfig = {
  url: string;
  methods: MethodConfig
};
const defaultMethods: MethodConfig = {
  GET: { expectedStatus: 200 },
  POST: { expectedStatus: 200 },
  PUT: { expectedStatus: 200 },
  PATCH: { expectedStatus: 200 },
  DELETE: { expectedStatus: 200 },
};

const apiPaths = {
  loginApi: "/api/v1/login", // assuming
};

const apiMap: Record<string, ApiConfig> = {};

for (const [key, path] of Object.entries(apiPaths)) {
  apiMap[key] = {
    url: `${API_BASE_URL}${path}`,
    methods: {
      ...defaultMethods,
    },
  };
}

export default apiMap;