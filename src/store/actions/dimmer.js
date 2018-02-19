function activateDimmer() {
    return { type: "ACTIVATE" };
}

function deactivateDimmer() {
    return { type: "DEACTIVATE" };
}

function setLoaderMessage(message) {
    return {
        type: "SET_LOADER_MESSAGE",
        payload: message
    };
}

function removeLoaderMessage() {
    return { type: "REMOVE_LOADER_MESSAGE" };
}

function setError(errorMessage, errorMessageMore) {
    return {
        type: "SET_ERROR",
        payload: {
            message: errorMessage.toString(),
            more: {
                message: errorMessageMore.toString()
            }
        }
    };
}

function removeError() {
    return { type: "REMOVE_ERROR" };
}

function toggleErrorMore() {
    return { type: "TOGGLE_ERROR_MORE" };
}

export {
    activateDimmer,
    deactivateDimmer,
    setLoaderMessage,
    removeLoaderMessage,
    setError,
    removeError,
    toggleErrorMore
}