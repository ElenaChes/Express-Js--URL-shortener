//[Imports]
const respond = require("../utils/respond");
const { invalidParamError } = require("../utils/constants");

//[Validate input strings]
function trimStrings(inputObject) {
  if (!inputObject || typeof inputObject !== "object") return inputObject; //failsafe

  const sanitizedObject = {};
  for (const key in inputObject) {
    const value = inputObject[key];
    if (typeof value !== "string") return { error: key }; //only strings allowed
    sanitizedObject[key] = value.trim();
  }
  return sanitizedObject;
}
module.exports = (req, res, next) => {
  //[Validate body]
  const trimmedBody = trimStrings(req.body);
  if (trimmedBody?.error) return respond.error(res, invalidParamError(trimmedBody.error));

  //[Validate query]
  const trimmedQuery = trimStrings(req.query);
  if (trimmedQuery?.error) return respond.error(res, invalidParamError(trimmedQuery.error));

  req.body = trimmedBody || {};
  req.query = trimmedQuery || {};
  next();
};
