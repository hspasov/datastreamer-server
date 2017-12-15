const add = (files, file) => {
    return files.concat([{
        ...file,
        download: {
            status: "notInitialized"
        }
    }]);
}

const addDir = (files, file) => {
    return files.concat([file]);
}

const change = (files, file) => {
    const removedOld = files.filter(f => f.path !== file.path);
    return file.type === "directory" ?
        addDir(removedOld, file) : add(removedOld, file);
}

const unlink = (files, file) => {
    return files.filter(f => f.path !== file.path);
}

const findFile = (files, path) => {
    return files.filter(file => file.path === path)[0];
}

const setThumbnail = (files, path, thumbnail) => {
    return files.map(f =>
        f.path === path ?
            {
                ...f,
                thumbnail
            } : f
    );
}

const prepareDownload = (files, file) => {
    return files.map(f =>
        f.path === file.path ?
            {
                ...f,
                download: {
                    status: "initialized",
                }
            } : f
    );
}

const finishDownload = (files, file) => {
    return files.map(f =>
        f.path === file.path ?
            {
                ...f,
                download: {
                    ...f.download,
                    status: "downloaded"
                }
            } : f
    );
}

export {
    add,
    addDir,
    change,
    unlink,
    prepareDownload,
    finishDownload,
    setThumbnail,
    findFile
};