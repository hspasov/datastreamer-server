function setText(fileName, text) {
    return {
        type: "SET_TEXT",
        payload: {
            text,
            fileName
        }
    };
}

function removeText() {
    return { type: "REMOVE_TEXT" };
}

function editText(text) {
    return {
        type: "EDIT_TEXT",
        payload: text
    };
}

function saveText() {
    return { type: "SAVE_TEXT" };
}

function openEditMode() {
    return { type: "OPEN_EDIT_MODE" };
}

function closeEditMode() {
    return { type: "CLOSE_EDIT_MODE" };
}

export {
    setText,
    removeText,
    editText,
    saveText,
    openEditMode,
    closeEditMode
};