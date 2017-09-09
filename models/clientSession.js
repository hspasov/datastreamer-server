var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var ClientSessionSchema = mongoose.Schema({
    socketId: {
        type: String,
        required: true
    },
    providerIds: {
        type: [String],
        required: true
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

var ClientSessionModel = mongoose.model('ClientSession', ClientSessionSchema);

module.exports = ClientSessionModel;