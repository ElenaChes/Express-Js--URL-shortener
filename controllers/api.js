//Import]
const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const urlPair = require("../schemas/urlpair");
var pairs;
var refreshPairs;
var codes;
var url;
var access;
/*202: Accepted - everything is ok.
/*308: Permanent Redirect - this url will always redirect to this path.
/*400: Bad request - incorrect request syntax.
/*401: Unauthorized - missing identification.
/*403: Forbidden - identification missing access.
/*404: Not found - the url is not recognized
/*500: Internal Server Error - error on my end.
/*503: Service Unavailable - busy processing a request.*/

router.get("/api", async (req, res) => {
  try {
    if (!pairs || !refreshPairs || !codes || !url || !access)
      return res.json({ status: codes.internalReq, response: `Something went wrong while processing request.` });
    if (!Object.keys(req.query).length) return res.sendStatus(codes.notFound);
    const { key, act } = req.query;
    if (!key) return res.sendStatus(codes.unaothReq);
    if (key !== access) return res.json({ status: codes.forbiddenReq, response: `Missing authentication.` });
    if (!act) return res.json({ status: codes.badReq, response: `Missing \`action\` parameter.` });
    /*url - u, page - p, label - l*/
    const { u, p, l, rb } = req.query;
    const { nu, np, nl } = req.query;
    let pair;
    if (p) pair = pairs.find((item) => item.page === p);
    //prettier-ignore
    switch (act) {
      //[Register new url] - key,act,u,p,l,rb
      case "new": return await apiNew(res, u, p, l, rb, pair);
      //[Change page] - key,act,p,np,rb
      case "page": return await apiEditPage(res, p, np, rb, pair);
      //[Update url] - key,act,p,nu,rb
      case "url": return await apiEditUrl(res, p, nu, rb, pair);
      //[Change label] - key,act,p,nl,rb
      case "label": return await apiEditLabel(res, p, nl, rb, pair);
      //[Search in urls] - key,act,rb(,u,p,l)
      case "search": return await apiSearch(res, u, p, l, rb);
      //[Delete a url] - key,act,p,l,rb
      case "delete": return await apiDelete(res, p, l, rb, pair);
      //[Refresh database] - key,rb
      case "refresh": return await apiRefresh(res, rb);
      default: return res.json({ status: codes.badReq, response: `Invalid \`action\` parameter.` });
    }
  } catch (error) {
    console.log(error);
  }
  return res.json({ status: codes.internalReq, response: `Something went wrong while processing request.` });
});
//[Register new url]
async function apiNew(res, u, p, l, rb, pair) {
  if (!u) return res.json({ status: codes.badReq, response: `Missing \`url\` parameter.` });
  if (!p) return res.json({ status: codes.badReq, response: `Missing \`page\` parameter.` });
  if (!l) return res.json({ status: codes.badReq, response: `Missing \`label\` parameter.` });
  if (p.toLowerCase() === "api") return res.json({ status: codes.badReq, response: `Invalid \`page\` parameter.` });
  if (!pair) {
    //prettier-ignore
    await urlPair.create({ _id: mongoose.Types.ObjectId(), url: u, page: p, label: l, registeredBy: rb || "na", clicks: 0 });
    //[Refresh Database]
    await refreshPairs();
    var msg = "Short url has been registered.";
    var response = { message: msg, label: l, shortUrl: `${url}${p}`, orgUrl: u, registeredBy: rb };
    return res.json({ status: codes.acc, response: response });
  }
  return res.json({ status: codes.badReq, response: `Page \`${url}${p}\` is already taken.` });
}
//[Change page]
async function apiEditPage(res, p, np, rb, pair) {
  if (!p) return res.json({ status: codes.badReq, response: `Missing \`page\` parameter.` });
  if (!pair) return res.json({ status: codes.badReq, response: `Couldn't find page \`${url}${p}\`.` });
  if (!np) return res.json({ status: codes.badReq, response: `Missing \`new page\` parameter.` });
  if (np.toLowerCase() === "api") return res.json({ status: codes.badReq, response: `Invalid \`page\` parameter.` });
  if (!rb) return res.json({ status: codes.badReq, response: `Missing identification.` });
  if (rb !== pair.registeredBy && rb != access)
    return res.json({ status: codes.forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
  let newpair = await urlPair.findOne({ page: np });
  if (newpair) return res.json({ status: codes.badReq, response: `Page \`${url}${np}\` is already taken.` });
  await pair.updateOne({ page: np });
  //[Refresh Database]
  await refreshPairs();
  var msg = "Short url has been updated.";
  //prettier-ignore
  var response = { message: msg, label: pair.label, shortUrl: `${url}${np}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
  return res.json({ status: codes.acc, response: response });
}
//[Update url]
async function apiEditUrl(res, p, nu, rb, pair) {
  if (!p) return res.json({ status: codes.badReq, response: `Missing \`page\` parameter.` });
  if (!pair) return res.json({ status: codes.badReq, response: `Couldn't find page \`${url}${p}\`.` });
  if (!nu) return res.json({ status: codes.badReq, response: `Missing \`new url\` parameter.` });
  if (!rb) return res.json({ status: codes.badReq, response: `Missing identification.` });
  if (rb !== pair.registeredBy && rb != access)
    return res.json({ status: codes.forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
  await pair.updateOne({ url: nu });
  //[Refresh Database]
  await refreshPairs();
  var msg = "Short url has been updated.";
  //prettier-ignore
  var response = { message: msg, label: pair.label, shortUrl: `${url}${p}`, orgUrl: nu, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
  return res.json({ status: codes.acc, response: response });
}
//[Change label]
async function apiEditLabel(res, p, nl, rb, pair) {
  if (!p) return res.json({ status: codes.badReq, response: `Missing \`page\` parameter.` });
  if (!pair) return res.json({ status: codes.badReq, response: `Couldn't find page \`${url}${p}\`.` });
  if (!nl) return res.json({ status: codes.badReq, response: `Missing \`new label\` parameter.` });
  if (!rb) return res.json({ status: codes.badReq, response: `Missing identification.` });
  if (rb !== pair.registeredBy && rb != access)
    return res.json({ status: codes.forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
  await pair.updateOne({ label: nl });
  //[Refresh Database]
  await refreshPairs();
  var msg = "Short url has been updated.";
  //prettier-ignore
  var response = { message: msg, label: nl, shortUrl: `${url}${p}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
  return res.json({ status: codes.acc, response: response });
}
//[Search in urls]
async function apiSearch(res, u, p, l, rb) {
  if (!rb) return res.json({ status: codes.badReq, response: `Missing identification.` });
  const label = l ? l.toLowerCase() : "";
  const ur = u ? u.toLowerCase() : "";
  const page = p ? p.toLowerCase() : "";
  const regBy = rb !== access ? rb.toLowerCase() : "";
  var response = pairs.filter(
    (pair) =>
      pair.label.toLowerCase().includes(label) &&
      pair.url.toLowerCase().includes(ur) &&
      pair.page.toLowerCase().includes(page) &&
      pair.registeredBy.toLowerCase().includes(regBy)
  );
  //prettier-ignore
  response = response.map((pair) => {
    return { label: pair.label, shortUrl: `${url}${pair.page}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
  });
  response = response.sort((a, b) => {
    if (a.label < b.label) return -1;
    if (a.label > b.label) return 1;
    if (a.page < b.page) return -1;
    if (a.page > b.page) return 1;
    if (a.clicks < b.clicks) return -1;
    if (a.clicks > b.clicks) return 1;
    return 0;
  });
  return res.json({ status: codes.acc, response: response });
}
//[Delete a url]
async function apiDelete(res, p, l, rb, pair) {
  if (!p) return res.json({ status: codes.badReq, response: `Missing \`page\` parameter.` });
  if (!pair) return res.json({ status: codes.badReq, response: `Couldn't find page \`${url}${p}\`.` });
  if (!l) return res.json({ status: codes.badReq, response: `Missing \`label\` parameter.` });
  if (l !== pair.label) return res.json({ status: codes.badReq, response: `Invalid \`label\` parameter.` });
  if (!rb) return res.json({ status: codes.badReq, response: `Missing identification.` });
  if (rb !== pair.registeredBy && rb != access)
    return res.json({ status: codes.forbiddenReq, response: `You lack permissions to delete page \`${url}${p}\`.` });
  var msg = "Short url deleted succesefully.";
  //prettier-ignore
  var response = { message: msg, label: pair.label, shortUrl: `${url}${pair.page}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
  await pair.delete();
  //[Refresh Database]
  await refreshPairs();
  return res.json({ status: codes.acc, response: response });
}
//[Refresh database]
async function apiRefresh(res, rb) {
  if (rb != access) return res.json({ status: codes.forbiddenReq, response: `You lack permissions to refresh the database.` });
  const oldPairs = [...pairs];
  await refreshPairs();
  //[Check Changes]
  var aAmount = 0;
  var rAmount = 0;
  var cAmount = 0;
  var p;
  for (const old of oldPairs) {
    p = pairs.find((item) => item.page === old.page);
    if (p) {
      if (old.label !== p.label || old.url !== p.url || old.registeredBy !== p.registeredBy) cAmount++;
    } else rAmount++;
  }
  for (const pair of pairs) {
    p = oldPairs.find((item) => item.page === pair.page);
    if (!p) aAmount++;
  }
  var response = {
    message: [`Databse refreshed succesefully.`, `${aAmount} added.`, `${rAmount} removed.`, `${cAmount} changed.`],
  };
  return res.json({ status: codes.acc, response: response });
}
//aid func
function prep(p, r, c, u, a) {
  pairs = p;
  if (!r || !c || !u || !a) return;
  refreshPairs = r;
  codes = c;
  url = u;
  access = a;
}

//[Give access to other files]
module.exports = { router, prep };
