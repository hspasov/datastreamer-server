const reducer = (state = { visible: true }, action) => {
    switch (action.type) {
        case "TOGGLE_SIDEBAR":
            return {
                ...state,
                visible: !state.visible
            };
    }
    return state;
}

export default reducer;