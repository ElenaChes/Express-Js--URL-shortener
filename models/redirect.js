//[Import]
const express = require("express");
const router = express.Router();
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

router.get("/*", async (req, res) => {
  try {
    const p = req.originalUrl.slice(1);
    if (!p) return res.sendStatus(notFound);
    let pair = await urlPair.findOne({ page: p });
    if (!pair) return res.sendStatus(notFound);
    await pair.updateOne({ clicks: +pair.clicks + 1 });
    return res.redirect(permRedir, pair.url);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(internalReq);
});

//[Give access to other files]
module.exports = router;
