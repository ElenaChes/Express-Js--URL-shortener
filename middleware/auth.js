//[Imports]
const state = require("../services/sharedData");
const respond = require("../utils/respond");

//[Check valid access key]
exports.checkAccess = (req, res, next) => {
  try {
    const access = state?.getAccess();
    if (!state || !access) return respond.error(res, "Server loading, try again later.", 500);
    const key = req.headers?.authorization?.split(" ")?.[1];
    if (!key || key !== access) return respond.error(res, "Unauthorized.", 401);
    next();
  } catch (error) {
    console.log(error);
    return respond.error(res, "Something went wrong while processing request.", 500);
  }
};

//[Verify ownership]
exports.checkOwner = (req, res, next, val) => {
  try {
    const { registeredBy } = req.body;
    if (!registeredBy) return respond.error(res, "Missing `registeredBy`.");
    const appUrl = state.getAppUrl();

    //[Pair exists]
    const pairs = state.getPairs();
    const pair = pairs.find((item) => item.page === val);
    if (!pair) return respond.error(res, `Couldn't find page \`${appUrl}${val}\`.`);

    //[Pair owner or admin]
    if (registeredBy !== pair.registeredBy && !state.isAdmin(registeredBy))
      return respond.error(res, `You lack permissions to edit page \`${appUrl}${val}\`.`, 403);

    //[Save for later]
    res.locals.pair = pair;
    next();
  } catch (error) {
    console.log(error);
    return respond.error(res, "Something went wrong while processing request.", 500);
  }
};
