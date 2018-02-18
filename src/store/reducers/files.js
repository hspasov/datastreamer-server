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
            return {
                ...state,
                files: state.files.filter(f => {
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
        case "SORT_FILES_BY_NAME_ASC":
            return {
                ...state,
                files: state.files.sort((file1, file2) => {
                    let name1 = file1.name.toLowerCase();
                    let name2 = file2.name.toLowerCase();
                    if (name1 > name2) {
                        return 1;
                    } else if (name1 < name2) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
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