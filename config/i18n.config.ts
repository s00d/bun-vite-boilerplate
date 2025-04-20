
export const I18N_CONFIG = {
  /**
   * Absolute path to the directory with translation files (e.g. lang/en/common.json)
   */
  localesPath: "lang",

  /**
   * Default language to use if the request language cannot be determined
   */
  fallbackLng: "en",

  /**
   * Languages to preload at startup
   */
  preload: ["en", "ru"],

  /**
   * Supported languages (used for validation and auto-selection)
   */
  supportedLngs: ["en", "ru"],

  /**
   * Namespaces (translation files), e.g. lang/en/common.json
   */
  namespaces: ["common", "auth", "profile", "meta", "home"],

  /**
   * Default namespace
   */
  defaultNS: "common",

  /**
   * Enable verbose logging (true in development)
   */
  debug: false,
};
