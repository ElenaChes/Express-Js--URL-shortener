//[Imports]
const respond = require("../utils/respond");

//[Handle unhandled errors]
module.exports = (err, req, res, next) => {
  console.error(err);
  respond.error(res, "Internal Server Error", 500);
};
