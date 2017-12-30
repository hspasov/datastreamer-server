function addToSelected(file) {
    return {
        type: "ADD_TO_SELECTED",
        payload: file
    };
};

function removeFromSelected(filePath) {
    return {
        type: "REMOVE_FROM_SELECTED",
        payload: filePath
    };
};

function clearSelection() {
    return { type: "CLEAR_SELECTION" };
};

export {
    addToSelected,
    removeFromSelected,
    clearSelection
};