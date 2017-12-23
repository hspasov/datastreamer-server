const express = require("express");
const clientAccessRules = require("../db/postgres/clientAccessRules");
const setClientRule = clientAccessRules.setClientRule;
const setProviderDefaultRule = clientAccessRules.setProviderDefaultRule;
const router = express.Router();

const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

router.post("/client", (req, res, next) => {
    setClientRule(req.body.providerToken, req.body.connectionToken, req.body.readable, req.body.writable).then(newAccessRules => {
        res.status(200).send(newAccessRules);
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/provider", (req, res, next) => {
    setProviderDefaultRule(req.body.token, req.body.readable, req.body.writable).then(newAccessRules => {
        res.status(200).send(newAccessRules);
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    })
});

module.exports = router;