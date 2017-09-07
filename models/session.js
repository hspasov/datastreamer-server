var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var SessionSchema = mongoose.Schema({
    /* type: either "provider" or "client" */
    type: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

var SessionModel = mongoose.model('Session', SessionSchema);

module.exports = SessionModel;