const log = require("../modules/log");
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator/check");
const {
    setClientRule,
    setProviderDefaultRule,
    deleteClientRule
} = require("../db/postgres/client-access-rules");

router.post("/client", [
    body("token").exists(),
    body("username").exists().trim().isLength({ min: 5, max: 60 })
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else if (req.query.action === "create") {
        setClientRule(
            req.body.token,
            req.body.username,
            req.body.readable,
            req.body.writable
        ).then(response => {
            if (response.success) {
                res.status(200).send({
                    readable: response.readable,
                    writable: response.writable
                });
            } else {
                res.status(401).send({ reason: response.reason });
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    } else if (req.query.action === "delete") {
        deleteClientRule(req.body.token, req.body.username).then(response => {
            if (response.success) {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        })
    }
});

router.post("/default", [
    body("token").exists(),
    body("readable").exists().isBoolean(),
    body("writable").exists().isBoolean()
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
        setProviderDefaultRule(
            req.body.token,
            req.body.readable,
            req.body.writable
        ).then(response => {
            if (response.success) {
                res.status(200).send({
                    readable: response.readable,
                    writable: response.writable
                });
            } else {
                res.status(401).end();
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    }
});

router.post("/")

module.exports = router;