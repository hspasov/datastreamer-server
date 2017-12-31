const reducer = (state = {selected: [], show: false}, action) => {
    switch (action.type) {
        case "ADD_TO_SELECTED":
            return {
                ...state,
                selected: state.selected.concat([action.payload])
            };
        case "REMOVE_FROM_SELECTED":
            return {
                ...state,
                selected: state.selected.filter(f => f.path !== action.payload)
            };
        case "SHOW_SELECTED":
            return {
                ...state,
                show: true
            };
            break;
        case "HIDE_SELECTED":
            return {
                ...state,
                show: false
            };
            break;
        case "CLEAR_SELECTION":
            return {
                ...state,
                selected: []
            };
    }
    return state;
};

export default reducer;