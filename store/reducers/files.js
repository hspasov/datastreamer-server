const reducer = (state = { files: [] }, action) => {
    switch (action.type) {
        case "ADD_FILES":
            return {
                ...state,
                files: action.payload
            };
        case "CHANGE":
            const file = action.payload;
            const filesWithoutOld = state.files.filter(f => f.path !== file.path);
            return {
                ...state,
                files: (file.type === "directory") ?
                    filesWithoutOld.concat([file]) :
                    filesWithoutOld.concat([{
                        ...file,
                        download: {
                            status: "notInitialized"
                        }
                    }])
            };
        case "UNLINK":
            console.log("inside unlink");
            console.log(action.payload);
            return {
                ...state,
                files: state.files.filter(f => {
                    console.log(f.path !== action.payload);
                    console.log(f.path);
                    return f.path !== action.payload;
                })
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