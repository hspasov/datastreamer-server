var passport = require("passport");
var config = require("./config");
var User = require("../models/user");
var errorHandler = require("../modules/errorHandler");

var host = config.host;
var LocalStrategy = require("passport-local").Strategy;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (error, user) {
        if (error) {
            console.error("There was an error accessing the records of" +
                " user with id: " + id);
            return console.log(error.message);
        }
        return done(null, user);
    })
});

passport.use(
    "local-signup",
    new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    },
    function (req, email, password, done) {
        process.nextTick(function () {
            User.findOne({ email: email }, function (error, user) {
                if (error) {
                    return errorHandler(error);
                }
                if (user) {
                    return done(null, false, { errorMsg: "email already exists" });
                }
                else {
                    var newUser = new User();
                    newUser.username = req.body.username;
                    newUser.email = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.save(function (error) {
                        if (error) {
                            console.log(error);
                            if (error.message == "User validation failed") {
                                console.log(error.message);
                                return done(null, false, { errorMsg: "Please fill all fields" });
                            }
                            return errorHandler(error);
                        }
                        console.log("New user successfully created...");
                        console.log("email", email);
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

passport.use(
    "local-login",
    new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    },
        function (req, email, password, done) {
        User.findOne({ email: email }, function (error, user) {
            if (error) {
                return errorHandler(error);
            }
            if (!user) {
                return done(null, false, {
                    errorMsg: "User does not exist, please" +
                    " <a class=\"errorMsg\" href=\"/signup\">signup</a>"
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, { errorMsg: "Invalid password try again" });
            }
            return done(null, user);
        });

    }));

module.exports = passport;