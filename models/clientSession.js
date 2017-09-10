const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

const ClientSessionSchema = mongoose.Schema({
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

const ClientSessionModel = mongoose.model("ClientSession", ClientSessionSchema);

module.exports = ClientSessionModel;