const reducer = (state={username: null}, action) => {
    switch (action.type) {
        case "CONNECT_CLIENT":
            return {
                ...state,
                username: action.payload.username
            };
        case "DISCONNECT_CLIENT":
            return {
                ...state,
                username: null
            }
    }
    return state;
}

export default reducer;