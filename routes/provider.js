var express = require("express");
var passport = require("../config/providerPassport");
var router = express.Router();
var path = require("path");
var errorActions = require("../modules/errorActions");
var providerActions = require("../actions/provider");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var createNewClient = providerActions.createNewClient;
var findClient = providerActions.findClient;
var viewAllClients = providerActions.viewAllClients;
var updateClient = providerActions.updateClient;
var deleteClient = providerActions.deleteClient;

router.use(passport.initialize());
router.use(passport.session());

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect("/login");
}

router.post("/login", function (req, res, next) {
    passport.authenticate("provider-login", function (err, provider, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!provider) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(provider, function (err) {
            if (err) {
                return next(err);
            }
            console.log(req.session);
            return res.status(201).json({
                name: provider.name,
                providerId: provider._id
            });
        });
    })(req, res, next);
});

router.route("/register").post(function (req, res, next) {
    passport.authenticate("provider-register", function (err, provider, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!provider) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(provider, function (err) {
            if (err) {
                console.error(err);
                return next(err);
            }
            return res.status(201).json({
                name: provider.name,
                providerId: provider._id
            });
        });
    })(req, res, next);
});

router.post("/logout", function (req, res) {
    console.log("session will be deleted!!");
    req.logout();
    req.session.destroy();
    return res.status(200);
});

module.exports = router;