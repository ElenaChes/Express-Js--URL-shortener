//[Import]
console.time("Load time");
const chalk = require("chalk"); //colorful console.logs
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser"); //better request parsing
//Database access:
const mongoose = require("mongoose"); //database access
require("dotenv").config(); //enables environment variables
const { DBURL } = process.env; //load db password from environment variables
const Access = require("./schemas/access");
const urlPair = require("./schemas/urlpair");
//Info:
const port = 8080;
const appLabel = chalk.green("[App]");
const dbLabel = chalk.magenta("[DB]");

//[Connect to database]
const connectDB = async () => {
  mongoose.set("strictQuery", true); //force to follow schema
  try {
    await mongoose.connect(DBURL).then(() => console.log(dbLabel + " Database connected."));
    return true;
  } catch (error) {
    console.log(dbLabel + chalk.red(" Couldn't connect to database."));
    console.log(error);
    return false;
  }
};
const db = connectDB(); //will load in background

//[Initialize app]
const app = express();
app.set("view engine", "ejs"); //define engine
app.set("views", "views"); //define views location

//[Define aid tools]
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); //define public folder
app.use("/images", express.static(path.join(__dirname, "public/images")));

//[Routes]
const api = require("./controllers/api");
app.use(api.router);
app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/public/images/favicon.ico"));
const redirect = require("./controllers/redirect");
app.use(redirect.router);

app.get("*", (req, res) => res.sendStatus(404));

//[Load Database]
var pairs = [];
async function refreshPairs(url, access) {
  try {
    pairs = (await urlPair.find({})) || [];
    if (url && access) {
      api.prep(pairs, refreshPairs, codes, url, access.key);
      redirect.prep(pairs, refreshPairs, codes, url, access.key);
    } else {
      api.prep(pairs);
      redirect.prep(pairs);
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}
const codes = {
  acc: 202,
  permRedir: 308,
  badReq: 400,
  unaothReq: 401,
  forbiddenReq: 403,
  notFound: 404,
  internalReq: 500,
  busyReq: 503,
};

//[Launch app]
(async () => {
  //wait for db connection to finish
  db.then(async (result) => {
    if (result) {
      let access = await Access.findOne();
      if (access) {
        const url = process.env.LOCAL ? access.urlLocal : access.urlRemote;
        await refreshPairs(url, access);
        app.listen(port);
        console.log(appLabel + " App launched at: " + chalk.yellow(url));
        console.timeEnd("Load time");
      }
    }
  });
})();

//[Process events]
process.on("SIGINT", (signal, code) => {
  mongoose.connection.close(function () {
    console.log(dbLabel + " Database closed.");
    process.exit(128 + signal);
  });
});
process.on("exit", (code) => {
  console.log(appLabel + " App closed.");
});
