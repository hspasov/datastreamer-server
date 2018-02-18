function errorHandler(error) {
    console.error("There was an error performing the operation");
    console.log(error);
    console.log(error.code);
    return console.error(error.message);
}

function validationError(error, response) {
    Object.keys(error.errors).forEach(k => {
        let msg = error.errors[k].message;
        console.error("Validation error for \"%s" + ": %s", k, msg);
        return response.status(404).json({
            msg: "Please ensure requestuired fields are filled"
        });
    });
}

module.exports = {
    errorHandler: errorHandler,
    validationError: validationError
};