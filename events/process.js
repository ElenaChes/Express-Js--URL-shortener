//[Default shutdown process]
let shutdownHandler = (code) => {
  console.log("[APP] App closed.");
  process.exit(code || 0);
};

//[Update shutdown process]
async function setShutdownHandler(gracefulShutdown) {
  shutdownHandler = gracefulShutdown; //used by index.js
}

//[Process events]
process.on("unhandledRejection", (err) => {
  console.log(err);
  shutdownHandler(1); //optional crash
});
process.on("uncaughtException", (err) => {
  console.log(err);
  shutdownHandler(1); //has to crash
});
process.on("SIGINT", (signal, code) => shutdownHandler(0));

//[Export]
module.exports = { setShutdownHandler };
