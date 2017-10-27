const reducer = (state={token: null}, action) => {
    switch (action.type) {
        case "CONNECT_CLIENT":
            return {
                ...state,
                token: action.payload.token
            };
        case "DISCONNECT_CLIENT":
            return {
                ...state,
                token: null
            }
    }
    return state;
}

export default reducer;