import React from "react";
import FileSaver from "file-saver";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import {
    Breadcrumb, Button, Container, Divider, Form,
    Header, Image, Item, Loader, Menu, Message,
    Progress, Segment
} from "semantic-ui-react";
import RTC from "../../rtc_connection/client";
import path from "path";
import uniqid from "uniqid";
import { findFile } from "../../modules/files";
import Thumbnail from "../components/thumbnail";
import DimmerComponent from "../components/dimmer-component";
import HomeMenuComponent from "../components/home-menu-component";
import File from "../components/file";
import { setError, removeError, setLoaderMessage, deactivateDimmer } from "../../store/actions/dimmer";
import {
    addFile,
    addDir,
    change,
    unlink,
    setThumbnail,
    prepareDownload,
    finishDownload,
    clearFiles,
} from "../../store/actions/files";
import {
    openDirectory,
    changePath,
    clearPath
} from "../../store/actions/navigation";
import { setImage } from "../../store/actions/image-viewer";
import { setText, editText } from "../../store/actions/text-viewer";
import { addToSelected, clearSelection } from "../../store/actions/selection";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isComponentUpdateAllowed: true,
            downloadPercent: 0,
            uploads: []
        };

        this.addToDownloads = this.addToDownloads.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.messageHandler = this.messageHandler.bind(this);
        this.chunkHandler = this.chunkHandler.bind(this);
        this.errorHandler = this.errorHandler.bind(this);
        this.executeNavigate = this.executeNavigate.bind(this);
        this.navigate = this.navigate.bind(this);
        this.copyFiles = this.copyFiles.bind(this);
        this.moveFiles = this.moveFiles.bind(this);
        this.deleteFiles = this.deleteFiles.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.getChunk = this.getChunk.bind(this);
        this.RTC = new RTC({
            connectionToken: this.props.provider.token,
            writeAccess: this.props.provider.writeAccess
        }, {
            handleMessage: this.messageHandler,
            handleChunk: this.chunkHandler,
            errorHandler: this.errorHandler
        });
    }

    componentWillMount() {
        this.props.dispatch(clearFiles());
        this.props.dispatch(clearPath());
        this.props.dispatch(clearSelection());
        this.props.dispatch(setLoaderMessage("Connecting to provider..."));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.isComponentUpdateAllowed;
    }

    componentWillUnmount() {
        this.RTC.socket.disconnect();
    }

    navigate(directoryPath) {
        const directoryName = path.basename(directoryPath);
        this.props.dispatch(openDirectory({
            name: directoryName,
            uid: uniqid()
        }));
        this.executeNavigate(directoryPath);
    }

    executeNavigate(directoryPath) {
        console.log("execute navigate:", directoryPath);
        this.props.dispatch(clearFiles());
        this.RTC.sendMessage("openDirectory", directoryPath);
    }

    copyFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("copyFile", file.path);
        });
        this.props.dispatch(clearSelection());
    }

    moveFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("moveFile", file.path);
        });
        this.props.dispatch(clearSelection());
    }

    deleteFiles() {
        this.props.selection.selected.forEach(file => {
            this.RTC.sendMessageWritable("deleteFile", file.path);
        });
        this.props.dispatch(clearSelection());
    }

    *getChunk(file, reader) {
        let offset = 0;
        let chunkSize = 32 * 1024;
        while (file.size > offset) {
            const slice = file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(slice);
            offset += chunkSize;
            yield offset;
        }
    }

    handleInputChange(event) {
        let file = event.target.files[0];
        this.setState({
            uploads: event.target.files
        });
        console.log(file);
        this.RTC.sendMessageWritable("uploadFile", {
            name: file.name,
            size: file.size
        });
    }

    messageHandler (message) {
        switch (message.action) {
            case "sendCurrentDirectory":
                this.setState({
                    isComponentUpdateAllowed: false,
                    currentDirectory: message.data.path,
                });
                this.props.dispatch(clearFiles());
                break;
            case "sendThumbnailSize":
                this.RTC.fileSize = message.data;
                this.RTC.sendMessage("readyForThumbnail");
                break;
            case "add":
                this.props.dispatch(addFile(message.data));
                break;
            case "addDir":
                this.props.dispatch(addDir(message.data));
                break;
            case "change":
                this.props.dispatch(changeFile(message.data));
                break;
            case "unlink":
            case "unlinkDir":
                this.props.dispatch(unlink(message.data));
                break;
            case "doneSending":
                this.props.dispatch(removeError());
                this.setState({ isComponentUpdateAllowed: true });
                break;
            case "readyForFile":
                const reader = new FileReader();
                const chunkGenerator = this.getChunk(this.state.uploads[0], reader);
                let offset = 0;
                reader.onload = a => {
                    this.RTC.sendFileChannel.send(a.target.result);
                    if (offset.value < this.state.uploads[0].size) {
                        offset = chunkGenerator.next();
                    }
                };
                offset = chunkGenerator.next();
            case "connectSuccess":
                console.log("Connect success!");
                break;
        }
    }

    chunkHandler(chunk) {
        this.RTC.receiveBuffer.push(chunk);
        this.RTC.receivedBytes += chunk.byteLength;
        console.log(chunk.byteLength);
        const percent = (this.RTC.receivedBytes / this.RTC.fileSize) * 100;
        if (percent - this.state.downloadPercent > 10) {
            this.setState({
                downloadPercent: percent
            });
        }
        if (this.RTC.receivedBytes >= this.RTC.fileSize) {
            console.log("end of file");
            this.setState({
                downloadPercent: 0
            });
            const file = findFile(this.props.files.files, this.RTC.downloads[0].path);
            const received = new Blob(this.RTC.receiveBuffer, { type: file.mime });
            switch(this.RTC.downloads[0].context) {
                case "download":
                    this.props.dispatch(finishDownload(file));
                    FileSaver.saveAs(received, path.basename(file.path));
                    break;
                case "thumbnail":
                    this.props.dispatch(setThumbnail(file.path, window.URL.createObjectURL(received)));
                    break;
                case "image":
                    this.props.dispatch(setImage(window.URL.createObjectURL(received)));
                    break;
                case "text":
                    let result = "";
                    const decoder = new TextDecoder();
                    for (let i = 0; i < this.RTC.receiveBuffer.length; i++) {
                        result += decoder.decode(this.RTC.receiveBuffer[i]);
                    }
                    this.props.dispatch(setText(result));
                    break;
            }
            this.RTC.receiveBuffer = [];
            this.RTC.receivedBytes = 0;
            this.RTC.fileSize = 0;
            this.RTC.downloads.shift();
            if (this.RTC.downloads.length >= 1) {
                const download = this.RTC.downloads[0];
                const file = findFile(this.props.files.files, download.path);
                console.log(`files to download: ${this.RTC.downloads.length}`);
                console.log(file);
                this.downloadFile(file, download.context);
            } else {
                console.log(`cant download more, length is ${this.RTC.downloads.length}`);
            }
        } else {

        }
    }

    downloadFile(file, context) {
        switch(context) {
            case "download":
                this.RTC.fileSize = file.size;
                this.props.dispatch(prepareDownload(file));
                this.RTC.sendMessage("downloadFile", file.path);
                break;
            case "thumbnail":
                this.RTC.sendMessage("getThumbnail", file.path);
                break;
            case "image":
                this.RTC.fileSize = file.size;
                this.RTC.sendMessage("getImage", file.path);
                break;
            case "text":
                this.RTC.fileSize = file.size;
                this.RTC.sendMessage("getText", file.path);
                break;
        }
    }

    addToDownloads(filePath, context) {
        this.RTC.downloads.push({ path: filePath, context });
        console.log(`added to downlads, length is ${this.RTC.downloads.length}`);
        if (this.RTC.downloads.length === 1) {
            const download = this.RTC.downloads[0];
            console.log(download);
            const file = findFile(this.props.files.files, download.path);
            console.log(file);
            this.downloadFile(file, context);
        }
    }

    errorHandler(error) {
        switch (error.type) {
            case "generic":
                this.props.dispatch(setError("Something went wrong.", error.message));
                break;
            case "connection":
                this.props.dispatch(setError("Connection failure.", error.message));
                break;
            case "invalidToken":
                this.props.dispatch(setError("Authentication failed.", error.message));
                break;
            case "sessionExpired":
                this.props.dispatch(setError("Session expired.", error.message));
                break;
        }
        this.setState({
            isComponentUpdateAllowed: true
        });
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
                    name={file.name}
                    type={file.type}
                    size={file.size}
                    access={file.access}
                    path={file.path}
                    mime={file.mime}
                    imageURL={file.imageURL}
                    openDirectory={() => this.navigate(file.path)}
                    openImage={() => this.addToDownloads(file.path, "image")}
                    openText={() => this.addToDownloads(file.path, "text")}
                    getThumbnail={() => this.addToDownloads(file.path, "thumbnail")}
                    downloadStatus={(file.type !== "directory") ? file.download.status : null}
                    addToDownloads={() => this.addToDownloads(file.path, "download")}
                    downloadPercent={(this.RTC.downloads.length > 0 && this.RTC.downloads[0].path === file.path) ? this.state.downloadPercent : 0}
                    selectFile={() => this.props.dispatch(addToSelected(file))}
                />
            })}
        </Item.Group>;

        const imageViewer = <div>
            <Image src={this.props.imageViewer.imageURL}/>
        </div>;

        const textViewerNormalMode = <pre>{this.props.textViewer.text}</pre>;
        const textViewerEditMode = <Form>
            <Form.TextArea onChange={event => this.props.dispatch(editText(event.target.value))} value={this.props.textViewer.editedText} />
        </Form>;

        const textViewer = <Container>
            {
                (this.props.textViewer.editMode) ?
                    textViewerEditMode : textViewerNormalMode
            }
        </Container>;

        return <div>
            <HomeMenuComponent
                executeNavigate={directoryPath => this.executeNavigate(directoryPath)}
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
        sidebar: store.sidebar,
        navigation: store.navigation,
        files: store.files,
        imageViewer: store.imageViewer,
        textViewer: store.textViewer,
        fileProperties: store.fileProperties,
        selection: store.selection
    };
})(Home);

export default HomePage;