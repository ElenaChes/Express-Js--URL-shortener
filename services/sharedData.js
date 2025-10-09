//[Imports]
const Access = require("../schemas/access");
const UrlPair = require("../schemas/urlPair");

//[Data]
let pairs = [];
let access = null;
let appUrl = "";

//[Access to data]
const getPairs = () => pairs;
const getAppUrl = () => appUrl;
const isAdmin = (userId) => access?.admins?.includes(userId);

//[Load Database]
async function refreshPairs() {
  try {
    access = await Access.findOne();
    if (!access) throw new Error("No access file found");
    if (!access.admins || access.admins.length === 0) throw new Error("Access file must include at least one admin.");
    if (!process.env.LOCAL && !access.urlRemote)
      throw new Error(
        "Locally running app: Set LOCAL=true in .env to run locally.\n" +
          "Hosted app: The access file is missing a required 'urlRemote' value."
      );

    pairs = await UrlPair.find({});
    appUrl = process.env.LOCAL ? access.urlLocal : access.urlRemote;
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

//[Export]
module.exports = { getPairs, getAppUrl, isAdmin, refreshPairs };
