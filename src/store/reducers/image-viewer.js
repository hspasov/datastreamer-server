const reducer = (state={ imageURL: "", show: false }, action) => {
    switch (action.type) {
        case "SET_IMAGE":
            return {
                ...state,
                show: true,
                imageURL: action.payload
            };
        case "REMOVE_IMAGE":
            return {
                ...state,
                show: false,
                imageURL: ""
            };
    }
    return state;
};

export default reducer;