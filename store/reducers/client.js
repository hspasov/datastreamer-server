const reducer = (state = { token: null }, action) => {
    switch (action.type) {
        case "LOGIN_CLIENT":
            return {
                ...state,
                token: action.payload.token
            };
        case "LOGOUT_CLIENT":
            return {
                ...state,
                token: null
            };
    }
    return state;
};

export default reducer;