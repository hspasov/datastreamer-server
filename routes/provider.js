var express = require("express");
const provider = require("../db/postgres/provider");
const register = provider.register;
const login = provider.login;
var router = express.Router();

router.post("/login", (req, res, next) => {
    login(req.body.username, req.body.password).then(response => {
        res.status(200).json({
            token: response.token,
            username: response.username
        });
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/register", (req, res, next) => {
    register(req.body.username, req.body.password, req.body.clientConnectPassword).then(response => {
        res.status(201).json({
            token: response.token,
            username: response.username
        });
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

module.exports = router;