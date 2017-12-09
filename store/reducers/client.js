const reducer = (state = { token: "" }, action) => {
    switch (action.type) {
        case "LOGIN_CLIENT":
            return {
                ...state,
                token: action.payload.token
            };
        case "LOGOUT_CLIENT":
            return {
                ...state,
                token: ""
            };
    }
    return state;
};

export default reducer;