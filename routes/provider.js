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
    // There is no login. Provider account is destroyed
    // at the end of the session.
    return res.redirect("/register");
}

/*
 * No need for GET requests. Provider is an electron app.
 */

router.route("/register").post(function (req, res, next) {
    passport.authenticate("local-signup", function (err, provider, info) {
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
                message: "success",
                name: provider.name,
                providerId: provider._id
            });
        });
    })(req, res, next);
});

router.post("/logout", function (req, res) {
    req.logout();
    req.session.destroy();
    return res.status(200);
});

module.exports = router;