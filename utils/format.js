//[Imports]
const state = require("../services/sharedData");

//[Format URL pair for response]
exports.formatPair = ({ label, page, url, registeredBy, clicks }) => ({
  label,
  shortUrl: `${state.getAppUrl()}${page}`,
  orgUrl: url,
  registeredBy,
  clicks: clicks || 0,
});
