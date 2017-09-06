function errorHandler(error) {
    console.error('There was an error performing the operation');
    console.log(error);
    console.log(error.code);
    return console.error(error.message);
}

module.exports = {
    errorHandler: errorHandler
};