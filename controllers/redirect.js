//[Import]
const express = require("express");
const router = express.Router();
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

router.get("/", async (req, res) => {
  res.render("home", {
    pageTitle: "UrlSh",
    path: "/",
  });
});
router.get("/*", async (req, res) => {
  try {
    if (!pairs || !refreshPairs || !codes || !url || !access) return res.json(codes.internalReq);
    const p = req.originalUrl.slice(1);
    if (!p) return res.sendStatus(codes.notFound);
    let pair = pairs.find((item) => item.page === p);
    if (!pair) return res.sendStatus(codes.notFound);
    await pair.updateOne({ clicks: +pair.clicks + 1 });
    pair.clicks++;
    return res.redirect(codes.permRedir, pair.url);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(codes.internalReq);
});
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
