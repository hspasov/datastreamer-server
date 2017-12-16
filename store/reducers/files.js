const reducer = (state = { files: [] }, action) => {
    switch (action.type) {
        case "ADD_FILE":
            return {
                ...state,
                files: state.files.concat([{
                    ...action.payload,
                    download: {
                        status: "notInitialized"
                    }
                }])
            };
        case "ADD_DIR":
            return {
                ...state,
                files: state.files.concat([action.payload])
            };
        case "CHANGE":
            const file = action.payload;
            const filesWithoutOld = state.files.filter(f => f.path !== file.path);
            return {
                ...state,
                files: (file.type === "directory") ?
                    state.files.concat([file]) :
                    state.files.concat([{
                        ...file,
                        download: {
                            status: "notInitialized"
                        }
                    }])
            };
        case "UNLINK":
            return {
                ...state,
                files: state.files.filter(f => f.path !== action.payload.path)
            };
        case "SET_THUMBNAIL":
            return {
                ...state,
                files: state.files.map(f =>
                    f.path === action.payload.path ?
                        {
                            ...f,
                            imageURL: action.payload.imageURL
                        } : f
                )
            };
        case "PREPARE_DOWNLOAD":
            return {
                ...state,
                files: state.files.map(f =>
                    f.path === action.payload.path ?
                        {
                            ...f,
                            download: {
                                status: "initialized"
                            }
                        } : f
                )
            };
        case "FINISH_DOWNLOAD":
            return {
                ...state,
                files: state.files.map(f =>
                    f.path === action.payload.path ?
                        {
                            ...f,
                            download: {
                                ...f.download,
                                status: "downloaded"
                            }
                        } : f
                )
            };
        case "CLEAR_FILES":
            return {
                ...state,
                files: []
            };
    }
    return state;
};

export default reducer;