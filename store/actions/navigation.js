function openDirectory(folderName) {
    return {
        type: "OPEN_DIR",
        payload: folderName
    }
}

function navigateBack(directoryIndex) {
    return {
        type: "NAV_BACK",
        payload: directoryIndex
    }
}

function changePath(newPath) {
    return {
        type: "CHANGE_PATH",
        payload: newPath
    }
}

function clearPath() {
    return {
        type: "CLEAR_PATH",
        payload: []
    }
}

export {
    openDirectory,
    navigateBack,
    changePath,
    clearPath
};