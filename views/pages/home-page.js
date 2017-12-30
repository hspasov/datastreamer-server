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
import { setError, removeError, setLoaderMessage, deactivateDimmer } from "../../store/actions/dimmer";
import { openDirectory, changePath, clearPath, navigateBack } from "../../store/actions/navigation";
import { setImage, removeImage } from "../../store/actions/image-viewer";
import { setText, editText, removeText } from "../../store/actions/text-viewer";
import { addToSelected, clearSelection } from "../../store/actions/selection";
import {
    addFile,
    addDir,
    changeFile,
    unlink,
    prepareDownload,
    clearFiles,
} from "../../store/actions/files";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            downloadPercent: 0,
            uploads: []
        };

        this.addToDownloads = this.addToDownloads.bind(this);
        this.requestDownload = this.requestDownload.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
        this.chunkHandler = this.chunkHandler.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
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
            handleError: this.errorHandler
        });
    }

    componentWillMount() {
        this.props.clearFiles();
        this.props.clearPath();
        this.props.clearSelection();
        this.props.removeImage();
        this.props.removeText();
        this.props.setLoaderMessage("Connecting to provider...");
    }

    componentWillUnmount() {
        this.RTC.socket.disconnect();
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
        this.RTC.sendMessageWritable("uploadFile", {
            name: file.name,
            size: file.size
        });
    }

    messageHandler (message) {
        switch (message.action) {
            case "sendCurrentDirectory":
                this.props.clearFiles();
                break;
            case "add":
                this.props.addFile(message.data);
                break;
            case "addDir":
                this.props.addDir(message.data);
                break;
            case "change":
                this.props.changeFile(message.data);
                break;
            case "unlink":
            case "unlinkDir":
                this.props.unlink(message.data);
                break;
            case "doneSending":
                this.props.removeError();
                break;
            case "readyForFile":
                this.sendFiles();
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
        console.log(download);
        switch (download.context) {
            case "file":
                this.RTC.sendMessage("downloadFile", download.path);
                break;
            case "image":
                this.RTC.sendMessage("getImage", download.path);
                break;
            case "text":
                this.RTC.sendMessage("getText", download.path);
                break;
        }
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
            {this.props.files.files.map((file, i) => {
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
                {(this.props.imageViewer.show)? imageViewer : (this.props.textViewer.show) ? textViewer : files}
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
    removeError,
    navigateBack,
    openDirectory,
    addFile,
    addDir,
    changeFile,
    unlink,
    setImage,
    setText,
    setError,
    addToSelected,
    editText
})(Home);

export default HomePage;