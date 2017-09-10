var express = require("express");
var passport = require("../config/providerPassport");
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

var router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

function isLoggedIn(req, res, next) {
    return req.isAuthenticated() ?
        next() : res.redirect("/login");
}

router.post("/login", (req, res, next) => {
    passport.authenticate("provider-login", (err, provider, info) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!provider) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(provider, err => {
            return err ?
                next(err) :
                res.status(201).json({
                    name: provider.name,
                    providerId: provider._id
                });
        });
    })(req, res, next);
});

router.route("/register").post((req, res, next) => {
    passport.authenticate("provider-register", (err, provider, info) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!provider) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(provider, err => {
            return err ?
                next(err) :
                res.status(201).json({
                    name: provider.name,
                    providerId: provider._id
                });
        });
    })(req, res, next);
});

router.post("/logout", (req, res) => {
    console.log("session will be deleted!!");
    req.logout();
    req.session.destroy();
    return res.status(200);
});

module.exports = router;