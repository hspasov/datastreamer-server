var express = require("express");
var passport = require("../config/passport");
var router = express.Router();
var path = require("path");
var errorHandler = require("../modules/errorHandler");
var authentication = require("../modules/authentication");

var validationError = authentication.validationError;
var createNewUser = authentication.createNewUser;
var findUser = authentication.findUser;
var viewAllUsers = authentication.viewAllUsers;
var updateUser = authentication.updateUser;
var deleteUser = authentication.deleteUser;

router.use(passport.initialize());
router.use(passport.session());

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect("/login");
}

router.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.post("/login", function (req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!user) {
            return res.status(409).send({ message: "fail" });
        }
        req.login(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.status(200).send({message: "success"});
        });
    })(req, res, next);
});


router.route('/register').post(function (req, res, next) {
    passport.authenticate('local-signup', function (err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        if (!user) {
            return res.status(409).send({message: "fail"});
        }
        req.login(user, function (err) {
            if (err) {
                console.error(err);
                return next(err);
            }
            return res.status(201).send({message: "success"});
        });
    })(req, res, next);
});

router.post('/logout', function (req, res) {
    req.logout();
    req.session.destroy();
    return res.status(200);
});

/*
router.get('/api/users', function (req, res) {
    return viewAllUsers(req, res);
});
router.route('/api/users/:email')
.get(function (req, res) {
    return findUser(req, res);
}).put(function (req, res) {
    return update(req, res);
}).delete(function (req, res) {
    return deleteUser(req, res);
});
*/

module.exports = router;
