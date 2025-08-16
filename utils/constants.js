//[Constants]
exports.pageMaxLength = 50;
exports.labelMaxLength = 80;
exports.reservedPaths = ["api", "admin"]; //Reserved paths for API endpoints

//[Errors]
exports.missingParamError = (field) => `Missing \`${field}\` parameter.`;
exports.invalidParamError = (field, hint = "") => `Invalid \`${field}\` parameter${hint ? ", " + hint : "."}`;
exports.tooLongError = (field) => `Parameter \`${field}\` is too long.`;
exports.urlErrorHint = "make sure it's a valid URL.";
exports.pageErrorHint = "make sure it only contains allowed characters and is not already taken. Change it and try again.";
