const reducer = (state = {selected: []}, action) => {
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
        case "CLEAR_SELECTION":
            return {
                ...state,
                selected: []
            };
    }
    return state;
};

export default reducer;