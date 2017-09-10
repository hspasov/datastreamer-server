const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

const ClientSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    created_on: {
        type: Date,
        default: Date.now
    }
});

ClientSchema.methods.generateHash = password => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

ClientSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

const ClientModel = mongoose.model("Client", ClientSchema);

module.exports = ClientModel;