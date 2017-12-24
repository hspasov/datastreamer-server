const log = require("../modules/log");
const express = require("express");
const router = express.Router();
const {
    setClientRule,
    setProviderDefaultRule,
    getProviderDefaultRule
} = require("../db/postgres/clientAccessRules");

router.post("/client", (req, res, next) => {
    setClientRule(
        req.body.providerToken,
        req.body.connectionToken,
        req.body.readable,
        req.body.writable
    ).then(newAccessRules => {
        res.status(200).send(newAccessRules);
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/provider", (req, res, next) => {
    getProviderDefaultRule(req.body.token).then(result => {
        res.status(200).send(result);
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

router.post("/default", (req, res, next) => {
    setProviderDefaultRule(
        req.body.token,
        req.body.readable,
        req.body.writable
    ).then(newAccessRules => {
        res.status(200).send(newAccessRules);
    }).catch(error => {
        log.error(error);
        res.status(409).send({ message: "fail" });
    });
});

module.exports = router;