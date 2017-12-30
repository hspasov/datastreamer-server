import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { Container, Form, Image, Item, Segment } from "semantic-ui-react";
import path from "path";
import RTC from "../../rtc_connection/client";
import DimmerComponent from "../components/dimmer-component";
import HomeMenuComponent from "../components/home-menu-component";
import File from "../components/file";
import fileChunkGenerator from "../../modules/file-chunk-generator";
import chunkArrayToText from "../../modules/chunk-array-to-text";
import { openDirectory, changePath, clearPath, navigateBack } from "../../store/actions/navigation";
import { setImage, removeImage } from "../../store/actions/image-viewer";
import { setText, editText, removeText } from "../../store/actions/text-viewer";
import { addToSelected, clearSelection } from "../../store/actions/selection";
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
        this.files = [];
        this.addToDownloads = this.addToDownloads.bind(this);
        this.requestDownload = this.requestDownload.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
        this.chunkHandler = this.chunkHandler.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.pageActionHandler = this.pageActionHandler.bind(this);
        this.moveFilesToState = this.moveFilesToState.bind(this);
        this.navigate = this.navigate.bind(this);
        this.resolveNavigateBack = this.resolveNavigateBack.bind(this);
        this.resolveNavigateFront = this.resolveNavigateFront.bind(this);
        this.copyFiles = this.copyFiles.bind(this);
        this.moveFiles = this.moveFiles.bind(this);
        this.deleteFiles = this.deleteFiles.bind(this);
        this.sendFiles = this.sendFiles.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.addToDownloads = this.addToDownloads.bind(this);
        this.RTC = new RTC({
            connectionToken: this.props.provider.token,
            writeAccess: this.props.provider.writeAccess
        }, {
            handleMessage: this.messageHandler,
            handleChunk: this.chunkHandler,
            handleError: this.errorHandler,
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

    moveFilesToState() {
        clearTimeout(this.timer);
        this.props.setScanningMessage();
        this.timer = setTimeout(() => {
            this.props.removeLoaderMessage();
            console.log("time's up");
        }, 100);
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

    handleInputChange(event) {
        let file = event.target.files[0];
        this.setState({
            uploads: event.target.files
        });
        console.log(file)
        this.RTC.sendMessageWritable("uploadFile", {
            name: file.name,
            size: file.size
        });
    }

    // Adding each file to redux is very slow: each object in redux has to be immutable,
    // therefore to add new file to the array of files, a new array has to be created, and that is a slow operation.
    // But in order to display the files, they need to be in redux. Solution is function handleAddFile.
    // How it works: we have the first file pushed into "this.files", a mutable array
    // and when we call "clearTimeout(this.timer)". "this.timer" is null so
    // nothing happens, and then the setTimeout with 0 ms delay adds "this.props.addFiles(this.files)"
    // to the end of the execution stack. "this.props.addFiles(this.files)" quickly comes to execution
    // but that operation by itself is very slow, and while it's being executed, numerous actions
    // to put a file in "this.files" are being placed in the execution stack. Each new action puts
    // new "this.props.addFiles(this.files);" to the end of the execution stack, but it also
    // removes the previous addition of it via clearTimeout call. In result, incoming files are not being blocked by
    // "this.props.addFiles(this.files);" and they are being quickly added to "this.files", and
    // when there are no more new files and no more clearTimeouts, the files are moved from "this.files"
    // to redux
    handleAddFile(file) {
        this.files.push({
            ...file,
            download: {
                status: "notInitialized"
            }
        });
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.props.addFiles(this.files);
        }, 0);
    }

    messageHandler (message) {
        switch (message.action) {
            case "scanFinished":
                this.props.removeLoaderMessage();
                break;
            case "readyForFile":
                this.sendFiles();
                break;
            case "newScan":
                this.props.clearFiles();
                this.files = [];
                break;
            case "add":
            case "addDir":
                this.handleAddFile(message.data);
                break;
            case "change":
                this.props.changeFile(message.data);
                break;
            case "unlink":
            case "unlinkDir":
                this.props.unlink(message.data);
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
                    this.props.setText(chunkArrayToText(downloaded.chunkArray));
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

    errorHandler(error) {
        switch (error.type) {
            case "generic":
                this.props.setError("Something went wrong.", error.message);
                break;
            case "connection":
                this.props.setError("Connection failure.", error.message);
                break;
            case "invalidToken":
                this.props.setError("Authentication failed.", error.message);
                break;
            case "sessionExpired":
                this.props.setError("Session expired.", error.message);
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

        const files = <Item.Group divided>
            {!this.props.dimmer.show && this.props.files.files.map((file, i) => {
                return <File
                    key={file.path}
                    fileData={file}
                    openDirectory={() => this.resolveNavigateFront(file.path)}
                    openImage={() => this.addToDownloads(file, "image")}
                    openText={() => this.addToDownloads(file, "text")}
                    downloadStatus={(file.type !== "directory") ? file.download.status : null}
                    addToDownloads={() => this.addToDownloads(file, "file")}
                    downloadPercent={/*(this.props.download.current && this.props.download.current.path === file.path) ? this.state.downloadPercent :*/ 0}
                    selectFile={() => this.props.addToSelected(file)}
                />
            })}
        </Item.Group>;

        const imageViewer = <div>
            <Image src={this.props.imageViewer.imageURL}/>
        </div>;

        const textViewerNormalMode = <pre>{this.props.textViewer.text}</pre>;
        const textViewerEditMode = <Form>
            <Form.TextArea onChange={event => this.props.editText(event.target.value)} value={this.props.textViewer.editedText} />
        </Form>;

        const textViewer = <Container>
            {
                (this.props.textViewer.editMode) ?
                    textViewerEditMode : textViewerNormalMode
            }
        </Container>;

        return <div>
            <HomeMenuComponent
                navigateBack={index => this.resolveNavigateBack(index)}
                copyFiles={() => this.copyFiles()}
                moveFiles={() => this.moveFiles()}
                deleteFiles={() => this.deleteFiles()}
                handleInputChange={this.handleInputChange}
            />
            <Segment padded="very" attached="top" color="grey">
                <DimmerComponent />
                {(this.props.imageViewer.show) ? imageViewer :
                    (this.props.textViewer.show) ? textViewer :
                        files
                }
            </Segment>
        </div>;
    }
}

const HomePage = connect(store => {
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
    setError,
    setLoaderMessage,
    addToSelected,
    editText
})(Home);

export default HomePage;