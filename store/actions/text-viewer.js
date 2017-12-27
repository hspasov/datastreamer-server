const setText = text => {
    return {
        type: "SET_TEXT",
        payload: text
    };
};

const removeText = () => {
    return { type: "REMOVE_TEXT" };
};

const editText = text => {
    return {
        type: "EDIT_TEXT",
        payload: text
    };
};

const openEditMode = () => {
    return { type: "OPEN_EDIT_MODE" };
};

const closeEditMode = () => {
    return { type: "CLOSE_EDIT_MODE" };
};

export {
    setText,
    removeText,
    editText,
    openEditMode,
    closeEditMode
};