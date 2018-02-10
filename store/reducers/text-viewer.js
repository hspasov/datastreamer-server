const initialState = {
    fileName: "",
    text: "",
    editedText: "",
    show: false,
    editMode: false
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case "SET_TEXT":
            return {
                ...state,
                show: true,
                text: action.payload.text,
                fileName: action.payload.fileName
            };
        case "REMOVE_TEXT":
            return {
                ...state,
                show: false,
                text: "",
                fileName: "",
            };
        case "EDIT_TEXT":
            return {
                ...state,
                editedText: action.payload
            };
        case "SAVE_TEXT":
            return {
                ...state,
                text: state.editedText
            };
        case "OPEN_EDIT_MODE":
            return {
                ...state,
                editMode: true,
                editedText: state.text
            };
        case "CLOSE_EDIT_MODE":
            return {
                ...state,
                editMode: false
            };
    }
    return state;
};

export default reducer;