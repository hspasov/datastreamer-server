const defaultState = {
    show: true,
    loaderMessage: "",
    dismissible: false,
    error: {
        show: false,
        message: "",
        more: {
            show: false,
            message: ""
        }
    }
}

const reducer = (state = defaultState, action) => {
    switch (action.type) {
        case "ACTIVATE":
            return {
                ...state,
                show: true
            };
        case "DEACTIVATE":
            return {
                ...state,
                show: false
            };
        case "SET_LOADER_MESSAGE":
            return {
                ...state,
                show: true,
                loaderMessage: action.payload,
                dismissible: false,
                error: {
                    ...state.error,
                    show: false
                }
            };
        case "REMOVE_LOADER_MESSAGE":
            return {
                ...state,
                show: false,
                loaderMessage: ""
            };
        case "SET_ERROR":
            return {
                ...state,
                show: true,
                dismissible: true,
                error: {
                    ...state.error,
                    show: true,
                    message: action.payload.message,
                    more: {
                        ...state.error.more,
                        message: action.payload.more.message
                    }
                }
            };
        case "REMOVE_ERROR":
            return {
                ...state,
                show: false,
                error: {
                    ...state.error,
                    show: false,
                    message: "",
                    more: {
                        ...state.error.more,
                        message: ""
                    }
                }
            };
        case "TOGGLE_ERROR_MORE":
            return {
                ...state,
                error: {
                    ...state.error,
                    more: {
                        ...state.error.more,
                        show: !state.error.more.show
                    }
                }
            };
    }
    return state;
};

export default reducer;