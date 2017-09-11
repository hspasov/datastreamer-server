const reducer = (state={email: null, clientId: null}, action) => {
    switch (action.type) {
        case "LOGIN_CLIENT":
            return {
                ...state,
                email: action.payload.email,
                clientId: action.payload.clientId
            };
        case "LOGOUT_CLIENT":
            return {
                ...state,
                email: null,
                clientId: null
            };
    }
    return state;
}

export default reducer;