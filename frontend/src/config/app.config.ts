/**
 * Application Configuration
 * Only includes actively used configuration values
 */

export const APP_CONFIG = {
  API: {
    BASE_URL: "https://api.veiben.com",
    ENDPOINTS: {
      COMPREHENSIVE_PRICING: "/api/v1/pricing/",
      ALGORITHM1_SOURCING: "/api/v1/product-sourcing/",
    },
  },

  UI: {
    CURRENCY_FORMAT: {
      style: "currency" as const,
      currency: "USD",
    },
  },
} as const;
