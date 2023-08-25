//[Import]
const { Schema, model } = require("mongoose"); //database access

//[Template for storing data in database]
const accessSchema = new Schema({
  _id: Schema.Types.ObjectId,
  urlLocal: String,
  urlRemote: String,
  key: String,
});

//[Registers in database]
module.exports = model("Access", accessSchema, "access");
