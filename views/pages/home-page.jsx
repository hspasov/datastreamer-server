import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Segment } from "semantic-ui-react";
import path from "path";
import RTC from "../../modules/rtc";
import DimmerComponent from "../components/dimmer-component.jsx";
import HomeMenuComponent from "../components/home-menu-component.jsx";
import FilesComponent from "../components/files-component.jsx";
import ImageViewerComponent from "../components/image-viewer-component.jsx";
import TextViewerComponent from "../components/text-viewer-component.jsx";
import SelectedFilesComponent from "../components/selected-files-component.jsx";
import fileChunkGenerator from "../../modules/file-chunk-generator";
import chunkArrayToText from "../../modules/chunk-array-to-text";
import { openDirectory, changePath, clearPath, navigateBack } from "../../store/actions/navigation";
import { setImage, removeImage } from "../../store/actions/image-viewer";
import { setText, saveText, removeText } from "../../store/actions/text-viewer";
import { logoutClient } from "../../store/actions/client";
import { disconnectClient } from "../../store/actions/provider";
import {
    clearSelection,
    showSelected
} from "../../store/actions/selection";
import {
    addFiles,
    changeFile,
    unlink,
    prepareDownload,
    clearFiles,
} from "../../store/actions/files";
import {
    setError,
    removeLoaderMessage,
    setLoaderMessage,
    deactivateDimmer
} from "../../store/actions/dimmer";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            downloadPercent: 0,
            uploads: []
        };

        this.timer = null;
        this.files = {};
        this.messageHandler = this.messageHandler.bind(this);
        this.chunkHandler = this.chunkHandler.bind(this);
        this.handleError = this.handleError.bind(this);
        this.pageActionHandler = this.pageActionHandler.bind(this);
        this.RTC = new RTC({
            connectionToken: this.props.provider.token,
            writeAccess: this.props.provider.writeAccess
        }, {
            handleMessage: this.messageHandler,
            handleChunk: this.chunkHandler,
            handleError: this.handleError,
            pageActionHandler: this.pageActionHandler
        });
    }

    componentWillMount() {
        this.props.clearFiles();
        this.props.clearPath();
        this.props.clearSelection();
        this.props.removeImage();
        this.props.removeText();
        this.props.setLoaderMessage("Connecting to server...");
    }

    componentWillUnmount() {
        this.RTC.socket.disconnect();
    }

    pageActionHandler(action) {
        action.bind(this)();
    }

    navigate(directoryPath) {
        console.log("execute navigate:", directoryPath);
        this.props.clearFiles();
        this.RTC.sendMessage("openDirectory", directoryPath);
    }

    resolveNavigateBack(directoryIndex) {
        this.props.navigateBack(directoryIndex);
        const directoryPath = path.join(...this.props.navigation.path.slice(0, directoryIndex));
        this.navigate(directoryPath);
    }

    resolveNavigateFront(directoryPath) {
        const directoryName = path.basename(directoryPath);
        this.props.openDirectory(directoryName);
        this.navigate(directoryPath);
    }

    copyFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("copyFile", file.path);
        });
        this.props.clearSelection();
    }

    moveFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("moveFile", file.path);
        });
        this.props.clearSelection();
    }

    deleteFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("deleteFile", file.path);
        });
        this.props.clearSelection();
    }

    sendFiles() {
        const reader = new FileReader();
        const chunkGenerator = fileChunkGenerator(this.state.uploads[0], reader, this.RTC.chunkSize);
        let received = 0;
        this.RTC.sendFileChannel.onbufferedamountlow = () => {
            if (received.value < this.state.uploads[0].size) {
                received = chunkGenerator.next();
            }
        };
        reader.onload = load => {
            this.RTC.sendFileChannel.send(load.target.result);
            if (received.value < this.state.uploads[0].size) {
                if (this.RTC.sendFileChannel.bufferedAmount < this.RTC.bufferLimit) {
                    received = chunkGenerator.next();
                }
            } else {
                chunkGenerator.return();
            }
        };
        received = chunkGenerator.next();
    }

    handleUploadFiles(files) {
        let file = files[0];
        this.setState({
            uploads: files
        });
        this.RTC.sendMessageWritable("uploadFile", {
            name: file.name,
            size: file.size
        });
    }



    // Adding each file to redux is very slow: each object in redux has to be immutable,
    // therefore to add new file to the array of files, a new array has to be created, and that is a slow operation.
    // But in order to display the files, they need to be in redux. Solution is function handleAddFile.
    // How it works: we have the first file put into "this.files" object, which is mutable
    // and when we call "clearTimeout(this.timer)". "this.timer" is null so
    // nothing happens, and then the setTimeout with 0 ms delay adds "this.props.addFiles(this.files)"
    // to the end of the execution stack. "this.props.addFiles(this.files)" quickly comes to execution
    // but that operation by itself is slow, and while it's being executed, numerous actions
    // to put a file in "this.files" are being placed in the execution stack. Each new action puts
    // new "this.props.addFiles(this.files);" to the end of the execution stack, but it also
    // removes the previous addition of it via clearTimeout call. In result, incoming files are not being blocked by
    // "this.props.addFiles(this.files);" and they are being quickly added to "this.files", and
    // when there are no more new files and no more clearTimeouts, the files are moved from "this.files"
    // to redux
    handleAddFile(file) {
        this.files[file.path] = {
            ...file,
            download: {
                status: "notInitialized"
            }
        };
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.props.addFiles(Object.values(this.files));
        }, 0);
    }

    handleRemoveFile(filePath) {
        delete this.files[filePath];
        this.props.unlink(filePath);
    }

    messageHandler (message) {
        switch (message.type) {
            case "scanFinished":
                this.props.removeLoaderMessage();
                break;
            case "readyForFile":
                this.sendFiles();
                break;
            case "newScan":
                this.props.clearFiles();
                this.files = {};
                break;
            case "add":
            case "addDir":
                this.handleAddFile(message.payload);
                break;
            case "change":
                this.props.changeFile(message.payload);
                break;
            case "unlink":
            case "unlinkDir":
                this.handleRemoveFile(message.payload);
                break;
        }
    }

    chunkHandler(chunk) {
        try {
            this.RTC.downloads[0].chunkArray.push(chunk);
            this.RTC.downloads[0].received += chunk.byteLength;
            console.log(chunk.byteLength);
            const percent = (this.RTC.downloads[0].received / this.RTC.downloads[0].size) * 100;
            // if (percent - this.state.downloadPercent > 10) {
            //     this.setState({
            //         downloadPercent: percent
            //     });
            // }
            if (this.RTC.downloads[0].received >= this.RTC.downloads[0].size) {
                this.finishDownload();
            } else {
                console.log(percent);
            }
        } catch (error) {
            console.log(error);
            this.RTC.downloads.shift();
            if (this.RTC.downloads.length > 0) {
                this.requestDownload();
            }
        }
    }

    saveText() {
        const file = new File(
            [this.props.textViewer.editedText],
            this.props.textViewer.fileName,
            { type: "text/plain" }
        );
        this.handleUploadFiles([file]);
        this.props.saveText();
    };

    finishDownload() {
        const downloaded = this.RTC.downloads.shift();
        try {
            console.log("end of file");
            this.setState({
                downloadPercent: 0
            });
            const received = new Blob(downloaded.chunkArray, { type: downloaded.mime });
            switch (downloaded.context) {
                case "file":
                    FileSaver.saveAs(received, path.basename(downloaded.path));
                    break;
                case "image":
                    this.props.setImage(URL.createObjectURL(received));
                    break;
                case "text":
                    this.props.setText(downloaded.name, chunkArrayToText(downloaded.chunkArray));
                    break;
            }
            if (this.RTC.downloads.length > 0) {
                this.requestDownload();
            }
        } catch (error) {
            console.log(error);
            if (this.RTC.downloads.length > 0) {
                this.requestDownload();
            }
        }
    }

    addToDownloads(file, context) {
        console.log("added to downloads");
        this.RTC.downloads.push({
            ...file,
            context,
            chunkArray: [],
            received: 0
        });
        if (this.RTC.downloads.length === 1) {
            console.log("requested downloada");
            this.requestDownload();
        }
    }

    requestDownload() {
        const download = this.RTC.downloads[0];
        this.RTC.sendMessage("downloadFile", download.path);
    }

    handleError(error) {
        switch (error.type) {
            case "generic":
                this.props.setError("Something went wrong.", error.message);
                break;
            case "connection":
                this.props.setError("Connection failure.", error.message);
                break;
            case "invalidToken":
                this.props.setError("Authentication failed.", error.message);
                this.props.disconnectClient();
                this.props.logoutClient();
                this.props.history.push("/login");
                break;
            case "sessionExpired":
                this.props.setError("Session expired.", error.message);
                this.props.disconnectClient();
                this.props.logoutClient();
                this.props.history.push("/login");
                break;
        }
        console.log(error);
    }

    render() {
        if (!this.props.client.token) {
            return <Redirect to="/login"></Redirect>;
        }
        if (!this.props.provider.token) {
            return <Redirect to="/connect"></Redirect>;
        }

        return <Segment>
            <HomeMenuComponent
                navigateBack={index => this.resolveNavigateBack(index)}
                saveText={() => this.saveText()}
                copyFiles={() => this.copyFiles()}
                moveFiles={() => this.moveFiles()}
                deleteFiles={() => this.deleteFiles()}
                clearSelection={() => this.props.clearSelection()}
                showSelected={() => this.props.showSelected()}
                handleUploadFiles={files => this.handleUploadFiles(files)}
            />
            <Segment padded="very" attached="top" color="grey">
                <DimmerComponent />
                <SelectedFilesComponent />
                {(this.props.imageViewer.show) ? <ImageViewerComponent /> :
                    (this.props.textViewer.show) ? <TextViewerComponent /> :
                        <FilesComponent
                            addToDownloads={(file, context) => this.addToDownloads(file, context)}
                            openDirectory={(path) => this.resolveNavigateFront(path)}
                        />
                }
            </Segment>
        </Segment>;
    }
}

const HomePage = withRouter(connect(store => {
    return {
        client: store.client,
        provider: store.provider,
        dimmer: store.dimmer,
        navigation: store.navigation,
        files: store.files,
        imageViewer: store.imageViewer,
        textViewer: store.textViewer,
        fileProperties: store.fileProperties,
        selection: store.selection,
        download: store.download
    };
}, {
    clearPath,
    clearFiles,
    clearSelection,
    showSelected,
    removeImage,
    removeText,
    removeLoaderMessage,
    navigateBack,
    openDirectory,
    addFiles,
    changeFile,
    unlink,
    setImage,
    setText,
    saveText,
    setError,
    setLoaderMessage,
    disconnectClient,
    logoutClient
})(Home));

export default HomePage;