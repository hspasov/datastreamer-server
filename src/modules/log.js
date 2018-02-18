const debug = require("debug");

module.exports = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};