//[Imports]
const state = require("../services/sharedData");
const respond = require("../utils/respond");
const UrlPair = require("../schemas/urlPair");
//[Aid functions]
const { validatePage, isValidUrl } = require("../utils/validation");
const { pageMaxLength, labelMaxLength } = require("../utils/constants");
const { missingParamError, invalidParamError, tooLongError, urlErrorHint, pageErrorHint } = require("../utils/constants");
const { formatPair } = require("../utils/format");

//[Fetch pairs based on query parameters]
exports.listUrlPairs = async (req, res) => {
  const { url = "", page = "", label = "", registeredBy, showAll } = req.query;
  if (!registeredBy) return respond.error(res, "Missing identification.");
  const isAdmin = state.isAdmin(registeredBy);
  const pairs = state.getPairs();

  //[Prepare query]
  const search = {
    url: url.toLowerCase(),
    page: validatePage(page) || "",
    label: label.toLowerCase(),
    registeredBy: isAdmin & (showAll == "true") ? null : registeredBy.toLowerCase(), //admin bypass ownership check
  };

  //[Search]
  const filtered = pairs.filter((pair) => {
    if (search.label && !pair.label.toLowerCase().includes(search.label)) return false;
    if (search.url && !pair.url.toLowerCase().includes(search.url)) return false;
    if (search.page && !pair.page.toLowerCase().includes(search.page)) return false;
    if (search.registeredBy && pair.registeredBy.toLowerCase() !== search.registeredBy) return false;
    return true;
  });

  //[Sort]
  filtered.sort((a, b) => a.label.localeCompare(b.label) || a.page.localeCompare(b.page) || a.clicks - b.clicks);

  //[Respond]
  return respond.success(res, filtered.map(formatPair));
};
//[Register new pair]
exports.createUrlPair = async (req, res) => {
  let { url, page, label, registeredBy } = req.body;

  //[Missing parameters]
  if (!url) return respond.error(res, missingParamError("url"));
  if (!page) return respond.error(res, missingParamError("page"));
  if (!label) return respond.error(res, missingParamError("label"));

  //[Check invalid URL]
  if (!isValidUrl(url)) return respond.error(res, invalidParamError("url", urlErrorHint));

  //[Check invalid parameters]
  page = validatePage(page);
  if (!page) return respond.error(res, invalidParamError("page", pageErrorHint));
  if (page.length > pageMaxLength) return respond.error(res, tooLongError("page"));
  if (label.length > labelMaxLength) return respond.error(res, tooLongError("label"));

  //[Check page taken]
  const pairs = state.getPairs();
  if (pairs.some((item) => item.page === page)) return respond.error(res, invalidParamError("page", pageErrorHint));

  //[Create pair]
  await UrlPair.create({ url, page, label, registeredBy });
  await state.refreshPairs();

  //[Respond]
  const data = formatPair({ label, page, url, registeredBy });
  return respond.success(res, { message: "Short url has been registered.", ...data }, 201);
};
//[Edit existing pair]
exports.updateUrlPair = async (req, res) => {
  let { newUrl, newPage, newLabel } = req.body;
  const pair = res.locals.pair;
  if (!pair) return respond.error(res, "Something went wrong while processing request.", 500);

  //[Missing parameters]
  if (!newUrl && !newPage && !newLabel)
    return respond.error(res, "Wasn't given parameters to update, supply `newUrl`, `newPage` or `newLabel`.");

  //[Invalid parameters]
  if (newUrl && !isValidUrl(newUrl)) return respond.error(res, invalidParamError("newUrl", urlErrorHint));
  if (newLabel && newLabel.length > labelMaxLength) return respond.error(res, tooLongError("newLabel"));

  //[Taken page or invalid page]
  if (newPage && newPage != pair.page) {
    newPage = validatePage(newPage);
    if (!newPage) return respond.error(res, invalidParamError("newPage", pageErrorHint));
    if (newPage.length > pageMaxLength) return respond.error(res, tooLongError("newPage"));
    const newPair = await UrlPair.findOne({ page: newPage });
    if (newPair) return respond.error(res, invalidParamError("newPage", pageErrorHint));
  }

  //[Prepare parameters]
  newUrl = newUrl || pair.url;
  newPage = newPage || pair.page;
  newLabel = newLabel || pair.label;

  //[Update]
  await pair.updateOne({ url: newUrl, page: newPage, label: newLabel });
  await state.refreshPairs();

  //[Respond]
  const data = formatPair({ label: newLabel, page: newPage, url: newUrl, registeredBy: pair.registeredBy, clicks: pair.clicks });
  return respond.success(res, { message: "Pair has been updated.", ...data });
};
//[Delete existing pair]
exports.deleteUrlPair = async (req, res) => {
  const { label } = req.body;
  const pair = res.locals.pair;
  if (!pair) return respond.error(res, "Something went wrong while processing request.", 500);

  //[Missing parameters]
  if (!label) return respond.error(res, missingParamError("label"));

  //[Invalid parameters]
  if (label !== pair.label) return respond.error(res, invalidParamError("label"));

  //[Delete]
  await pair.deleteOne();
  await state.refreshPairs();

  //[Respond]
  return respond.success(res, { message: "Short url deleted successfully." });
};

//[Admin: Reload pairs from database]
exports.refreshUrlPairs = async (req, res) => {
  const { registeredBy } = req.query;

  //[Check admin]
  if (!state.isAdmin(registeredBy)) return respond.error(res, "You lack permissions to refresh the database.", 403);

  //[Refresh]
  const oldPairs = Object.fromEntries(state.getPairs().map((p) => [p.page, p]));
  await state.refreshPairs();
  const newPairs = Object.fromEntries(state.getPairs().map((p) => [p.page, p]));

  //[Check Changes]
  let added = 0;
  let removed = 0;
  let changed = 0;
  for (const [page, oldPair] of Object.entries(oldPairs)) {
    const newPair = newPairs[page];
    if (!newPair) removed++;
    else if (oldPair.label !== newPair.label || oldPair.url !== newPair.url || oldPair.registeredBy !== newPair.registeredBy)
      changed++;
  }
  for (const page of Object.keys(newPairs)) {
    if (!oldPairs[page]) added++;
  }

  //[Respond]
  return respond.success(res, {
    message: ["Database refreshed successfully.", `${added} added.`, `${removed} removed.`, `${changed} changed.`].join("\n"),
  });
};
