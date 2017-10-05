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

const prepareDownload = (files, file) => {
    return files.map(f => {
        if (f.path === file.path) {
            const download = {
                status: "initialized",
                mime: file.mime
            };
            return {
                ...f,
                download
            };
        } else {
            return f;
        }
    });
}

const finishDownload = (files, file) => {
    let downloaded = null;
    files = files.map(f => {
        if (f.path === file.path) {
            const download = {
                ...f.download,
                status: "downloaded"
            };
            downloaded = {
                ...f,
                download
            };
            return downloaded;
        } else {
            return f;
        }
    });
    return downloaded;
}

export {
    add,
    addDir,
    change,
    unlink,
    prepareDownload,
    finishDownload,
    findFile
};