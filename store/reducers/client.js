const reducer = (state={username: null}, action) => {
    switch (action.type) {
        case "LOGIN_CLIENT":
            return {
                ...state,
                username: action.payload.username
            };
        case "LOGOUT_CLIENT":
            return {
                ...state,
                username: null
            };
    }
    return state;
}

export default reducer;