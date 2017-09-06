var express = require("express");
var passport = require("../config/clientPassport");
var router = express.Router();
var path = require("path");
var errorActions = require("../modules/errorActions");
var clientActions = require("../actions/client");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var createNewClient = clientActions.createNewClient;
var findClient = clientActions.findClient;
var viewAllClients = clientActions.viewAllClients;
var updateClient = clientActions.updateClient;
var deleteClient = clientActions.deleteClient;

router.use(passport.initialize());
router.use(passport.session());

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect("/login");
}

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/register", function (req, res) {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/home", function (req, res) {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", function (req, res, next) {
    passport.authenticate("local-login", function (err, client, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(client, function (err) {
            if (err) {
                return next(err);
            }
            console.log(req.session);
            return res.status(200).send({message: "success"});
        });
    })(req, res, next);
});


router.route("/register").post(function (req, res, next) {
    passport.authenticate("local-signup", function (err, client, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({message: "fail"});
        }
        req.login(client, function (err) {
            if (err) {
                console.error(err);
                return next(err);
            }
            return res.status(201).send({message: "success"});
        });
    })(req, res, next);
});

router.post("/logout", function (req, res) {
    req.logout();
    req.session.destroy();
    return res.status(200);
});

/*
router.get("/api/clients", function (req, res) {
    return viewAllClients(req, res);
});
router.route("/api/clients/:email")
.get(function (req, res) {
    return findClient(req, res);
}).put(function (req, res) {
    return update(req, res);
}).delete(function (req, res) {
    return deleteClient(req, res);
});
*/

module.exports = router;
