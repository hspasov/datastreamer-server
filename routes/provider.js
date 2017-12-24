const log = require("../modules/log");
var express = require("express");
var router = express.Router();
const { login, register } = require("../db/postgres/provider");

router.post("/login", (req, res, next) => {
    login(req.body.username, req.body.password).then(response => {
        if (response.success) {
            res.status(200).json({
                token: response.token,
                username: response.username
            });
        } else {
            res.status(404).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/register", (req, res, next) => {
    register(req.body.username, req.body.password, req.body.clientConnectPassword).then(response => {
        if (response.success) {
            res.status(201).json({
                token: response.token,
                username: response.username
            });
        } else {
            res.status(412).end();
        }
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

module.exports = router;