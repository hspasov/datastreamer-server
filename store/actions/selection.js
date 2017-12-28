const addToSelected = file => {
    return {
        type: "ADD_TO_SELECTED",
        payload: file
    };
};

const removeFromSelected = filePath => {
    return {
        type: "REMOVE_FROM_SELECTED",
        payload: filePath
    };
};

const clearSelection = () => {
    return { type: "CLEAR_SELECTION" };
};

export {
    addToSelected,
    removeFromSelected,
    clearSelection
};