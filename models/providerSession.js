var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var ProviderSessionSchema = mongoose.Schema({
    socketId: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    clientSocketIds: {
        type: [String]
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

var ProviderSessionModel = mongoose.model('ProviderSession', ProviderSessionSchema);

module.exports = ProviderSessionModel;