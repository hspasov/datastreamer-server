const reducer = (state={token: ""}, action) => {
    switch (action.type) {
        case "CONNECT_CLIENT":
            return {
                ...state,
                token: action.payload.token
            };
        case "DISCONNECT_CLIENT":
            return {
                ...state,
                token: ""
            }
    }
    return state;
}

export default reducer;