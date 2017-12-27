const reducer = (state = { text: "", editedText: "", show: false, editMode: false }, action) => {
    switch (action.type) {
        case "SET_TEXT":
            return {
                ...state,
                show: true,
                text: action.payload
            };
        case "REMOVE_TEXT":
            return {
                ...state,
                show: false,
                text: ""
            };
        case "EDIT_TEXT":
            return {
                ...state,
                editedText: action.payload
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