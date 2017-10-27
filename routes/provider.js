var express = require("express");
var passport = require("../config/providerPassport");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var router = express.Router();

router.use(passport.initialize());

router.post("/login", (req, res, next) => {
    passport.authenticate("provider-login", { session: false }, (err, provider) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!provider) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(provider, err => {
            return err ?
                next(err) :
                res.status(200).json({
                    token: provider.token
                });
        });
    })(req, res, next);
});

router.post("/register", (req, res, next) => {
    passport.authenticate("provider-register", { session: false }, (err, provider) => {
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
                    token: provider.token
                });
        });
    })(req, res, next);
});

module.exports = router;