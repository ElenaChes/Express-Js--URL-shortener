//[Imports]
const express = require("express");
const auth = require("../middleware/auth");
const controller = require("../controllers/apiController");
const controllerHandler = require("../utils/controllerHandler");

//[Router]
const router = express.Router();

//[Middleware]
router.use(auth.checkAccess); //Check valid access key
router.param("page", auth.checkOwner); //Check registerBy is pair owner (only runs on /:page)

//[Routes]
router //
  .route("/urlpairs")
  .get(controllerHandler(controller.listUrlPairs)) //Search
  .post(controllerHandler(controller.createUrlPair)); //Register new pair

router //
  .route("/urlpairs/:page")
  .patch(controllerHandler(controller.updateUrlPair)) //Edit pair
  .delete(controllerHandler(controller.deleteUrlPair)); //Delete pair

router //
  .route("/admin/urlpairs/refresh")
  .get(controllerHandler(controller.refreshUrlPairs)); //Reload pairs

//[Export]
module.exports = router;
