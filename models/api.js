//[Import]
const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const urlPair = require("../schemas/urlpair");
/*202: Accepted - everything is ok.
/*308: Permanent Redirect - this url will always redirect to this path.
/*400: Bad request - incorrect request syntax.
/*401: Unauthorized - missing identification.
/*403: Forbidden - identification missing access.
/*404: Not found - the url is not recognized
/*500: Internal Server Error - error on my end.
/*503: Service Unavailable - busy processing a request.*/
const acc = 202;
const permRedir = 308;
const badReq = 400;
const unaothReq = 401;
const forbiddenReq = 403;
const notFound = 404;
const internalReq = 500;
const busyReq = 503;

router.get("/api", async (req, res) => {
  try {
    if (!Object.keys(req.query).length) return res.sendStatus(notFound);
    const { url, access } = require("../index");
    const { key, act } = req.query;
    if (!key) return res.sendStatus(unaothReq);
    if (key !== access) return res.json({ status: forbiddenReq, response: `Missing authentication.` });
    if (!act) return res.json({ status: badReq, response: `Missing \`action\` parameter.` });
    /*url - u, page - p, label - l*/
    const { u, p, l, rb } = req.query;
    const { nu, np, nl } = req.query;
    let pair;
    var msg;
    var response;
    if (p) pair = await urlPair.findOne({ page: p });
    switch (act) {
      case "new": //key,act,u,p,l,rb
        if (!u) return res.json({ status: badReq, response: `Missing \`url\` parameter.` });
        if (!p) return res.json({ status: badReq, response: `Missing \`page\` parameter.` });
        if (!l) return res.json({ status: badReq, response: `Missing \`label\` parameter.` });
        if (p.toLocaleLowerCase() === "api") return res.json({ status: badReq, response: `Invalid \`page\` parameter.` });
        if (!pair) {
          //prettier-ignore
          await urlPair.create({ _id: mongoose.Types.ObjectId(), url: u, page: p, label: l, registeredBy: rb || "na", clicks: 0 });
          msg = "Short url has been registered.";
          response = { message: msg, label: l, shortUrl: `${url}${p}`, orgUrl: u, registeredBy: rb };
          return res.json({ status: acc, response: response });
        }
        return res.json({ status: badReq, response: `Page \`${url}${p}\` is already taken.` });
      //[Change page]
      case "page": //key,act,p,np,rb
        if (!p) return res.json({ status: badReq, response: `Missing \`page\` parameter.` });
        if (!pair) return res.json({ status: badReq, response: `Couldn't find page \`${url}${p}\`.` });
        if (!np) return res.json({ status: badReq, response: `Missing \`new page\` parameter.` });
        if (np.toLocaleLowerCase() === "api") return res.json({ status: badReq, response: `Invalid \`page\` parameter.` });
        if (!rb) return res.json({ status: badReq, response: `Missing identification.` });
        if (rb !== pair.registeredBy && rb != access)
          return res.json({ status: forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
        let newpair = await urlPair.findOne({ page: np });
        if (newpair) return res.json({ status: badReq, response: `Page \`${url}${np}\` is already taken.` });
        await pair.updateOne({ page: np });
        msg = "Short url has been updated.";
        //prettier-ignore
        response = { message: msg, label: pair.label, shortUrl: `${url}${np}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
        return res.json({ status: acc, response: response });
      //[Update url]
      case "url": //key,act,p,nu,rb
        if (!p) return res.json({ status: badReq, response: `Missing \`page\` parameter.` });
        if (!pair) return res.json({ status: badReq, response: `Couldn't find page \`${url}${p}\`.` });
        if (!nu) return res.json({ status: badReq, response: `Missing \`new url\` parameter.` });
        if (!rb) return res.json({ status: badReq, response: `Missing identification.` });
        if (rb !== pair.registeredBy && rb != access)
          return res.json({ status: forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
        await pair.updateOne({ url: nu });
        msg = "Short url has been updated.";
        //prettier-ignore
        response = { message: msg, label: pair.label, shortUrl: `${url}${p}`, orgUrl: nu, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
        return res.json({ status: acc, response: response });
      //[Change label]
      case "label": //key,act,p,nl,rb
        if (!p) return res.json({ status: badReq, response: `Missing \`page\` parameter.` });
        if (!pair) return res.json({ status: badReq, response: `Couldn't find page \`${url}${p}\`.` });
        if (!nl) return res.json({ status: badReq, response: `Missing \`new label\` parameter.` });
        if (!rb) return res.json({ status: badReq, response: `Missing identification.` });
        if (rb !== pair.registeredBy && rb != access)
          return res.json({ status: forbiddenReq, response: `You lack permissions to edit page \`${url}${p}\`.` });
        await pair.updateOne({ label: nl });
        msg = "Short url has been updated.";
        //prettier-ignore
        response = { message: msg, label: nl, shortUrl: `${url}${p}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
        return res.json({ status: acc, response: response });
      //[Search in urls]
      case "search": //key,act,rb(,u,p,l)
        let options = {};
        if (!rb) return res.json({ status: badReq, response: `Missing identification.` });
        if (rb != access) options.registeredBy = rb;
        response = await urlPair.find(options);
        const label = l ? l.toLocaleLowerCase() : "";
        const ur = u ? u.toLocaleLowerCase() : "";
        const page = p ? p.toLocaleLowerCase() : "";
        response = response.filter(
          (pair) =>
            pair.label.toLocaleLowerCase().includes(label) &&
            pair.url.toLocaleLowerCase().includes(ur) &&
            pair.page.toLocaleLowerCase().includes(page)
        );
        response = response.map((pair) => {
          //prettier-ignore
          return { label: pair.label, shortUrl: `${url}${pair.page}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
        });
        response = response.sort((a, b) => {
          if (a.label < b.label) return -1;
          if (a.label > b.label) return 1;
          if (a.clicks < b.clicks) return -1;
          if (a.clicks > b.clicks) return 1;
          return 0;
        })

        return res.json({ status: acc, response: response });
      //[Delete a url]
      case "delete": //key,act,p,l,rb
        if (!p) return res.json({ status: badReq, response: `Missing \`page\` parameter.` });
        if (!pair) return res.json({ status: badReq, response: `Couldn't find page \`${url}${p}\`.` });
        if (!l) return res.json({ status: badReq, response: `Missing \`label\` parameter.` });
        if (l !== pair.label) return res.json({ status: badReq, response: `Invalid \`label\` parameter.` });
        if (!rb) return res.json({ status: badReq, response: `Missing identification.` });
        if (rb !== pair.registeredBy && rb != access)
          return res.json({ status: forbiddenReq, response: `You lack permissions to delete page \`${url}${p}\`.` });
        msg = "Short url deleted succesefully.";
        //prettier-ignore
        response = { message: msg, label: pair.label, shortUrl: `${url}${pair.page}`, orgUrl: pair.url, registeredBy: pair.registeredBy, clicks: pair.clicks || 0 };
        await pair.delete();
        return res.json({ status: acc, response: response });
      default:
        return res.json({ status: badReq, response: `Invalid \`action\` parameter.` });
    }
  } catch (error) {
    console.log(error);
  }
  return res.json({ status: internalReq, response: `Something went wrong while processing request.` });
});

//[Give access to other files]
module.exports = router;
