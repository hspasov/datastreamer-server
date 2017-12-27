const log = require("../modules/log");
var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator/check");
const PasswordValidator = require("password-validator");
const { login, register, changePassword, deleteAccount } = require("../db/postgres/provider");

const password = new PasswordValidator();
password.min(8).max(100).digits().lowercase().uppercase();
const passwordCheck = value => {
    if (!password.validate(value)) {
        throw new Error("Password must be between 8 and 100 characters long, must have uppercase, lowercase letters and digits.");
    }
    return true;
};

router.post("/login", [
    body("username").exists().trim().isLength({ min: 5, max: 60 }),
    body("password").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(404).end();
    } else {
        login(req.body.username.toLowerCase(), req.body.password).then(response => {
            if (response.success) {
                res.status(200).json({
                    token: response.token,
                    username: response.username,
                    readable: response.readable,
                    writable: response.writable,
                    banned: response.banned
                });
            } else {
                res.status(404).end();
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    }
});

router.post("/register", [
    body("username").exists().trim().isLength({ min: 5, max: 60 }),
    body("password").exists().custom(passwordCheck),
    body("clientConnectPassword").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
        register(req.body.username, req.body.password, req.body.clientConnectPassword).then(response => {
            if (response.success) {
                res.status(201).json({
                    token: response.token,
                    username: response.username,
                    readable: response.readable,
                    writable: response.writable
                });
            } else {
                res.status(412).end();
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    }
});

router.post("/account", [
    body("token").exists(),
    body("oldPassword").exists().isLength({ max: 100 }),
    body("newPassword").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
        changePassword(req.body.token, req.body.oldPassword, req.body.newPassword).then(response => {
            if (response.success) {
                res.status(201).send({ token: response.token });
            } else if (response.reason === "token") {
                res.status(401).end();
            } else if (response.reason === "credentials") {
                res.status(404).end();
            } else {
                throw `Invalid response.reason: ${response.reason}`;
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    }
    });

router.post("/delete", [
    body("token").exists(),
    body("password").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
        deleteAccount(req.body.token, req.body.password).then(response => {
            if (response.success) {
                res.status(200).end();
            } else if (response.reason === "token") {
                res.status(401).end();
            } else if (response.reason === "credentials") {
                res.status(404).end();
            } else {
                throw `Invalid response.reason: ${response.reason}`;
            }
        }).catch(error => {
            log.error(error);
            res.status(500).end();
        });
    }
});

module.exports = router;