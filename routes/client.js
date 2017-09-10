const express = require("express");
const clientPassport = require("../config/clientPassport");
const router = express.Router();
const path = require("path");
const errorActions = require("../modules/errorActions");
const clientActions = require("../actions/client");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

const createNewClient = clientActions.createNewClient;
const findClient = clientActions.findClient;
const viewAllClients = clientActions.viewAllClients;
const updateClient = clientActions.updateClient;
const deleteClient = clientActions.deleteClient;

router.use(clientPassport.initialize());
router.use(clientPassport.session());

function isLoggedIn(req, res, next) {
    return req.isAuthenticated() ?
        next() : res.redirect("/login");
}

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", (req, res, next) => {
    clientPassport.authenticate("client-login", (err, client, info) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(client, err => {
            return err ?
                next(err) : res.status(200).send({
                    email: client.email,
                    clientId: client._id
                });
        });
    })(req, res, next);
});


router.route("/register").post((req, res, next) => {
    clientPassport.authenticate("client-register", (err, client, info) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!client) {
            return res.status(409).send({message: "fail"});
        }
        req.login(client, err => {
            return err ?
                next(err) : res.status(201).send({
                    email: client.email,
                    clientId: client._id
                });
        });
    })(req, res, next);
});

router.post("/logout", (req, res) => {
    req.logout();
    req.session.destroy();
    return res.status(200);
});

/*
router.get("/api/clients", (req, res) => {
    return viewAllClients(req, res);
});
router.route("/api/clients/:email")
.get((req, res) => {
    return findClient(req, res);
}).put((req, res) => {
    return update(req, res);
}).delete((req, res) => {
    return deleteClient(req, res);
});
*/

module.exports = router;
