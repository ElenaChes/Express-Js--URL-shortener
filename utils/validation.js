//[Imports]
const { reservedPaths } = require("../utils/constants");

//[Check valid page]
exports.validatePage = (page) => {
  if (!page) return null;
  //prettier-ignore
  const normPage = page.trim().replace(/^\/+|\/+$/g, "").toLowerCase();

  //[Reserved page]
  if (reservedPaths.some((prefix) => normPage === prefix || normPage.startsWith(prefix + "/"))) return null;

  //[Invalid path]
  const validChars = /^[a-z0-9\-_/]+$/i;
  const invalidFormat = /\/{2,}/;
  if (!validChars.test(normPage) || invalidFormat.test(normPage)) return null;

  return normPage;
};
//[Check valid URL]
exports.isValidUrl = (url) => {
  const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
  return typeof url === "string" && urlPattern.test(url);
};
