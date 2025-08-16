//[Imports]
const express = require("express");
const controller = require("../controllers/redirectController");
const controllerHandler = require("../utils/controllerHandler");

//[Router]
const router = express.Router();

//[Routes]
router.get("/", controllerHandler(controller.homePage)); //Landing page
router.get("/*", controllerHandler(controller.redirectUrl)); //Redirect

//[Export]
module.exports = router;
