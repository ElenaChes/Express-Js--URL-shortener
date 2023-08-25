//[Import]
const { Schema, model } = require("mongoose"); //database access

//[Template for storing data in database]
const urlPairSchema = new Schema({
  _id: Schema.Types.ObjectId,
  url: { type: String, required: true },
  page: { type: String, required: true },
  label: String,
  registeredBy: { type: String, default: "na" },
  clicks: { type: Number, default: 0 },
});

//[Registers in database]
module.exports = model("UrlPair", urlPairSchema, "urlPair");
