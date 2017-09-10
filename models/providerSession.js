const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

const ProviderSessionSchema = mongoose.Schema({
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

const ProviderSessionModel = mongoose.model("ProviderSession", ProviderSessionSchema);

module.exports = ProviderSessionModel;