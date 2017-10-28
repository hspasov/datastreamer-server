const path = require("path");
const express = require("express");
const clientPassport = require("../config/clientPassport");
const router = express.Router();

router.use(clientPassport.initialize());
router.use(clientPassport.session());

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
                    token: client.token
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
                    token: client.token
                });
        });
    })(req, res, next);
});

router.post("/connect", (req, res, next) => {
    clientPassport.authenticate("client-connect", { session: false }, (err, connection) => {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!connection) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(connection, err => {
            return err ?
                next(err) : res.status(200).send({
                    token: connection.token
                });
        });
    })(req, res, next);
});

module.exports = router;
