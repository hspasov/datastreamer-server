function addFile(file) {
    return {
        type: "ADD_FILE",
        payload: file
    };
}

function addDir(dir) {
    return {
        type: "ADD_DIR",
        payload: dir
    };
}

function changeFile(changed) {
    return {
        type: "CHANGE",
        payload: changed
    };
}

function unlink(file) {
    return {
        type: "UNLINK",
        payload: file
    };
}

function setThumbnail(filePath, imageURL) {
    return {
        type: "SET_THUMBNAIL",
        payload: {
            path: filePath,
            imageURL
        }
    };
}

function prepareDownload(file) {
    return {
        type: "PREPARE_DOWNLOAD",
        payload: file
    };
}

function finishDownload(file) {
    return {
        type: "FINISH_DOWNLOAD",
        payload: file
    };
}

function clearFiles() {
    return { type: "CLEAR_FILES" };
}

export {
    addFile,
    addDir,
    changeFile,
    unlink,
    setThumbnail,
    prepareDownload,
    finishDownload,
    clearFiles
}