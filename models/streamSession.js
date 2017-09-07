var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var StreamSessionSchema = mongoose.Schema({
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

var StreamSessionModel = mongoose.model('StreamSession', StreamSessionSchema);

module.exports = StreamSessionModel;