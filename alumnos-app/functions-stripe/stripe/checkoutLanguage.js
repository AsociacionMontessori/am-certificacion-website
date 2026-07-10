const DEFAULT_CHECKOUT_LANGUAGE = "es";

const STRIPE_LOCALE_BY_LANGUAGE = {
  es: "es",
  en: "en",
  "pt-br": "pt-BR",
};

const PREFIX_BY_LANGUAGE = {
  es: "",
  en: "/en",
  "pt-br": "/pt-br",
};

function resolveCheckoutLanguage(input) {
  const value = String(input || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

  if (value === "pt" || value === "ptbr" || value.startsWith("pt-")) return "pt-br";
  if (value === "en" || value.startsWith("en-")) return "en";
  if (value === "es" || value.startsWith("es-")) return "es";
  return DEFAULT_CHECKOUT_LANGUAGE;
}

function getStripeCheckoutLocale(language) {
  return STRIPE_LOCALE_BY_LANGUAGE[resolveCheckoutLanguage(language)];
}

function normalizePathname(pathname) {
  const raw = String(pathname || "/").trim();
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  if (withLeadingSlash === "/") return "/";
  return withLeadingSlash.replace(/\/+$/, "");
}

function normalizeQuery(query) {
  const raw = String(query || "").trim();
  return raw.replace(/^\?+/, "").replace(/^&+/, "");
}

function buildLocalizedCheckoutUrl({siteUrl, language, pathname, query = ""}) {
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");
  const checkoutLanguage = resolveCheckoutLanguage(language);
  const prefix = PREFIX_BY_LANGUAGE[checkoutLanguage] || "";
  const path = normalizePathname(pathname);
  const queryString = normalizeQuery(query);

  return `${baseUrl}${prefix}${path}${queryString ? `?${queryString}` : ""}`;
}

module.exports = {
  buildLocalizedCheckoutUrl,
  getStripeCheckoutLocale,
  resolveCheckoutLanguage,
};
