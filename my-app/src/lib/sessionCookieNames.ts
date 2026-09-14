// Cookie name constants shared between the Node-only session services
// (authSession.ts uses crypto, hrkpisSession.ts uses fs) and middleware.ts,
// which runs on the Edge runtime and can't import either of those modules.
export const APP_SESSION_COOKIE_NAME = "app_session";
export const PHP_SESSION_COOKIE_NAME = process.env.PHP_SESSION_COOKIE_NAME || "PHPSESSID";
