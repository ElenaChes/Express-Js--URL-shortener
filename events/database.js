//[Imports]
const chalk = require("chalk");
const { connection } = require("mongoose"); //database access
const webhookLog = require("../utils/webhooks");
//Info:
const dbLabel = chalk.magenta("[DB]");

//[Database events]
connection.on("connecting", () => {
  console.log(dbLabel + " Database connecting...");
});

connection.on("connected", async () => {
  await webhookLog(dbLabel + " Database connected.");
});

connection.on("err", async (error) => {
  console.error(error);
  await webhookLog(dbLabel + " connection error.");
});

connection.on("disconnected", async () => {
  await webhookLog(dbLabel + " Database disconnected.");
});

//[Export]
module.exports = dbLabel;
