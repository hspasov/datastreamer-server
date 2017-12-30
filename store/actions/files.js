function addFiles(files) {
    return {
        type: "ADD_FILES",
        payload: files
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
    addFiles,
    changeFile,
    unlink,
    prepareDownload,
    finishDownload,
    clearFiles
}