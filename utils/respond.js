//[Success response template]
exports.success = (res, data, code = 200) => {
  res.status(code).json({ status: "success", data });
};
//[Error response template]
exports.error = (res, message, code = 400) => {
  res.status(code).json({ status: "error", error: { message } });
};
