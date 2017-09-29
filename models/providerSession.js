const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

const ProviderSessionSchema = mongoose.Schema({
    socketId: {
        type: String,
        required: true
    },
    providerName: {
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

// "providersession" collection has to be empty on server startup.
// Delete all currently existing provider sessions, if any.
ProviderSessionModel.remove({}).then(removed => {
    if (removed.result.n > 0) {
        console.log(`Warning: ${removed.result.n} existing provider sessions found on server launch. Successfully removed.`);
    }
}).catch(error => {
    console.log(error);
});

module.exports = ProviderSessionModel;