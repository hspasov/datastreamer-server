const reducer = (state = { text: "", show: false }, action) => {
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
    }
    return state;
};

export default reducer;