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

router.route(["/login", "/register", "/home", "/"]).get((req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", (req, res, next) => {
    clientPassport.authenticate("client-login", { session: false }, (err, client) => {
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


router.post("/register", (req, res, next) => {
    clientPassport.authenticate("client-register", { session: false }, (err, client) => {
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

module.exports = router;
