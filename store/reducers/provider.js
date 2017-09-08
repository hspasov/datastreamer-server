export default function reducer(
    state = {
        name: null,
        providerId: null
    }, action) {
    switch (action.type) {
        case "CONNECT_CLIENT": {
            return {
                ...state,
                name: action.payload.name,
                providerId: action.payload.providerId
            };
        }
        case "DISCONNECT_CLIENT": {
            return {
                ...state,
                name: null,
                providerId: null
            }
        }
    }
    return state;
}