//[Imports]
const { Schema, model } = require("mongoose"); //database access

//[Template for storing data in database]
const accessSchema = new Schema(
  {
    urlLocal: { type: String, default: "http://localhost:8080/" },
    urlRemote: String,
    key: { type: String, required: true },
    admins: { type: [String], default: [] },
  },
  { versionKey: false }
);

//[Registers in database]
module.exports = model("Access", accessSchema, "access");
