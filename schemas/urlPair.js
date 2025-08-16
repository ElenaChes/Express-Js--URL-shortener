//[Imports]
const { Schema, model } = require("mongoose"); //database access
const { pageMaxLength, labelMaxLength } = require("../utils/constants");

//[Template for storing data in database]
const urlPairSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    page: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: pageMaxLength,
      match: /^[a-z0-9\-_/]+$/i, //basic validation
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: labelMaxLength,
      match: /^[\w\s\-_/]+$/i, //basic validation
    },
    registeredBy: { type: String, default: "na", trim: true },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

//[Registers in database]
module.exports = model("UrlPair", urlPairSchema, "urlPair");
