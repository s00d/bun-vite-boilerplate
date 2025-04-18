// scripts/processor.js

module.exports = {
  extractCsrf(req, res, context, ee, next) {
    const rawCookie = res.headers["set-cookie"]?.[0] || "";
    context.vars.csrfCookie = rawCookie;
    const match = rawCookie.match(/csrf=([^;]+)/);
    context.vars.csrfToken = match ? match[1] : "";
    return next();
  },

  extractSessionCookie(req, res, context, ee, next) {
    const session = res.headers["set-cookie"]?.[0] || "";
    context.vars.sessionCookie = session;
    return next();
  },
};
