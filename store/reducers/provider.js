const reducer = (state={token: "", username: ""}, action) => {
    switch (action.type) {
        case "CONNECT_CLIENT":
            return {
                ...state,
                token: action.payload.token,
                username: action.payload.username
            };
        case "DISCONNECT_CLIENT":
            return {
                ...state,
                token: "",
                username: ""
            }
    }
    return state;
}

export default reducer;