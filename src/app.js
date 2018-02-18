const express = require("express");
const path = require("path").posix;
const logger = require("morgan");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");

const clientRoutes = require("./routes/client");
const providerRoutes = require("./routes/provider");
const clientAccessRulesRoutes = require("./routes/client-access-rules");

const app = express();

app.set("views", path.join(__dirname, "views"));

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
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
