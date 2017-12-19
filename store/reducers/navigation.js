const reducer = (state = { path: [] }, action) => {
    switch (action.type) {
        case "OPEN_DIR":
            return {
                ...state,
                path: state.path.concat([action.payload])
            };
        case "NAV_BACK":
            return {
                ...state,
                path: state.path.slice(0, action.payload)
            };
        case "CHANGE_PATH":
            return {
                ...state,
                path: action.payload
            };
        case "CLEAR_PATH":
            return {
                ...state,
                path: []
            };
    }
    return state;
};

export default reducer;