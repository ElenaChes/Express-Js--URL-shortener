//[Import]
const chalk = require("chalk"); //colorful console.logs
const express = require("express");
const bodyParser = require("body-parser"); //better request parsing
//Database access:
const mongoose = require("mongoose"); //database access
require("dotenv").config(); //enables environment variables
const { DBURL } = process.env; //load db password from environment variables
const Access = require("./schemas/access");
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

//[Define aid tools]
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//[Routes]
const api = require("./models/api");
app.use(api);
app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/public/images/favicon.ico"));
const redirect = require("./models/redirect");
app.use(redirect);

app.get("*", function (req, res) {
  return res.sendStatus(404);
});

//[Launch app]
(async () => {
  //wait for db connection to finish
  db.then(async (result) => {
    if (result) {
      let access = await Access.findOne();
      if (access) {
        const url = process.env.LOCAL ? access.urlLocal : access.urlRemote;
        module.exports = { url, access: access.key };
        app.listen(port);
        console.log(appLabel + " App launched at: " + chalk.yellow(url));
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
