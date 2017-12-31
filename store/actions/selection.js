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

function showSelected() {
    return { type: "SHOW_SELECTED" };
}

function hideSelected() {
    return { type: "HIDE_SELECTED" };
}

function clearSelection() {
    return { type: "CLEAR_SELECTION" };
};

export {
    addToSelected,
    removeFromSelected,
    clearSelection,
    showSelected,
    hideSelected
};