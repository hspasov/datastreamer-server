const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");

const ProviderSchema = mongoose.Schema({
    name: {
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

ProviderSchema.methods.generateHash = password => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

ProviderSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

const ProviderModel = mongoose.model("Provider", ProviderSchema);

module.exports = ProviderModel;