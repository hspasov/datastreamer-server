const reducer = (state={token: "", username: "", writeAccess: false}, action) => {
    switch (action.type) {
        case "CONNECT_CLIENT":
            return {
                ...state,
                token: action.payload.token,
                username: action.payload.username,
                writeAccess: action.payload.writable
            };
        case "DISCONNECT_CLIENT":
            return {
                ...state,
                token: "",
                username: "",
                writeAccess: false
            };
    }
    return state;
}

export default reducer;