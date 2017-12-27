const express = require("express");
const path = require("path").posix;
const logger = require("morgan");
const bodyParser = require("body-parser");
const Ddos = require("ddos");
const ddos = new Ddos();

const config = require("./config/config");
const clientRoutes = require("./routes/client");
const providerRoutes = require("./routes/provider");
const clientAccessRulesRoutes = require("./routes/client-access-rules");

const app = express();

app.set("views", path.join(__dirname, "views"));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.use(ddos.express);
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", clientRoutes);
app.use("/provider", providerRoutes);
app.use("/access", clientAccessRulesRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
