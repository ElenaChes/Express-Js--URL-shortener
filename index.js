//[Imports]
console.time("Load time");
const chalk = require("chalk"); //colorful console.logs
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config(); //enables environment variables
//Aif functions:
const { setShutdownHandler } = require("./events/process"); //process events
const webhookLog = require("./utils/webhooks"); //webhook logger
//Database access:
const mongoose = require("mongoose"); //database access
const { DBURL } = process.env; //load db password from environment variables
const { getAppUrl, refreshPairs } = require("./services/sharedData");
//Info:
const port = 8080;
const appLabel = chalk.green("[App]");
const dbLabel = require("./events/database"); //attach database events

//[Initialize app]
const app = express();
app.set("view engine", "ejs"); //define engine
app.set("views", "views"); //define views location

//[Define aid tools]
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); //define public folder
app.use("/images", express.static(path.join(__dirname, "public/images")));

//[Sanitize input]
const sanitizeInput = require("./middleware/sanitizeInput");
app.use(sanitizeInput);

//[Routes]
const apiRouter = require("./routes/apiRoutes");
app.use("/api", apiRouter);
app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/public/images/favicon.ico"));
const redirectRouter = require("./routes/redirectRoutes");
app.use("/", redirectRouter);

app.all("*", (req, res) => res.sendStatus(404));

//[Error handling]
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

//[Launch app]
let server;
(async () => {
  try {
    //[Connect to database]
    await mongoose.connection.close();
    mongoose.set("strictQuery", true); //force to follow schema
    await mongoose.connect(DBURL);

    //[Load pairs]
    const loaded = await refreshPairs();
    if (!loaded) {
      await webhookLog(appLabel + " Couldn't load app.");
      console.timeEnd("Load time");
      process.exit(1);
    }

    //[Start server]
    const appUrl = getAppUrl();
    server = app.listen(port, async () => {
      await webhookLog(appLabel + " App is now online.");
      console.log("App launched at: " + chalk.yellow(appUrl));
      console.timeEnd("Load time");
    });
  } catch (error) {
    await webhookLog(dbLabel + chalk.red(" Couldn't connect to database."));
    console.log(error);
    console.timeEnd("Load time");
    process.exit(1);
  }
})();

//[Process events]
setShutdownHandler(async (code) => {
  if (mongoose.connection) {
    mongoose.connection.close();
  }

  await webhookLog(appLabel + " App closed.");
  if (server) server.close(() => process.exit(code || 0));
  else process.exit(code || 0);
});
