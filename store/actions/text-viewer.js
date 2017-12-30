function setText(text) {
    return {
        type: "SET_TEXT",
        payload: text
    };
};

function removeText() {
    return { type: "REMOVE_TEXT" };
};

function editText(text) {
    return {
        type: "EDIT_TEXT",
        payload: text
    };
};

function openEditMode() {
    return { type: "OPEN_EDIT_MODE" };
};

function closeEditMode() {
    return { type: "CLOSE_EDIT_MODE" };
};

export {
    setText,
    removeText,
    editText,
    openEditMode,
    closeEditMode
};