//[Imports]
const state = require("../services/sharedData");
const respond = require("../utils/respond");

//[Landing page]
exports.homePage = (req, res) => {
  res.render("home", { pageTitle: "Url Shortener", path: "/" });
};

//[Redirecting]
exports.redirectUrl = async (req, res) => {
  const pairs = state?.getPairs();
  if (!state || !pairs) return respond.error(res, "Server loading, try again later.", 500);

  //[Extract page from URL]
  const page = decodeURIComponent(req.path.slice(1));
  if (!page) return respond.error(res, "Not Found.", 404);

  //[Find pair]
  const pair = pairs.find((item) => item.page === page);
  if (!pair) return respond.error(res, "Not Found.", 404);

  //[Update stats]
  await pair.updateOne({ clicks: pair.clicks + 1 });
  pair.clicks++;

  //[Redirect]
  return res.redirect(308, pair.url);
};
