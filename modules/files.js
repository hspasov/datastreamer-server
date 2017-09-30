class Files {
    constructor(props) {
        this.files = [];

        this.add = this.add.bind(this);
        this.addDir = this.addDir.bind(this);
        this.change = this.change.bind(this);
        this.unlink = this.unlink.bind(this);
        this.getFile = this.getFile.bind(this);
        this.prepareDownload = this.prepareDownload.bind(this);
        this.finishDownload = this.finishDownload.bind(this);
        this.clearFiles = this.clearFiles.bind(this);
    }

    add(file) {
        this.files = this.files.concat([{
            ...file,
            download: {
                status: "notInitialized"
            }
        }]);
        return this.files;
    }

    addDir(file) {
        this.files = this.files.concat([file]);
        return this.files;
    }

    change(file) {
        this.files = this.files.filter(f => {
            return f.path !== file.path;
        });

        if (file.type === "directory") {
            this.files = this.files.concat([file]);
        } else {
            this.files = this.files.concat([{
                ...file,
                download: {
                    status: "notInitialized"
                }
            }]);
        }
        return this.files;
    }

    unlink(file) {
        this.files = this.files.filter(f => {
            return f.path !== file.path;
        });
        return this.files;
    }

    getFile(path) {
        return this.files.filter(file => file.path === path)[0];
    }

    prepareDownload(file) {
        this.files = this.files.map(f => {
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
        return this.files;
    }

    finishDownload(file) {
        let downloaded = null;
        this.files = this.files.map(f => {
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

    clearFiles() {
        this.files = [];
        return this.files;
    }
}

export default Files;