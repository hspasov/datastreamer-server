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

// "clientsession" collection has to be empty on server startup.
// Delete all currently existing client sessions, if any.
ClientSessionModel.remove({}).then(removed => {
    if (removed.result.n > 0) {
        console.log(`Warning: ${removed.result.n} existing client sessions found on server launch. Successfully removed.`);
    }
}).catch(error => {
    console.log(error);
});

module.exports = ClientSessionModel;