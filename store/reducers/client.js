export default function reducer(
    state = {
        email: null,
        clientId: null
    }, action) {
    switch (action.type) {
        case "LOGIN_CLIENT": {
            console.log(action.payload);
            return {
                ...state,
                email: action.payload.email,
                clientId: action.payload.clientId
            };
        }
        case "LOGOUT_CLIENT": {
            return {
                ...state,
                email: null,
                clientId: null
            };
        }
    }
    return state;
}