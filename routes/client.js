const log = require("../modules/log");
const path = require("path").posix;
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator/check");
const PasswordValidator = require("password-validator");
const { login, register, connect, changePassword, deleteAccount } = require("../db/postgres/client");
const { invalidateToken } = require("../db/redis/peer-session");

const password = new PasswordValidator();
password.min(8).max(100).digits().lowercase().uppercase();
const passwordCheck = value => {
    if (!password.validate(value)) {
        throw new Error("Password must be between 8 and 100 characters long, must have uppercase, lowercase letters and digits.");
    }
    return true;
};

router.route(["/login", "/register", "/home", "/connect", "/settings", "/",]).get((req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", [
    body("username").exists().trim().isLength({ min: 5, max: 60 }),
    body("password").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(404).end();
    } else {
        login(req.body.username.toLowerCase(), req.body.password).then(response => {
            if (response.success) {
                res.status(200).send({
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
    }
});


router.post("/register", [
    body("username").exists().trim().isLength({ min: 5, max: 60 }),
    body("password").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).end();
    } else {
        register(req.body.username.toLowerCase(), req.body.password).then(response => {
            if (response.success) {
                res.status(201).send({
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
    }
});

router.post("/connect", [
    body("token").exists(),
    body("username").exists().trim().isLength({ min: 5, max: 60 }),
    body("password").exists().custom(passwordCheck)
], (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(404).end();
    } else {
        connect(req.body.token, req.body.username.toLowerCase(), req.body.password).then(response => {
            if (response.success) {
                res.status(200).send({
                    token: response.token,
                    username: response.username,
                    readable: response.readable,
                    writable: response.writable
                });
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

router.post("/disconnect", (req, res, next) => {
    invalidateToken(req.body.connectionToken).then(success => {
        if (!success) {
            log.info("Could not invalidate token.");
            log.verbose(req.body.connectionToken);
        }
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

router.post("/logout", (req, res, next) => {
    invalidateToken(req.body.clientToken).then(success => {
        if (!success) {
            log.info("Could not invalidate token.");
            log.verbose(req.body.clientToken);
        }
        return invalidateToken(req.body.connectionToken);
    }).then(success => {
        if (!success) {
            log.verbose("Client was not connected to provider when requested to log out.");
        }
        res.status(200).send();
    }).catch(error => {
        log.error(error);
        res.status(500).end();
    });
});

module.exports = router;